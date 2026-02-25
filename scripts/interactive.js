#!/usr/bin/env node

/**
 * Interactive CLI Menu for Sekolah PSEO
 * Provides an interactive menu to run common development tasks
 * 
 * Usage: node scripts/interactive.js
 *        npm run interactive
 */

const { prompt } = require('inquirer');
const { execSync } = require('child_process');
const path = require('path');

// Available menu options
const menuOptions = [
  {
    name: 'etl',
    value: 'etl',
    label: 'ETL',
    description: 'Run data processing pipeline',
    command: 'npm run etl'
  },
  {
    name: 'build',
    value: 'build',
    label: 'Build',
    description: 'Generate static pages',
    command: 'npm run build'
  },
  {
    name: 'sitemap',
    value: 'sitemap',
    label: 'Sitemap',
    description: 'Generate sitemap.xml',
    command: 'npm run sitemap'
  },
  {
    name: 'validate',
    value: 'validate',
    label: 'Validate Links',
    description: 'Check for broken links',
    command: 'npm run validate-links'
  },
  {
    name: 'test',
    value: 'test',
    label: 'Test',
    description: 'Run all tests',
    command: 'npm run test'
  },
  {
    name: 'all',
    value: 'all',
    label: 'All',
    description: 'Run ETL → Build → Sitemap → Validate',
    command: null // Special case - runs sequence
  },
  {
    name: 'help',
    value: 'help',
    label: 'Help',
    description: 'Show CLI usage information',
    command: null // Special case
  },
  {
    name: 'exit',
    value: 'exit',
    label: 'Exit',
    description: 'Exit the interactive menu',
    command: null
  }
];

// Format choices for inquirer
function getChoices(excludeHelp = false, excludeExit = false) {
  return menuOptions
    .filter(opt => {
      if (excludeHelp && opt.name === 'help') return false;
      if (excludeExit && opt.name === 'exit') return false;
      return true;
    })
    .map(opt => ({
      name: `${opt.label.padEnd(15)} - ${opt.description}`,
      value: opt.value
    }));
}

/**
 * Run a shell command and display output
 */
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  console.log('─'.repeat(50));
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('─'.repeat(50));
    console.log(`✅ ${description} completed successfully!\n`);
    return true;
  } catch {
    console.log('─'.repeat(50));
    console.error(`❌ ${description} failed!\n`);
    return false;
  }
}

/**
 * Run ETL → Build → Sitemap → Validate sequence
 */
async function runAll() {
  const steps = [
    { cmd: 'npm run etl', desc: 'ETL' },
    { cmd: 'npm run build', desc: 'Build' },
    { cmd: 'npm run sitemap', desc: 'Sitemap' },
    { cmd: 'npm run validate-links', desc: 'Validate Links' }
  ];

  for (const step of steps) {
    const success = runCommand(step.cmd, step.desc);
    if (!success) {
      const { continueOnError } = await prompt([
        {
          type: 'confirm',
          name: 'continueOnError',
          message: 'Continue with next step despite error?',
          default: false
        }
      ]);
      
      if (!continueOnError) {
        console.log('⚠️  Sequence aborted by user');
        return;
      }
    }
  }
  
  console.log('✅ All steps completed!');
}

/**
 * Display help information
 */
function showHelp() {
  console.log('\n📖 Sekolah PSEO CLI Help\n');
  console.log('Interactive Menu Options:\n');
  
  menuOptions.forEach(opt => {
    if (opt.name !== 'help' && opt.name !== 'exit') {
      console.log(`  ${opt.label.padEnd(12)} - ${opt.description}`);
    }
  });
  
  console.log('\n📌 Alternative Usage:');
  console.log('  npm run etl           # Run ETL directly');
  console.log('  npm run build         # Build pages directly');
  console.log('  npm run sitemap       # Generate sitemap');
  console.log('  npm run validate-links # Validate links');
  console.log('  npm run test          # Run tests');
  console.log('  npm run lint          # Run linter');
  console.log('  npm run format        # Format code\n');
}

/**
 * Main interactive loop
 */
async function main() {
  console.clear();
  console.log(' Sekolah PSEO - Interactive CLI Menu');
  console.log('═'.repeat(50));
  console.log('Welcome! Choose an option to get started.\n');

  while (true) {
    const { action } = await prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: getChoices(),
        default: 'etl',
        loop: false
      }
    ]);

    switch (action) {
      case 'etl':
        runCommand('npm run etl', 'Running ETL');
        break;
        
      case 'build':
        runCommand('npm run build', 'Building Pages');
        break;
        
      case 'sitemap':
        runCommand('npm run sitemap', 'Generating Sitemap');
        break;
        
      case 'validate':
        runCommand('npm run validate-links', 'Validating Links');
        break;
        
      case 'test':
        runCommand('npm run test', 'Running Tests');
        break;
        
      case 'all':
        await runAll();
        break;
        
      case 'help':
        showHelp();
        break;
        
      case 'exit':
        console.log('\n👋 Goodbye! Thanks for using Sekolah PSEO!\n');
        process.exit(0);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { main, runCommand, showHelp };
