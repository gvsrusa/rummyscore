/**
 * Screen Reader Validation Tests
 * Tests for VoiceOver/TalkBack compatibility and screen reader support
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { GameProvider } from '../../src/context/GameContext';
import HomeScreen from '../../app/index';
import GameSetupScreen from '../../app/game-setup';
import GamePlayScreen from '../../app/game-play';
import { ThemedText } from '../../components/ThemedText';
import { ThemedButton } from '../../components/ThemedButton';
import ScoreEntryModal from '../../components/ScoreEntryModal';

// Mock navigation
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock accessibility service
jest.mock('@/src/services/AccessibilityService', () => ({
  accessibilityService: {
    initialize: jest.fn(),
    announce: jest.fn(),
    announceScoreUpdate: jest.fn(),
    announceGameState: jest.fn(),
    getScoreLabel: jest.fn((name, score) => `${name} has ${score} points`),
    getInteractionHint: jest.fn((action) => `Double tap to activate`),
    shouldReduceAnimations: jest.fn(() => false),
    getAnimationDuration: jest.fn((duration) => duration),
    isScreenReaderEnabled: jest.fn(() => true),
    subscribe: jest.fn(() => () => {}),
    getState: jest.fn(() => ({
      isScreenReaderEnabled: true,
      isReduceMotionEnabled: false,
      isHighContrastEnabled: false,
      fontScale: 1,
    })),
  },
  useAccessibility: jest.fn(() => ({
    isScreenReaderEnabled: true,
    isReduceMotionEnabled: false,
    isHighContrastEnabled: false,
    fontScale: 1,
    announce: jest.fn(),
    announceScoreUpdate: jest.fn(),
    announceGameState: jest.fn(),
    getScoreLabel: jest.fn((name, score) => `${name} has ${score} points`),
    getInteractionHint: jest.fn((action) => `Double tap to activate`),
    shouldReduceAnimations: jest.fn(() => false),
    getAnimationDuration: jest.fn((duration) => duration),
    getAccessibilityState: jest.fn((state) => state),
  })),
}));

// Mock game context
jest.mock('@/src/context/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGame: () => ({
    gameHistory: [],
    currentGame: null,
    loading: false,
    error: null,
    clearError: jest.fn(),
    createGame: jest.fn(),
    recentPlayers: ['Alice', 'Bob', 'Charlie'],
  }),
}));

// Mock haptics
jest.mock('@/src/services/HapticService', () => ({
  useHaptics: () => ({
    gameCreation: jest.fn(),
    buttonPress: jest.fn(),
    errorAction: jest.fn(),
  }),
}));

const mockAccessibilityInfo = {
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(true)),
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  isHighContrastEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(),
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: mockAccessibilityInfo,
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GameProvider>
          {children}
        </GameProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

describe('Screen Reader Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Reading Order', () => {
    it('should provide logical reading order for home screen', () => {
      const { getByText, getByRole } = render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      // Check that main heading is properly marked
      const title = getByText('Rummy Ledger');
      expect(title).toBeTruthy();

      // Check that buttons are accessible
      const createGameButton = getByRole('button', { name: /create a new rummy game/i });
      expect(createGameButton).toBeTruthy();
      expect(createGameButton).toHaveProp('accessibilityRole', 'button');
    });

    it('should provide meaningful labels for interactive elements', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Start Game"
            accessibilityLabel="Start a new Rummy game"
            accessibilityHint="Double tap to begin game setup"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityLabel', 'Start a new Rummy game');
      expect(button).toHaveProp('accessibilityHint', 'Double tap to begin game setup');
    });
  });

  describe('Text Content Accessibility', () => {
    it('should provide appropriate roles for different text types', () => {
      const { getByText } = render(
        <TestWrapper>
          <ThemedText 
            type="h1" 
            accessibilityRole="header"
            testID="main-heading"
          >
            Game Title
          </ThemedText>
          <ThemedText 
            type="body"
            testID="body-text"
          >
            Game description text
          </ThemedText>
          <ThemedText 
            type="scoreDisplay"
            accessibilityLabel="Current score is 125 points"
            testID="score-display"
          >
            125
          </ThemedText>
        </TestWrapper>
      );

      const heading = getByText('Game Title');
      expect(heading).toHaveProp('accessibilityRole', 'header');

      const scoreDisplay = getByText('125');
      expect(scoreDisplay).toHaveProp('accessibilityLabel', 'Current score is 125 points');
    });

    it('should handle dynamic content announcements', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ThemedText 
            accessibilityLiveRegion="polite"
            testID="live-text"
          >
            Initial text
          </ThemedText>
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <ThemedText 
            accessibilityLiveRegion="polite"
            testID="live-text"
          >
            Updated text
          </ThemedText>
        </TestWrapper>
      );

      // Live region should announce changes
      const liveText = getByText('Updated text');
      expect(liveText).toHaveProp('accessibilityLiveRegion', 'polite');
    });
  });

  describe('Form Accessibility', () => {
    it('should provide proper form field labeling', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      // Player input fields should have proper labels
      const playerInputs = getByDisplayValue('');
      expect(playerInputs).toBeTruthy();
    });

    it('should associate labels with form controls', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <AccessibleTextInput
            label="Player Name"
            value=""
            required
            accessibilityLabel="Player name input, required"
          />
        </TestWrapper>
      );

      const input = getByLabelText('Player name input, required');
      expect(input).toBeTruthy();
    });

    it('should announce form validation errors', () => {
      const { getByText } = render(
        <TestWrapper>
          <AccessibleTextInput
            label="Score"
            value="invalid"
            error="Please enter a valid number"
          />
        </TestWrapper>
      );

      const errorMessage = getByText('Please enter a valid number');
      expect(errorMessage).toHaveProp('accessibilityRole', 'alert');
      expect(errorMessage).toHaveProp('accessibilityLiveRegion', 'polite');
    });
  });

  describe('Navigation Accessibility', () => {
    it('should provide clear navigation context', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Game History"
            accessibilityLabel="View previous game history"
            accessibilityHint="Double tap to navigate to game history screen"
          />
        </TestWrapper>
      );

      const navButton = getByRole('button');
      expect(navButton).toHaveProp('accessibilityLabel', 'View previous game history');
      expect(navButton).toHaveProp('accessibilityHint', 'Double tap to navigate to game history screen');
    });

    it('should indicate current screen context', () => {
      const { getByText } = render(
        <TestWrapper>
          <ThemedText 
            type="h1"
            accessibilityRole="header"
            accessibilityLabel="Game Setup Screen"
          >
            New Game
          </ThemedText>
        </TestWrapper>
      );

      const screenTitle = getByText('New Game');
      expect(screenTitle).toHaveProp('accessibilityRole', 'header');
    });
  });

  describe('Interactive Element States', () => {
    it('should announce button states clearly', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Submit"
            disabled={true}
            accessibilityLabel="Submit button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityState', { disabled: true, busy: false });
    });

    it('should indicate loading states', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Creating Game"
            loading={true}
            accessibilityLabel="Creating game, please wait"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityState', { disabled: true, busy: true });
    });

    it('should indicate selection states', () => {
      const { getByRole } = render(
        <TestWrapper>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: true }}
            accessibilityLabel="Rummy button, selected"
          >
            <ThemedText>RUMMY</ThemedText>
          </TouchableOpacity>
        </TestWrapper>
      );

      const rummyButton = getByRole('button');
      expect(rummyButton).toHaveProp('accessibilityState', { selected: true });
    });
  });

  describe('Content Grouping', () => {
    it('should group related content logically', () => {
      const { getByRole } = render(
        <TestWrapper>
          <View
            accessibilityRole="group"
            accessibilityLabel="Player scores section"
          >
            <ThemedText>Player Scores</ThemedText>
            <ThemedText>Alice: 50</ThemedText>
            <ThemedText>Bob: 75</ThemedText>
          </View>
        </TestWrapper>
      );

      const scoreGroup = getByRole('group');
      expect(scoreGroup).toHaveProp('accessibilityLabel', 'Player scores section');
    });

    it('should provide list semantics for score lists', () => {
      const { getByRole } = render(
        <TestWrapper>
          <View
            accessibilityRole="list"
            accessibilityLabel="Game history list"
          >
            <View accessibilityRole="listitem">
              <ThemedText>Game 1 - Winner: Alice</ThemedText>
            </View>
            <View accessibilityRole="listitem">
              <ThemedText>Game 2 - Winner: Bob</ThemedText>
            </View>
          </View>
        </TestWrapper>
      );

      const gameList = getByRole('list');
      expect(gameList).toHaveProp('accessibilityLabel', 'Game history list');
    });
  });

  describe('Modal and Dialog Accessibility', () => {
    it('should announce modal opening', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Modal
            visible={true}
            accessibilityViewIsModal={true}
          >
            <View
              accessibilityRole="dialog"
              accessibilityLabel="Score entry dialog"
            >
              <ThemedText>Enter Scores</ThemedText>
            </View>
          </Modal>
        </TestWrapper>
      );

      const dialog = getByRole('dialog');
      expect(dialog).toHaveProp('accessibilityLabel', 'Score entry dialog');
    });

    it('should manage focus properly in modals', () => {
      const { getByRole } = render(
        <TestWrapper>
          <KeyboardNavigationView
            autoFocus={true}
            accessibilityRole="dialog"
          >
            <ThemedButton title="Close" />
          </KeyboardNavigationView>
        </TestWrapper>
      );

      const dialog = getByRole('dialog');
      expect(dialog).toBeTruthy();
    });
  });

  describe('Score and Game State Announcements', () => {
    it('should format score announcements appropriately', () => {
      const { accessibilityService } = require('@/src/services/AccessibilityService');
      
      const scoreLabel = accessibilityService.getScoreLabel('Alice', 125, 1);
      expect(scoreLabel).toBe('Alice has 125 points in position 1');
    });

    it('should announce game state changes', async () => {
      const { accessibilityService } = require('@/src/services/AccessibilityService');
      
      await accessibilityService.announceGameState('Game started with 4 players');
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Game started with 4 players'
      );
    });

    it('should format number announcements for screen readers', () => {
      const { accessibilityService } = require('@/src/services/AccessibilityService');
      
      expect(accessibilityService.formatNumberForScreenReader(0)).toBe('zero');
      expect(accessibilityService.formatNumberForScreenReader(1)).toBe('one point');
      expect(accessibilityService.formatNumberForScreenReader(25)).toBe('25 points');
    });
  });

  describe('Error and Feedback Accessibility', () => {
    it('should announce errors with appropriate urgency', () => {
      const { getByText } = render(
        <TestWrapper>
          <ThemedText
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            Error: Invalid input
          </ThemedText>
        </TestWrapper>
      );

      const errorAlert = getByText('Error: Invalid input');
      expect(errorAlert).toHaveProp('accessibilityRole', 'alert');
      expect(errorAlert).toHaveProp('accessibilityLiveRegion', 'assertive');
    });

    it('should provide success feedback', () => {
      const { getByText } = render(
        <TestWrapper>
          <ThemedText
            accessibilityLiveRegion="polite"
            accessibilityLabel="Success: Game created successfully"
          >
            Game created!
          </ThemedText>
        </TestWrapper>
      );

      const successMessage = getByText('Game created!');
      expect(successMessage).toHaveProp('accessibilityLiveRegion', 'polite');
    });
  });
});

// Import required components for tests
import { View, Modal, TouchableOpacity } from 'react-native';
import { AccessibleTextInput } from '@/components/AccessibleTextInput';
import { KeyboardNavigationView } from '@/components/KeyboardNavigationView';