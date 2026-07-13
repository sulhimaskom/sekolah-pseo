#!/usr/bin/env node

/**
 * @module check-workflow-security
 * @description Automated security regression checker for GitHub Action workflow files.
 *
 * Validates workflow files (.github/workflows/*.yml) against known security
 * invariants that have regressed multiple times in this repository.
 *
 * SECURITY_AUDIT_NOTE.md documents 6 audit passes where the same issues
 * were found and re-fixed. This script prevents future regressions by
 * failing CI/pre-commit when forbidden patterns appear.
 *
 * Usage:
 *   node scripts/check-workflow-security.js          # Check all workflow files
 *   node scripts/check-workflow-security.js --fix     # Check all (read-only, no fix)
 *   node scripts/check-workflow-security.js --json    # JSON output for CI
 */

'use strict';

const fs = require('fs');
const path = require('path');

const WORKFLOW_DIR = path.join(__dirname, '..', '.github', 'workflows');
const ALLOWED_OVERRIDES = [
  // Workflows that legitimately need elevated permissions (merge workflows)
  'on-pull.yml', // merge PR handler
];

// ── Forbidden patterns ──────────────────────────────────────────────────────
// Each entry: { pattern, fileMatch, description, severity, exclude }

const RULES = [
  {
    id: 'DUPLICATE_API_KEY',
    description: 'API_KEY must not be a duplicate of GEMINI_API_KEY',
    severity: 'CRITICAL',
    type: 'forbidden_env_var_pair',
    envVar: 'API_KEY',
    allowedOnlyWith: 'IFLOW_API_KEY', // API_KEY is only ok if pointing to a different secret
    // Check: if API_KEY appears, and GEMINI_API_KEY also appears, API_KEY must reference a DIFFERENT secret
    check: content => {
      const hasApiKey = /\bAPI_KEY:\s*\${{/.test(content);
      const hasGeminiKey = /GEMINI_API_KEY:\s*\${{/.test(content);
      const apiKeyValue = content.match(/\bAPI_KEY:\s*\${{([^}]+)}}/);
      const geminiValue = content.match(/GEMINI_API_KEY:\s*\${{([^}]+)}}/);

      if (hasApiKey && hasGeminiKey) {
        if (apiKeyValue && geminiValue && apiKeyValue[1].trim() === geminiValue[1].trim()) {
          return {
            pass: false,
            message: `API_KEY references same secret (${apiKeyValue[1].trim()}) as GEMINI_API_KEY — use a distinct secret or remove the duplicate`,
          };
        }
      }
      return { pass: true };
    },
  },
  {
    id: 'ID_TOKEN_WRITE',
    description: 'id-token: write must not appear in non-OIDC workflows',
    severity: 'HIGH',
    check: (content, filePath) => {
      const match = content.match(/^\s*id-token:\s*write\s*$/m);
      if (match) {
        const filename = path.basename(filePath);
        if (ALLOWED_OVERRIDES.includes(filename)) {
          return { pass: true, note: `Allowed in ${filename} (merge workflow)` };
        }
        return {
          pass: false,
          line: content.substring(0, match.index).split('\n').length,
          message: 'Found "id-token: write" in non-OIDC workflow — remove unless OIDC is required',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'ACTIONS_WRITE_NON_MERGE',
    description: 'actions: write must not appear in non-merge workflows',
    severity: 'HIGH',
    check: (content, filePath) => {
      const match = content.match(/^\s*actions:\s*write\s*$/m);
      if (match) {
        const filename = path.basename(filePath);
        if (ALLOWED_OVERRIDES.includes(filename)) {
          return { pass: true, note: `Allowed in ${filename} (merge workflow)` };
        }
        return {
          pass: false,
          line: content.substring(0, match.index).split('\n').length,
          message:
            'Found "actions: write" in non-merge workflow — remove unless the workflow needs to merge PRs',
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'GH_TOKEN_INSTEAD_OF_GITHUB_TOKEN',
    description: 'Use secrets.GITHUB_TOKEN not secrets.GH_TOKEN',
    severity: 'HIGH',
    check: content => {
      const matches = content.match(/secrets\.GH_TOKEN\b/g);
      if (matches) {
        return {
          pass: false,
          message: `Found ${matches.length} occurrence(s) of 'secrets.GH_TOKEN' — use 'secrets.GITHUB_TOKEN' instead`,
        };
      }
      return { pass: true };
    },
  },
  {
    id: 'CHECKOUT_TOKEN_DISCREPANCY',
    description: 'actions/checkout should use GITHUB_TOKEN not GH_TOKEN',
    severity: 'MEDIUM',
    check: () => {
      // This is a variant of the GH_TOKEN check — already covered by the rule above
      return { pass: true };
    },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function findWorkflowFiles() {
  try {
    // Try glob if available (from glob package, commonly installed)
    const files = fs
      .readdirSync(WORKFLOW_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    return files.map(f => ({
      filename: f,
      path: path.join(WORKFLOW_DIR, f),
      content: fs.readFileSync(path.join(WORKFLOW_DIR, f), 'utf8'),
    }));
  } catch (err) {
    console.error(`Error reading workflow directory: ${WORKFLOW_DIR}`);
    console.error(err.message);
    process.exit(1);
  }
}

function checkFile(file) {
  const violations = [];

  for (const rule of RULES) {
    try {
      const result = rule.check(file.content, file.path);
      if (!result.pass) {
        violations.push({
          rule: rule.id,
          severity: rule.severity,
          description: rule.description,
          file: file.filename,
          line: result.line || null,
          message: result.message,
        });
      }
    } catch (err) {
      violations.push({
        rule: rule.id,
        severity: 'ERROR',
        description: rule.description,
        file: file.filename,
        message: `Check threw exception: ${err.message}`,
      });
    }
  }

  return violations;
}

function run() {
  const files = findWorkflowFiles();
  let allViolations = [];
  const resultsByFile = {};

  for (const file of files) {
    const violations = checkFile(file);
    if (violations.length > 0) {
      resultsByFile[file.filename] = violations;
      allViolations = allViolations.concat(violations);
    }
  }

  // ── Output ──────────────────────────────────────────────────────────────
  const formatJson = process.argv.includes('--json');

  if (formatJson) {
    console.log(
      JSON.stringify(
        {
          passed: allViolations.length === 0,
          totalFiles: files.length,
          totalViolations: allViolations.length,
          violations: allViolations,
          checkedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } else {
    console.log('\n\u{1F512} Workflow Security Regression Check');
    console.log('   Files checked: ' + files.length);
    console.log('   Rules applied: ' + RULES.length);
    console.log('');

    if (allViolations.length === 0) {
      console.log('   ✅ All checks passed — no security regressions detected.\n');
      process.exit(0);
    }

    console.log(`   ❌ Found ${allViolations.length} violation(s):\n`);

    for (const v of allViolations) {
      const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'HIGH' ? '🟠' : '🟡';
      console.log(`   ${icon} [${v.severity}] ${v.rule}`);
      console.log(`      File: ${v.file}${v.line ? `:${v.line}` : ''}`);
      console.log(`      ${v.description}`);
      console.log(`      ${v.message}`);
      console.log('');
    }

    process.exit(1);
  }
}

run();
