# Rummy Ledger

A modern mobile scorekeeper for Rummy games with real-time scoring, game history, and intuitive player management. Built with React Native and Expo for cross-platform compatibility.

## Features

### Core Functionality
- **Real-time Scoring**: Track scores for 2-6 players across multiple rounds
- **Target Score Games**: Set winning score thresholds with automatic game end detection
- **Open-ended Games**: Play without score limits for casual sessions
- **Round Management**: Add, edit, and delete individual rounds with full history
- **Automatic Winner Detection**: Lowest score wins when target is reached

### User Experience
- **Player Management**: Save and reuse player names with autocomplete suggestions
- **Game History**: View and analyze past games with detailed round-by-round breakdowns
- **Accessibility**: Full screen reader support, keyboard navigation, and high contrast themes
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Haptic Feedback**: Subtle vibrations for button presses and game events
- **Smooth Animations**: 60fps animations with loading states and celebrations

### Technical Features
- **Offline Support**: Works completely offline with local data storage
- **Data Persistence**: Automatic saving with AsyncStorage and SecureStore
- **Performance Optimized**: Lazy loading, memoization, and efficient re-renders
- **Cross-platform**: Native iOS and Android apps from single codebase
- **Responsive Design**: Adapts to different screen sizes and orientations

## Screenshots

*Screenshots will be added in a future update showing the main screens and key features*

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS: Xcode 14+
- For Android: Android Studio with SDK 23+

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rummy-ledger.git
cd rummy-ledger
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
npm run ios     # iOS simulator
npm run android # Android emulator
```

### Production Build

1. Build for production:
```bash
npm run build:production
```

2. Submit to app stores:
```bash
npm run submit:ios     # iOS App Store
npm run submit:android # Google Play Store
```

## Usage

### Starting a New Game

1. Tap "New Game" on the home screen
2. Enter player names (2-6 players supported)
3. Tap "Start Game" to begin

### Scoring

1. Tap "Add Round" to enter scores for the current round
2. Enter each player's score
3. Mark any "Rummy" bonuses
4. Tap "Save Round" to record scores

### Game History

- View all completed games in the History tab
- Tap any game to see detailed round-by-round scoring
- Games are automatically saved when completed

## Technical Details

### Architecture

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context with useReducer
- **Storage**: AsyncStorage for game data persistence
- **Testing**: Jest with React Native Testing Library
- **Accessibility**: Built-in screen reader and keyboard support

### Project Structure

```
rummy-ledger/
├── app/                    # Screen components (Expo Router)
├── components/             # Reusable UI components
├── src/
│   ├── context/           # React Context providers
│   ├── services/          # Business logic services
│   ├── models/            # Data models and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── constants/             # App constants and themes
├── assets/                # Images, fonts, and static assets
└── __tests__/             # Test files
```

### Key Components

- **GameContext**: Manages game state and actions
- **ThemeContext**: Handles light/dark theme switching
- **StorageService**: Handles data persistence
- **GameService**: Core game logic and validation
- **AccessibilityService**: Screen reader and accessibility features

## Development

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
npm run test:e2e           # Run end-to-end tests
npm run test:accessibility # Run accessibility tests
```

### Code Quality

```bash
npm run lint               # Check code style
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting
```

### Performance Analysis

```bash
npm run analyze:bundle     # Analyze bundle size
npm start:production       # Test production build locally
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation for API changes
- Ensure accessibility compliance
- Test on both iOS and Android

## Deployment

### EAS Build

This project uses Expo Application Services (EAS) for building and deployment:

```bash
# Development build
npm run build:development

# Preview build
npm run build:preview

# Production build
npm run build:production
```

### Environment Configuration

- Development: `.env.development`
- Production: `.env.production`

## Documentation

### User Documentation
- **[User Guide](docs/USER_GUIDE.md)**: Complete guide for end users
- **[Troubleshooting](docs/TROUBLESHOOTING.md)**: Solutions for common issues

### Developer Documentation
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to the project
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Building and deploying the app

## Troubleshooting

### Quick Fixes

**Metro bundler issues:**
```bash
npx expo start --clear
```

**iOS simulator not starting:**
```bash
npx expo run:ios --device
```

**Android build failures:**
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

**App crashes or won't start:**
```bash
# Clear all caches
npm run reset-project
npm install
npm start
```

### Performance Issues

- Check bundle size: `npm run analyze:bundle`
- Profile with Flipper or React DevTools
- Monitor memory usage in development
- Test on lower-end devices for performance validation

### Getting Help

For detailed troubleshooting steps, see our [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

**Common Resources:**
- Check existing [GitHub Issues](https://github.com/yourusername/rummy-ledger/issues)
- Review the [User Guide](docs/USER_GUIDE.md) for usage questions
- Follow the [Contributing Guide](CONTRIBUTING.md) for development issues

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Create an issue on GitHub for bug reports
- Check existing issues before creating new ones
- Include device/OS information in bug reports

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

### Latest Release (v1.0.0)
- Complete game scoring functionality with 2-6 player support
- Real-time leaderboard with automatic winner detection
- Comprehensive game history with round-by-round breakdowns
- Full accessibility support with screen reader compatibility
- Dark/light theme with automatic system preference detection
- Offline data storage with local persistence
- Cross-platform iOS and Android support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/)
- Testing with [Jest](https://jestjs.io/) and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)
- Accessibility guidelines from [React Native Accessibility](https://reactnative.dev/docs/accessibility)

---

Built with ❤️ using React Native and Expo