import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

// Mock the GameContext
const mockGameContext = {
  currentGame: null,
  gameHistory: [],
  recentPlayers: [],
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

// Import screens after mocking
import HomeScreen from '../../app/index';
import GameSetupScreen from '../../app/game-setup';
import GamePlayScreen from '../../app/game-play';
import HistoryScreen from '../../app/history';
import ScoreEntryScreen from '../../app/score-entry';
import GameDetailsScreen from '../../app/game-details';

describe('Navigation Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HomeScreen', () => {
    it('renders correctly', () => {
      const { getByText } = render(<HomeScreen />);
      expect(getByText('Rummy Ledger')).toBeTruthy();
      expect(getByText('Create New Game')).toBeTruthy();
      expect(getByText('Game History')).toBeTruthy();
    });

    it('navigates to game setup when create new game is pressed', () => {
      const { getByText } = render(<HomeScreen />);
      const createButton = getByText('Create New Game');
      
      // Simulate press
      fireEvent.press(createButton);
      expect(router.push).toHaveBeenCalledWith('/game-setup');
    });

    it('navigates to history when history button is pressed', () => {
      const { getByText } = render(<HomeScreen />);
      const historyButton = getByText('Game History');
      
      // Simulate press
      fireEvent.press(historyButton);
      expect(router.push).toHaveBeenCalledWith('/history');
    });
  });

  describe('GameSetupScreen', () => {
    it('renders correctly', () => {
      const { getByText } = render(<GameSetupScreen />);
      expect(getByText('Players (2/6)')).toBeTruthy();
      expect(getByText('Target Score (Optional)')).toBeTruthy();
      expect(getByText('Start Game')).toBeTruthy();
    });
  });

  describe('GamePlayScreen', () => {
    it('redirects to home when no current game', () => {
      render(<GamePlayScreen />);
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('HistoryScreen', () => {
    it('renders empty state when no games', () => {
      const { getByText } = render(<HistoryScreen />);
      expect(getByText('No Games Yet')).toBeTruthy();
      expect(getByText('Create Your First Game')).toBeTruthy();
    });
  });

  describe('ScoreEntryScreen', () => {
    it('redirects to home when no current game', () => {
      render(<ScoreEntryScreen />);
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('GameDetailsScreen', () => {
    it('renders error when game not found', () => {
      const { getByText } = render(<GameDetailsScreen />);
      expect(getByText('Game not found')).toBeTruthy();
    });
  });
});