#!/usr/bin/env node

/**
 * Interactive CLI Menu for Sekolah PSEO
 *
 * Provides an interactive menu for common development tasks.
 * Uses Node.js built-in readline (no external dependencies).
 * Falls back to non-interactive mode when stdin is not a TTY.
 *
 * Usage:
 *   node scripts/interactive.js
 */

'use strict';

const { execSync } = require('child_process');
const readline = require('readline');

const SCRIPTS = {
  Development: [
    { label: 'Dev (lint + test JS)', cmd: 'npm run dev' },
    { label: 'Build all pages', cmd: 'npm run build' },
  ],
  'Data Pipeline': [
    { label: 'Run ETL', cmd: 'npm run etl' },
    { label: 'Fetch external data', cmd: 'npm run fetch-data' },
    { label: 'Check data freshness', cmd: 'npm run check-freshness' },
    { label: 'Generate freshness report', cmd: 'npm run freshness-report' },
  ],
  Testing: [
    { label: 'All tests', cmd: 'npm test' },
    { label: 'JavaScript tests', cmd: 'npm run test:js' },
    { label: 'Python tests', cmd: 'npm run test:py' },
    { label: 'JS tests with coverage', cmd: 'npm run test:js:coverage' },
  ],
  Validation: [
    { label: 'Validate internal links', cmd: 'npm run validate-links' },
    { label: 'Generate sitemap', cmd: 'npm run sitemap' },
  ],
  Utilities: [
    { label: 'Lint code', cmd: 'npm run lint' },
    { label: 'Format code', cmd: 'npm run format' },
    { label: 'Check formatting', cmd: 'npm run format:check' },
  ],
};

/**
 * Display a numbered list and prompt for selection.
 * @param {string} title
 * @param {Array<{label: string}>} items
 * @param {readline.Interface} rl
 * @returns {Promise<number>} 0-based index, or -1 for back/exit
 */
async function pickFromList(title, items, rl) {
  console.log(`\n  ${title}`);
  console.log('  ' + '='.repeat(title.length + 1));

  for (let i = 0; i < items.length; i++) {
    console.log(`  ${String(i + 1).padStart(2)}. ${items[i].label}`);
  }
  console.log(`  ${String(items.length + 1).padStart(2)}. Back to main menu`);

  const answer = await rl.question('\n  Select option: ');
  const choice = parseInt(answer, 10);

  if (isNaN(choice) || choice < 1 || choice > items.length + 1) {
    console.log('  Invalid option. Please try again.');
    return -2; // retry
  }

  if (choice === items.length + 1) {
    return -1; // back
  }

  return choice - 1; // 0-based
}

/**
 * Run a shell command and return its status.
 * @param {string} cmd
 * @param {string} label
 * @returns {boolean} true if command succeeded
 */
function runCommand(cmd, label) {
  console.log(`\n  Running: ${label}`);
  console.log(`  Command: ${cmd}`);
  console.log('  ' + '-'.repeat(40));

  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`\n  ✓ ${label} completed successfully.`);
    return true;
  } catch (err) {
    console.error(`\n  ✗ ${label} failed with status ${err.status}`);
    return false;
  }
}

/**
 * Prompt to continue (press Enter)
 * @param {readline.Interface} rl
 */
async function pressEnter(rl) {
  await rl.question('\n  Press Enter to continue...');
}

/**
 * Main menu loop.
 * @param {readline.Interface} rl
 */
async function mainMenu(rl) {
  const categories = Object.keys(SCRIPTS);

  while (true) {
    console.clear();
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║        SEkolah PSEO - CLI Menu          ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
    console.log('  Choose a category:\n');

    for (let i = 0; i < categories.length; i++) {
      console.log(`  ${String(i + 1).padStart(2)}. ${categories[i]}`);
    }

    console.log(`  ${String(categories.length + 1).padStart(2)}. Exit`);

    const answer = await rl.question('\n  Select option: ');
    const choice = parseInt(answer, 10);

    if (isNaN(choice) || choice < 1 || choice > categories.length + 1) {
      console.log('  Invalid option. Please try again.');
      await pressEnter(rl);
      continue;
    }

    if (choice === categories.length + 1) {
      console.log('\n  Goodbye!\n');
      rl.close();
      return;
    }

    const category = categories[choice - 1];
    const items = SCRIPTS[category];

    while (true) {
      console.clear();
      const idx = await pickFromList(category, items, rl);

      if (idx === -1) {
        break; // back to main
      }

      if (idx === -2) {
        await pressEnter(rl);
        continue; // retry
      }

      const selected = items[idx];
      runCommand(selected.cmd, selected.label);
      await pressEnter(rl);
    }
  }
}

// --- Entry point ---

async function main() {
  if (!process.stdin.isTTY) {
    // Non-interactive mode: print help
    console.log('Sekolah PSEO Interactive CLI');
    console.log('');
    console.log('Available npm scripts:');
    const pkg = require('../package.json');
    const scripts = pkg.scripts || {};
    for (const [name, cmd] of Object.entries(scripts)) {
      console.log(`  npm run ${name.padEnd(25)} ${cmd}`);
    }
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await mainMenu(rl);
  } catch (err) {
    console.error('Error:', err.message);
    rl.close();
    process.exit(1);
  }
}

main();
