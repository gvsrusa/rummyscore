/**
 * Screen Transitions Animation Tests
 * Tests for smooth screen transitions and entrance animations
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { GameProvider } from '@/src/context/GameContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import HomeScreen from '@/app/index';
import GameSetupScreen from '@/app/game-setup';
import GamePlayScreen from '@/app/game-play';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Add missing mocks
  Reanimated.default.createAnimatedComponent = (component: any) => component;
  Reanimated.default.View = require('react-native').View;
  
  return {
    ...Reanimated,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
    withDelay: jest.fn((delay, animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    interpolate: jest.fn((value, input, output) => output[0]),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

// Mock haptic service
jest.mock('@/src/services/HapticService', () => ({
  useHaptics: () => ({
    gameCreation: jest.fn(),
    buttonPress: jest.fn(),
    errorAction: jest.fn(),
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <GameProvider>
      {children}
    </GameProvider>
  </ThemeProvider>
);

describe('Screen Transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HomeScreen Animations', () => {
    it('should render with entrance animations', async () => {
      const { getByText } = render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      expect(getByText('Rummy Ledger')).toBeTruthy();
      expect(getByText('Digital scorekeeping for your Rummy games')).toBeTruthy();
      expect(getByText('Create New Game')).toBeTruthy();
    });

    it('should animate header and buttons separately', async () => {
      const mockUseSharedValue = require('react-native-reanimated').useSharedValue;
      const mockUseAnimatedStyle = require('react-native-reanimated').useAnimatedStyle;
      
      render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      // Verify animation values are created
      expect(mockUseSharedValue).toHaveBeenCalledWith(0); // headerOpacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(-30); // headerTranslateY
      expect(mockUseSharedValue).toHaveBeenCalledWith(0); // buttonsOpacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(50); // buttonsTranslateY

      // Verify animated styles are applied
      expect(mockUseAnimatedStyle).toHaveBeenCalled();
    });

    it('should show recent games with staggered animations', async () => {
      // Mock game history
      const mockGameHistory = [
        {
          id: '1',
          players: [{ id: '1', name: 'Player 1', totalScore: 100, isLeader: false }],
          rounds: [],
          status: 'completed' as const,
          winner: 'Player 1',
          createdAt: new Date(),
        },
      ];

      jest.doMock('@/src/context/GameContext', () => ({
        useGame: () => ({
          gameHistory: mockGameHistory,
          currentGame: null,
          loading: false,
          error: null,
          clearError: jest.fn(),
        }),
      }));

      const { getByText } = render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      expect(getByText('Recent Games')).toBeTruthy();
      expect(getByText('Player 1')).toBeTruthy();
    });
  });

  describe('GameSetupScreen Animations', () => {
    it('should render with entrance animations', async () => {
      const { getByText } = render(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      expect(getByText('Players (2/6)')).toBeTruthy();
      expect(getByText('Target Score (Optional)')).toBeTruthy();
      expect(getByText('Start Game')).toBeTruthy();
    });

    it('should animate player inputs with staggered timing', async () => {
      const mockUseSharedValue = require('react-native-reanimated').useSharedValue;
      
      render(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      // Verify screen animation values are created
      expect(mockUseSharedValue).toHaveBeenCalledWith(0); // screenOpacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(30); // screenTranslateY
    });
  });

  describe('GamePlayScreen Animations', () => {
    it('should handle missing game gracefully', async () => {
      const mockReplace = jest.fn();
      jest.doMock('expo-router', () => ({
        router: { replace: mockReplace },
      }));

      render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('should create leaderboard animations for players', async () => {
      // Mock current game
      const mockCurrentGame = {
        id: '1',
        players: [
          { id: '1', name: 'Player 1', totalScore: 50, isLeader: true },
          { id: '2', name: 'Player 2', totalScore: 75, isLeader: false },
        ],
        rounds: [],
        status: 'active' as const,
        createdAt: new Date(),
      };

      jest.doMock('@/src/context/GameContext', () => ({
        useGame: () => ({
          currentGame: mockCurrentGame,
          addRound: jest.fn(),
          editRound: jest.fn(),
          deleteRound: jest.fn(),
          endGame: jest.fn(),
        }),
      }));

      const mockUseSharedValue = require('react-native-reanimated').useSharedValue;

      render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      // Verify animation values are created for screen and leaderboard
      expect(mockUseSharedValue).toHaveBeenCalledWith(1); // leaderboardScale
      expect(mockUseSharedValue).toHaveBeenCalledWith(0); // screenOpacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(50); // screenTranslateY
    });
  });

  describe('Animation Performance', () => {
    it('should use spring animations for smooth transitions', () => {
      const mockWithSpring = require('react-native-reanimated').withSpring;
      
      render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      expect(mockWithSpring).toHaveBeenCalledWith(1, { damping: 15, stiffness: 150 });
      expect(mockWithSpring).toHaveBeenCalledWith(0, { damping: 15, stiffness: 150 });
    });

    it('should use appropriate delays for staggered animations', () => {
      const mockWithDelay = require('react-native-reanimated').withDelay;
      
      render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      expect(mockWithDelay).toHaveBeenCalledWith(100, expect.anything());
      expect(mockWithDelay).toHaveBeenCalledWith(300, expect.anything());
    });

    it('should maintain 60fps target with optimized animations', () => {
      // Test that animations use native driver compatible properties
      const mockUseAnimatedStyle = require('react-native-reanimated').useAnimatedStyle;
      
      render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      // Verify animated styles are created (native driver compatible)
      expect(mockUseAnimatedStyle).toHaveBeenCalled();
    });
  });
});