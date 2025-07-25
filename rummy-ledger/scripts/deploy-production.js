#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production deployment process...\n');

// Helper function to run commands
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

// Helper function to check if file exists
function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${description} not found at: ${filePath}`);
    console.log('Please ensure all required files are in place before deployment.');
    process.exit(1);
  }
  console.log(`✅ ${description} found`);
}

// Pre-deployment checks
console.log('🔍 Running pre-deployment checks...\n');

// Check required files
checkFileExists('app.json', 'App configuration');
checkFileExists('eas.json', 'EAS configuration');
checkFileExists('assets/images/icon.png', 'App icon');
checkFileExists('assets/images/adaptive-icon.png', 'Android adaptive icon');
checkFileExists('assets/images/splash-icon.png', 'Splash screen icon');

// Check package.json version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Current version: ${packageJson.version}`);

// Run comprehensive tests
runCommand('npm run test:comprehensive', 'Running comprehensive test suite');

// Check code quality
runCommand('npm run lint', 'Checking code quality');
runCommand('npm run format:check', 'Checking code formatting');

// Build for production
console.log('🏗️  Building for production...\n');

// Build for iOS
runCommand('eas build --platform ios --profile production --non-interactive', 'Building iOS production app');

// Build for Android
runCommand('eas build --platform android --profile production --non-interactive', 'Building Android production app');

// Generate bundle analysis
runCommand('npm run analyze:bundle', 'Analyzing bundle size');

console.log('🎉 Production deployment completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Test the built apps on physical devices');
console.log('2. Submit to app stores using:');
console.log('   - npm run submit:ios');
console.log('   - npm run submit:android');
console.log('3. Monitor app performance and user feedback');

// Display build information
console.log('\n📊 Build Summary:');
console.log(`Version: ${packageJson.version}`);
console.log(`Build Date: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);

// Check bundle size (if analysis file exists)
const assetMapPath = path.join(__dirname, '../dist/assetmap.json');
if (fs.existsSync(assetMapPath)) {
  const assetMap = JSON.parse(fs.readFileSync(assetMapPath, 'utf8'));
  const totalSize = Object.values(assetMap).reduce((sum, asset) => sum + (asset.size || 0), 0);
  console.log(`Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}