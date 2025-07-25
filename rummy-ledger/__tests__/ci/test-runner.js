#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CI/CD Pipeline
 * Runs all test suites with proper reporting and coverage validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  coverageThreshold: 90,
  testTimeout: 300000, // 5 minutes
  maxRetries: 3,
  reportFormats: ['text', 'lcov', 'json', 'html'],
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n--- ${title} ---`, 'blue');
}

function runCommand(command, options = {}) {
  const { retries = 0, silent = false } = options;
  
  try {
    if (!silent) {
      log(`Running: ${command}`, 'yellow');
    }
    
    const result = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: CONFIG.testTimeout,
      ...options
    });
    
    return { success: true, output: result };
  } catch (error) {
    if (retries > 0) {
      log(`Command failed, retrying... (${retries} attempts left)`, 'yellow');
      return runCommand(command, { ...options, retries: retries - 1 });
    }
    
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

function validateCoverage() {
  logSubsection('Validating Coverage Thresholds');
  
  const coveragePath = path.join(__dirname, '../../coverage/coverage-final.json');
  
  if (!fs.existsSync(coveragePath)) {
    log('Coverage file not found!', 'red');
    return false;
  }
  
  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const totals = Object.values(coverage).reduce((acc, file) => {
      Object.keys(file).forEach(key => {
        if (typeof file[key] === 'object' && file[key].pct !== undefined) {
          if (!acc[key]) acc[key] = [];
          acc[key].push(file[key].pct);
        }
      });
      return acc;
    }, {});
    
    const averages = Object.keys(totals).reduce((acc, key) => {
      acc[key] = totals[key].reduce((sum, val) => sum + val, 0) / totals[key].length;
      return acc;
    }, {});
    
    log('Coverage Results:', 'blue');
    let allPassed = true;
    
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      const percentage = averages[metric] || 0;
      const passed = percentage >= CONFIG.coverageThreshold;
      const status = passed ? '✓' : '✗';
      const color = passed ? 'green' : 'red';
      
      log(`  ${status} ${metric}: ${percentage.toFixed(2)}% (threshold: ${CONFIG.coverageThreshold}%)`, color);
      
      if (!passed) allPassed = false;
    });
    
    return allPassed;
  } catch (error) {
    log(`Error reading coverage: ${error.message}`, 'red');
    return false;
  }
}

function runTestSuite(suiteName, command, options = {}) {
  logSubsection(`Running ${suiteName}`);
  
  const result = runCommand(command, {
    retries: CONFIG.maxRetries,
    ...options
  });
  
  if (result.success) {
    log(`✓ ${suiteName} passed`, 'green');
    return true;
  } else {
    log(`✗ ${suiteName} failed`, 'red');
    if (result.error) {
      log(`Error: ${result.error}`, 'red');
    }
    return false;
  }
}

function generateTestReport() {
  logSubsection('Generating Test Reports');
  
  const reportDir = path.join(__dirname, '../../test-reports');
  
  // Ensure report directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Generate JUnit XML report for CI systems
  const junitCommand = 'npm run test -- --reporters=default --reporters=jest-junit';
  runCommand(junitCommand, { silent: true });
  
  log('Test reports generated in test-reports/', 'green');
}

function checkTestFiles() {
  logSubsection('Validating Test File Structure');
  
  const testDir = path.join(__dirname, '..');
  const requiredDirs = [
    'accessibility',
    'animations', 
    'components',
    'context',
    'e2e',
    'integration',
    'models',
    'navigation',
    'performance',
    'services',
    'verification'
  ];
  
  let allDirsExist = true;
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(testDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.test.tsx') || f.endsWith('.test.ts'));
      log(`✓ ${dir}: ${files.length} test files`, 'green');
    } else {
      log(`✗ Missing test directory: ${dir}`, 'red');
      allDirsExist = false;
    }
  });
  
  return allDirsExist;
}

async function main() {
  logSection('Rummy Ledger - Comprehensive Test Suite');
  
  const startTime = Date.now();
  let allTestsPassed = true;
  
  // Step 1: Validate test file structure
  if (!checkTestFiles()) {
    log('Test file structure validation failed!', 'red');
    process.exit(1);
  }
  
  // Step 2: Run linting
  if (!runTestSuite('ESLint', 'npm run lint')) {
    allTestsPassed = false;
  }
  
  // Step 3: Run unit tests
  if (!runTestSuite('Unit Tests', 'npm run test -- --testPathPattern="__tests__/(components|context|models|services|utils)"')) {
    allTestsPassed = false;
  }
  
  // Step 4: Run integration tests
  if (!runTestSuite('Integration Tests', 'npm run test -- --testPathPattern="__tests__/integration"')) {
    allTestsPassed = false;
  }
  
  // Step 5: Run accessibility tests
  if (!runTestSuite('Accessibility Tests', 'npm run test -- --testPathPattern="__tests__/accessibility"')) {
    allTestsPassed = false;
  }
  
  // Step 6: Run animation and performance tests
  if (!runTestSuite('Performance Tests', 'npm run test -- --testPathPattern="__tests__/(animations|performance)"')) {
    allTestsPassed = false;
  }
  
  // Step 7: Run navigation tests
  if (!runTestSuite('Navigation Tests', 'npm run test -- --testPathPattern="__tests__/navigation"')) {
    allTestsPassed = false;
  }
  
  // Step 8: Run end-to-end tests
  if (!runTestSuite('E2E Tests', 'npm run test -- --testPathPattern="__tests__/e2e"')) {
    allTestsPassed = false;
  }
  
  // Step 9: Run full test suite with coverage
  logSubsection('Running Full Test Suite with Coverage');
  const coverageResult = runCommand('npm run test:coverage');
  
  if (!coverageResult.success) {
    log('Coverage test run failed!', 'red');
    allTestsPassed = false;
  }
  
  // Step 10: Validate coverage thresholds
  if (!validateCoverage()) {
    log('Coverage validation failed!', 'red');
    allTestsPassed = false;
  }
  
  // Step 11: Generate reports
  generateTestReport();
  
  // Final results
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('Test Results Summary');
  
  if (allTestsPassed) {
    log(`✓ All tests passed! (${duration}s)`, 'green');
    log('Coverage thresholds met', 'green');
    log('Ready for deployment', 'green');
    process.exit(0);
  } else {
    log(`✗ Some tests failed! (${duration}s)`, 'red');
    log('Please fix failing tests before deployment', 'red');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  log(`Test runner error: ${error.message}`, 'red');
  process.exit(1);
});