#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * Runs all test categories and generates detailed coverage reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test categories and their patterns
const TEST_CATEGORIES = {
  'Unit Tests (Models & Services)': '__tests__/(models|services)',
  'Component Tests': '__tests__/components',
  'Context Tests': '__tests__/context',
  'Integration Tests': '__tests__/integration',
  'Accessibility Tests': '__tests__/accessibility',
  'Animation & Performance Tests': '__tests__/(animations|performance)',
  'Navigation Tests': '__tests__/navigation',
  'End-to-End Tests': '__tests__/e2e',
  'Verification Tests': '__tests__/verification',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTestCategory(name, pattern) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running: ${name}`, 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const command = `npm test -- --testPathPattern="${pattern}" --verbose --passWithNoTests`;
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${name} - PASSED`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name} - FAILED`, 'red');
    return false;
  }
}

function generateCoverageReport() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('Generating Coverage Report', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });
    log('✓ Coverage report generated', 'green');
    return true;
  } catch (error) {
    log('✗ Coverage report failed', 'red');
    return false;
  }
}

function checkCoverageThresholds() {
  const coveragePath = path.join(__dirname, '../coverage/coverage-final.json');
  
  if (!fs.existsSync(coveragePath)) {
    log('Coverage file not found', 'red');
    return false;
  }
  
  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    // Calculate overall coverage
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;
    
    Object.values(coverage).forEach(file => {
      if (file.s) {
        totalStatements += Object.keys(file.s).length;
        coveredStatements += Object.values(file.s).filter(count => count > 0).length;
      }
      if (file.b) {
        Object.values(file.b).forEach(branch => {
          totalBranches += branch.length;
          coveredBranches += branch.filter(count => count > 0).length;
        });
      }
      if (file.f) {
        totalFunctions += Object.keys(file.f).length;
        coveredFunctions += Object.values(file.f).filter(count => count > 0).length;
      }
      if (file.l) {
        totalLines += Object.keys(file.l).length;
        coveredLines += Object.values(file.l).filter(count => count > 0).length;
      }
    });
    
    const statementsCoverage = (coveredStatements / totalStatements) * 100;
    const branchesCoverage = (coveredBranches / totalBranches) * 100;
    const functionsCoverage = (coveredFunctions / totalFunctions) * 100;
    const linesCoverage = (coveredLines / totalLines) * 100;
    
    log('\nCoverage Summary:', 'blue');
    log(`Statements: ${statementsCoverage.toFixed(2)}% (${coveredStatements}/${totalStatements})`, 
        statementsCoverage >= 90 ? 'green' : 'red');
    log(`Branches: ${branchesCoverage.toFixed(2)}% (${coveredBranches}/${totalBranches})`, 
        branchesCoverage >= 90 ? 'green' : 'red');
    log(`Functions: ${functionsCoverage.toFixed(2)}% (${coveredFunctions}/${totalFunctions})`, 
        functionsCoverage >= 90 ? 'green' : 'red');
    log(`Lines: ${linesCoverage.toFixed(2)}% (${coveredLines}/${totalLines})`, 
        linesCoverage >= 90 ? 'green' : 'red');
    
    const allThresholdsMet = statementsCoverage >= 90 && branchesCoverage >= 90 && 
                            functionsCoverage >= 90 && linesCoverage >= 90;
    
    return allThresholdsMet;
  } catch (error) {
    log(`Error reading coverage: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('Rummy Ledger - Comprehensive Test Suite Runner', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const startTime = Date.now();
  let allTestsPassed = true;
  const results = {};
  
  // Run each test category
  for (const [name, pattern] of Object.entries(TEST_CATEGORIES)) {
    const passed = runTestCategory(name, pattern);
    results[name] = passed;
    if (!passed) {
      allTestsPassed = false;
    }
  }
  
  // Generate coverage report
  const coverageGenerated = generateCoverageReport();
  
  // Check coverage thresholds
  const coverageThresholdsMet = checkCoverageThresholds();
  
  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  log('Test Results Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  for (const [name, passed] of Object.entries(results)) {
    log(`${passed ? '✓' : '✗'} ${name}`, passed ? 'green' : 'red');
  }
  
  log(`\nCoverage Report: ${coverageGenerated ? '✓' : '✗'}`, coverageGenerated ? 'green' : 'red');
  log(`Coverage Thresholds: ${coverageThresholdsMet ? '✓' : '✗'}`, coverageThresholdsMet ? 'green' : 'red');
  log(`\nTotal Duration: ${duration}s`, 'blue');
  
  if (allTestsPassed && coverageGenerated && coverageThresholdsMet) {
    log('\n🎉 All tests passed and coverage thresholds met!', 'green');
    log('Ready for deployment', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed or coverage thresholds not met', 'red');
    log('Please fix failing tests and improve coverage', 'red');
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

main();