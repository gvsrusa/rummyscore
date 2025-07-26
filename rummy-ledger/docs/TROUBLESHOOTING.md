# Troubleshooting Guide

This guide helps resolve common issues encountered while developing, building, or using Rummy Ledger.

## Table of Contents

1. [Development Issues](#development-issues)
2. [Build and Deployment Issues](#build-and-deployment-issues)
3. [Runtime Issues](#runtime-issues)
4. [Performance Issues](#performance-issues)
5. [Platform-Specific Issues](#platform-specific-issues)
6. [Testing Issues](#testing-issues)
7. [User-Reported Issues](#user-reported-issues)
8. [Getting Help](#getting-help)

## Development Issues

### Metro Bundler Problems

**Issue: Metro bundler won't start or crashes**
```bash
# Solution 1: Clear Metro cache
npx expo start --clear

# Solution 2: Reset Metro cache manually
rm -rf node_modules/.cache
rm -rf .expo/cache

# Solution 3: Restart with clean slate
npm run reset-project
npm install
npm start
```

**Issue: Module resolution errors**
```bash
# Check for duplicate dependencies
npm ls

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify Metro configuration
cat metro.config.js
```

**Issue: "Unable to resolve module" errors**
```bash
# Check import paths are correct
# Verify file extensions match
# Ensure case sensitivity is correct
# Check if module is properly installed
npm list [module-name]
```

### TypeScript Issues

**Issue: Type errors in development**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
npm update @types/react @types/react-native

# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
```

**Issue: Missing type declarations**
```bash
# Install missing types
npm install --save-dev @types/[package-name]

# Create custom type declarations in types/ folder
# Add to tsconfig.json paths if needed
```

### Expo CLI Issues

**Issue: Expo CLI commands fail**
```bash
# Update Expo CLI
npm install -g @expo/cli@latest

# Login to Expo account
expo login

# Check project configuration
expo doctor
```

**Issue: Development server connection problems**
```bash
# Check network connectivity
# Ensure device and computer are on same network
# Try different connection method (tunnel, LAN, localhost)
# Restart development server
```

## Build and Deployment Issues

### EAS Build Failures

**Issue: Build fails with dependency errors**
```bash
# Check package.json for conflicting versions
# Update dependencies to compatible versions
npm update

# Clear npm cache
npm cache clean --force

# Try building locally first
npx expo export
```

**Issue: iOS build fails with provisioning profile errors**
```bash
# Check Apple Developer account status
# Verify bundle identifier matches
# Update provisioning profiles
eas credentials

# Check certificate expiration
# Ensure team ID is correct in eas.json
```

**Issue: Android build fails with keystore errors**
```bash
# Verify keystore configuration in eas.json
# Check keystore file path and credentials
# Regenerate keystore if corrupted
keytool -genkey -v -keystore new-keystore.keystore
```

### Submission Issues

**Issue: App Store Connect submission fails**
```bash
# Check app metadata is complete
# Verify screenshots meet requirements
# Ensure privacy policy URL is accessible
# Review App Store Review Guidelines
```

**Issue: Google Play Console rejection**
```bash
# Check target SDK version compatibility
# Verify app permissions are justified
# Ensure content rating is appropriate
# Review Google Play policies
```

## Runtime Issues

### App Crashes

**Issue: App crashes on startup**
```bash
# Check device logs
# iOS: Xcode Console or Device Logs
# Android: adb logcat

# Common causes:
# - Missing native dependencies
# - Incompatible React Native version
# - Memory issues on older devices
```

**Issue: App crashes during specific actions**
```bash
# Enable crash reporting (Sentry, Crashlytics)
# Add error boundaries to catch React errors
# Check for null/undefined values
# Verify async operations are handled properly
```

### Data Storage Issues

**Issue: Game data not persisting**
```bash
# Check AsyncStorage permissions
# Verify storage operations are awaited
# Test on different devices/simulators
# Check available storage space
```

**Issue: Data corruption or loss**
```bash
# Implement data validation
# Add backup/restore functionality
# Use SecureStore for sensitive data
# Test storage operations thoroughly
```

### Navigation Issues

**Issue: Navigation not working properly**
```bash
# Check Expo Router configuration
# Verify file-based routing structure
# Test deep linking functionality
# Check navigation state management
```

## Performance Issues

### Slow App Performance

**Issue: App feels sluggish or unresponsive**
```bash
# Profile with React DevTools Profiler
# Check for unnecessary re-renders
# Optimize component memoization
# Reduce bundle size

# Use React.memo for expensive components
# Implement lazy loading where appropriate
# Optimize images and assets
```

**Issue: High memory usage**
```bash
# Profile memory usage with Xcode Instruments (iOS)
# Use Android Studio Memory Profiler (Android)
# Check for memory leaks in useEffect hooks
# Optimize image loading and caching
```

**Issue: Slow animations**
```bash
# Use React Native Reanimated for complex animations
# Enable Hermes JavaScript engine (Android)
# Reduce animation complexity
# Test on lower-end devices
```

### Bundle Size Issues

**Issue: Large app bundle size**
```bash
# Analyze bundle composition
npm run analyze:bundle

# Remove unused dependencies
npm uninstall [unused-package]

# Optimize images and assets
# Use vector graphics where possible
# Enable code splitting if applicable
```

## Platform-Specific Issues

### iOS Issues

**Issue: App doesn't work on iOS simulator**
```bash
# Reset iOS simulator
# Device > Erase All Content and Settings

# Check iOS version compatibility
# Verify Xcode version is supported
# Test on physical device
```

**Issue: iOS-specific crashes**
```bash
# Check iOS-specific code paths
# Verify native module compatibility
# Test on different iOS versions
# Review iOS-specific permissions
```

### Android Issues

**Issue: App doesn't work on Android emulator**
```bash
# Wipe emulator data
# Create new AVD with different API level
# Check hardware acceleration settings
# Test on physical device
```

**Issue: Android-specific performance problems**
```bash
# Enable Hermes JavaScript engine
# Check ProGuard/R8 configuration
# Optimize for different screen densities
# Test on various Android versions
```

## Testing Issues

### Unit Test Failures

**Issue: Jest tests failing**
```bash
# Clear Jest cache
npx jest --clearCache

# Update test snapshots
npm test -- --updateSnapshot

# Check test environment configuration
cat jest.setup.js
```

**Issue: React Native Testing Library issues**
```bash
# Verify testing library setup
# Check component rendering in tests
# Ensure proper cleanup in test hooks
# Update testing library versions
```

### E2E Test Issues

**Issue: End-to-end tests failing**
```bash
# Check test device/simulator setup
# Verify app is properly built for testing
# Update test selectors if UI changed
# Check test timing and waits
```

## User-Reported Issues

### Common User Problems

**Issue: "App won't open" or "Crashes immediately"**

*User Solutions:*
1. Restart the device
2. Update the app from app store
3. Clear app cache (Android) or reinstall (iOS)
4. Check available storage space
5. Update device OS if very outdated

**Issue: "Scores not saving" or "Data lost"**

*User Solutions:*
1. Ensure app has storage permissions
2. Check available device storage
3. Don't force-close app during score entry
4. Update to latest app version
5. Report specific steps that cause data loss

**Issue: "App is slow" or "Freezes during use"**

*User Solutions:*
1. Close other running apps
2. Restart the device
3. Update the app
4. Check device storage space
5. Report device model and OS version

### Accessibility Issues

**Issue: Screen reader not working properly**

*Solutions:*
1. Check device accessibility settings
2. Update screen reader software
3. Verify app accessibility features are enabled
4. Test with different screen reader modes

**Issue: Text too small or hard to read**

*Solutions:*
1. Adjust device font size settings
2. Enable high contrast mode
3. Use device zoom features
4. Check app theme settings

## Getting Help

### Before Reporting Issues

1. **Check this troubleshooting guide**
2. **Search existing issues** on GitHub
3. **Try basic solutions** (restart, update, reinstall)
4. **Gather information**:
   - Device model and OS version
   - App version
   - Steps to reproduce the issue
   - Screenshots or screen recordings
   - Error messages or crash logs

### Reporting Bugs

**For Developers:**
1. Create GitHub issue with detailed description
2. Include reproduction steps
3. Provide relevant code snippets
4. Add labels for priority and component
5. Include environment details

**For Users:**
1. Use in-app feedback system (if available)
2. Contact through app store reviews
3. Email support with detailed description
4. Include device and app version information

### Getting Support

**Developer Resources:**
- GitHub Issues: Report bugs and feature requests
- Expo Documentation: https://docs.expo.dev/
- React Native Documentation: https://reactnative.dev/
- Stack Overflow: Tag questions with `react-native` and `expo`

**User Resources:**
- In-app help system
- App store support pages
- User guide documentation
- Community forums

### Emergency Procedures

**Critical Production Issues:**
1. Assess impact and affected users
2. Implement immediate workaround if possible
3. Prepare hotfix release
4. Communicate with users through app store updates
5. Monitor crash reports and user feedback

**Data Loss Issues:**
1. Investigate root cause immediately
2. Implement data recovery if possible
3. Add additional data validation
4. Improve backup/restore functionality
5. Communicate transparently with affected users

---

*This troubleshooting guide is maintained for Rummy Ledger v1.0.0. Issues and solutions may vary with different versions.*