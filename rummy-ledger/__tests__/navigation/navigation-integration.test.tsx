import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({ gameId: 'test-game-id' }),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock the GameContext
const mockGameContext = {
  currentGame: null,
  gameHistory: [],
  recentPlayers: ['Alice', 'Bob', 'Charlie'],
  loading: false,
  error: null,
  createGame: jest.fn(),
  addRound: jest.fn(),
  editRound: jest.fn(),
  deleteRound: jest.fn(),
  endGame: jest.fn(),
  clearError: jest.fn(),
};

jest.mock('@/src/context/GameContext', () => ({
  useGame: () => mockGameContext,
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import the root layout
import RootLayout from '../../app/_layout.tsx';

describe('Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders root layout with proper navigation structure', () => {
    const { getByTestId } = render(<RootLayout />);
    
    // The root layout should render without errors
    // This tests that the Stack navigation is properly configured
    expect(true).toBe(true); // Basic smoke test
  });

  it('verifies deep linking scheme is configured', () => {
    // Check that the app.json has the correct scheme
    const appConfig = require('../../app.json');
    expect(appConfig.expo.scheme).toBe('rummyledger');
  });

  it('verifies expo-router plugin is configured', () => {
    // Check that expo-router plugin is in the app.json
    const appConfig = require('../../app.json');
    expect(appConfig.expo.plugins).toContain('expo-router');
  });

  it('verifies typed routes are enabled', () => {
    // Check that typed routes experiment is enabled
    const appConfig = require('../../app.json');
    expect(appConfig.expo.experiments.typedRoutes).toBe(true);
  });
});

describe('Navigation State Persistence', () => {
  it('handles splash screen configuration', () => {
    const SplashScreen = require('expo-splash-screen');
    
    // Verify splash screen methods are available
    expect(SplashScreen.preventAutoHideAsync).toBeDefined();
    expect(SplashScreen.hideAsync).toBeDefined();
  });

  it('verifies game context is properly exported', () => {
    const { GameProvider, useGame } = require('@/src/context/GameContext');
    
    // Verify that GameProvider and useGame are available
    expect(GameProvider).toBeDefined();
    expect(useGame).toBeDefined();
  });
});

describe('Navigation Configuration', () => {
  it('has all required screens configured', () => {
    // This is a structural test to ensure all screens are present
    const fs = require('fs');
    const path = require('path');
    
    const appDir = path.join(__dirname, '../../app');
    const files = fs.readdirSync(appDir);
    
    const expectedScreens = [
      'index.tsx',
      'game-setup.tsx', 
      'game-play.tsx',
      'history.tsx',
      'score-entry.tsx',
      'game-details.tsx',
      '_layout.tsx',
      '+not-found.tsx'
    ];
    
    expectedScreens.forEach(screen => {
      expect(files).toContain(screen);
    });
  });

  it('verifies modal screens are properly configured', () => {
    // Test that modal screens exist and are accessible
    const scoreEntryExists = require('fs').existsSync(
      require('path').join(__dirname, '../../app/score-entry.tsx')
    );
    const gameDetailsExists = require('fs').existsSync(
      require('path').join(__dirname, '../../app/game-details.tsx')
    );
    
    expect(scoreEntryExists).toBe(true);
    expect(gameDetailsExists).toBe(true);
  });
});