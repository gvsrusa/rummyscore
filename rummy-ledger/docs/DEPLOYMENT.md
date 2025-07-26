# Deployment Guide

This guide covers building and deploying Rummy Ledger to various platforms including iOS App Store, Google Play Store, and web deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Configuration](#build-configuration)
4. [Local Development Builds](#local-development-builds)
5. [Production Builds](#production-builds)
6. [iOS App Store Deployment](#ios-app-store-deployment)
7. [Google Play Store Deployment](#google-play-store-deployment)
8. [Web Deployment](#web-deployment)
9. [Continuous Integration](#continuous-integration)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or 20.x
- **npm**: Version 8+ (comes with Node.js)
- **Expo CLI**: Latest version (`npm install -g @expo/cli`)
- **EAS CLI**: Latest version (`npm install -g eas-cli`)

### Platform-Specific Requirements

**For iOS:**
- macOS with Xcode 14+
- iOS Simulator (included with Xcode)
- Apple Developer Account ($99/year)
- Valid provisioning profiles and certificates

**For Android:**
- Android Studio with SDK 23+
- Android Emulator or physical device
- Google Play Console account ($25 one-time fee)
- Keystore file for signing

**For Web:**
- Modern web browser for testing
- Web hosting service (Netlify, Vercel, etc.)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/rummy-ledger.git
cd rummy-ledger
npm install
```

### 2. Configure EAS

```bash
# Login to Expo account
eas login

# Configure project
eas build:configure
```

### 3. Environment Variables

Create environment files:

**.env.development:**
```env
NODE_ENV=development
API_URL=http://localhost:3000
DEBUG_MODE=true
```

**.env.production:**
```env
NODE_ENV=production
API_URL=https://api.rummyledger.com
DEBUG_MODE=false
```

### 4. Update Configuration

Update `eas.json` with your project details:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json",
        "track": "internal"
      }
    }
  }
}
```

## Build Configuration

### App Configuration (app.json)

Key settings to verify:

```json
{
  "expo": {
    "name": "Rummy Ledger",
    "slug": "rummy-ledger",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.rummyledger.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.rummyledger.app",
      "versionCode": 1
    }
  }
}
```

### Build Profiles

The project includes three build profiles:

1. **Development**: For testing with development client
2. **Preview**: For internal testing and QA
3. **Production**: For app store submission

## Local Development Builds

### Start Development Server

```bash
# Start Expo development server
npm start

# Platform-specific commands
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### Development Client Build

```bash
# Build development client
npm run build:development

# Install on device for testing
# iOS: Use Xcode or TestFlight
# Android: Install APK directly
```

## Production Builds

### Pre-build Checklist

- [ ] Update version numbers in `app.json`
- [ ] Update build numbers (iOS) and version codes (Android)
- [ ] Test all features thoroughly
- [ ] Run full test suite: `npm run test:comprehensive`
- [ ] Verify accessibility compliance
- [ ] Check bundle size: `npm run analyze:bundle`
- [ ] Update changelog and release notes

### Build Commands

```bash
# Production build for both platforms
npm run build:production

# Platform-specific builds
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Build Monitoring

Monitor builds in:
- EAS Build dashboard: https://expo.dev/builds
- Local terminal output
- Email notifications (if configured)

## iOS App Store Deployment

### 1. Apple Developer Setup

1. Create App Store Connect app record
2. Configure app metadata, screenshots, and descriptions
3. Set up provisioning profiles and certificates
4. Configure App Store Connect API key (optional)

### 2. Build for iOS

```bash
# Build iOS production version
eas build --platform ios --profile production
```

### 3. Submit to App Store

```bash
# Automatic submission
npm run submit:ios

# Manual submission via EAS
eas submit --platform ios --profile production
```

### 4. App Store Review

- Typical review time: 24-48 hours
- Address any rejection feedback promptly
- Use TestFlight for beta testing before submission

### 5. Release Management

```bash
# Check submission status
eas submit --platform ios --status

# Download build for manual upload
eas build:download --platform ios
```

## Google Play Store Deployment

### 1. Google Play Console Setup

1. Create app in Google Play Console
2. Complete store listing with descriptions and screenshots
3. Set up content rating and target audience
4. Configure pricing and distribution

### 2. Keystore Management

```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore rummy-ledger.keystore -alias rummy-ledger -keyalg RSA -keysize 2048 -validity 10000

# Store keystore securely and update eas.json
```

### 3. Build for Android

```bash
# Build Android production version
eas build --platform android --profile production
```

### 4. Submit to Play Store

```bash
# Automatic submission
npm run submit:android

# Manual submission via EAS
eas submit --platform android --profile production
```

### 5. Release Tracks

- **Internal**: Team testing
- **Alpha**: Closed testing
- **Beta**: Open testing
- **Production**: Public release

## Web Deployment

### 1. Build Web Version

```bash
# Export static web build
npm run build:local
# or
npx expo export --platform web
```

### 2. Deploy to Hosting Service

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Custom Server:**
```bash
# Upload dist/ folder contents to web server
# Configure server to serve index.html for all routes
```

### 3. Domain Configuration

- Configure custom domain in hosting service
- Set up SSL certificate (usually automatic)
- Configure redirects for SPA routing

## Continuous Integration

### GitHub Actions Workflow

The project includes a CI/CD pipeline (`.github/workflows/ci.yml`) that:

1. Runs tests on multiple Node.js versions
2. Performs accessibility and performance testing
3. Runs end-to-end tests
4. Builds and verifies the project
5. Uploads coverage reports and artifacts

### Automated Deployment

For automated deployment, add these secrets to GitHub:

- `EXPO_TOKEN`: Expo authentication token
- `APPLE_ID`: Apple ID for iOS submission
- `APPLE_PASSWORD`: App-specific password
- `ANDROID_SERVICE_ACCOUNT`: Google Play service account JSON

### Build Triggers

Builds can be triggered by:
- Git tags (e.g., `v1.0.0`)
- Manual workflow dispatch
- Pull request merges to main branch

## Troubleshooting

### Common Build Issues

**Metro bundler errors:**
```bash
# Clear Metro cache
npx expo start --clear

# Reset project
npm run reset-project
```

**iOS build failures:**
```bash
# Check provisioning profiles
eas credentials

# Verify bundle identifier matches
# Check Xcode version compatibility
```

**Android build failures:**
```bash
# Check keystore configuration
# Verify package name matches
# Update Android SDK if needed
```

### Performance Issues

**Large bundle size:**
```bash
# Analyze bundle
npm run analyze:bundle

# Enable Hermes (Android)
# Optimize images and assets
# Remove unused dependencies
```

**Slow builds:**
- Use appropriate resource classes in `eas.json`
- Enable caching where possible
- Optimize dependencies and imports

### Submission Issues

**iOS App Store rejection:**
- Review Apple's App Store Review Guidelines
- Test on actual devices, not just simulators
- Ensure all required metadata is complete

**Google Play rejection:**
- Review Google Play policies
- Test target API level compatibility
- Ensure proper permissions are declared

### Debugging Tools

**Local debugging:**
```bash
# React Native debugger
npm install -g react-native-debugger

# Flipper (for React Native debugging)
# Xcode Instruments (iOS performance)
# Android Studio Profiler (Android performance)
```

**Remote debugging:**
- Expo DevTools
- Sentry for error tracking
- Analytics for user behavior

## Version Management

### Semantic Versioning

Follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes, backward compatible

### Release Process

1. Update version in `app.json`
2. Update build numbers/version codes
3. Create git tag: `git tag v1.0.0`
4. Build and test thoroughly
5. Submit to app stores
6. Create GitHub release with changelog
7. Update documentation if needed

### Rollback Strategy

- Keep previous builds available in EAS
- Use staged rollouts (Android) or phased releases (iOS)
- Monitor crash reports and user feedback
- Have rollback plan ready for critical issues

---

*This deployment guide is for Rummy Ledger v1.0.0. Procedures may vary with different versions of Expo, EAS, and platform requirements.*