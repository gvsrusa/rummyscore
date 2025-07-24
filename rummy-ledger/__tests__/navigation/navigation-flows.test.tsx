import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Game, Player } from '@/src/types';

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

// Create mock game data
const mockPlayers: Player[] = [
  { id: '1', name: 'Alice', totalScore: 45, isLeader: true },
  { id: '2', name: 'Bob', totalScore: 67, isLeader: false },
];

const mockGame: Game = {
  id: 'test-game-id',
  players: mockPlayers,
  rounds: [
    {
      id: 'round-1',
      roundNumber: 1,
      scores: [
        { playerId: '1', score: 25, isRummy: false },
        { playerId: '2', score: 30, isRummy: false },
      ],
      timestamp: new Date(),
    },
    {
      id: 'round-2',
      roundNumber: 2,
      scores: [
        { playerId: '1', score: 20, isRummy: false },
        { playerId: '2', score: 37, isRummy: false },
      ],
      timestamp: new Date(),
    },
  ],
  targetScore: 500,
  status: 'active',
  createdAt: new Date(),
};

const mockCompletedGame: Game = {
  ...mockGame,
  status: 'completed',
  winner: 'Alice',
  completedAt: new Date(),
};

// Mock the GameContext with different states
const createMockGameContext = (overrides = {}) => ({
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
  ...overrides,
});

jest.mock('@/src/context/GameContext', () => ({
  useGame: jest.fn(),
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import screens after mocking
import HomeScreen from '../../app/index';
import GameSetupScreen from '../../app/game-setup';
import GamePlayScreen from '../../app/game-play';
import HistoryScreen from '../../app/history';
import ScoreEntryScreen from '../../app/score-entry';
import GameDetailsScreen from '../../app/game-details';

const { useGame } = require('@/src/context/GameContext');

describe('Navigation Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Game Flow', () => {
    it('navigates through complete game creation flow', async () => {
      // Start with empty state
      useGame.mockReturnValue(createMockGameContext());
      
      const { getByText } = render(<HomeScreen />);
      
      // Navigate to game setup
      fireEvent.press(getByText('Create New Game'));
      expect(router.push).toHaveBeenCalledWith('/game-setup');
    });

    it('handles game setup with player management', async () => {
      const mockCreateGame = jest.fn();
      useGame.mockReturnValue(createMockGameContext({
        createGame: mockCreateGame,
      }));
      
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      // Fill in player names
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      
      // Start game
      fireEvent.press(getByText('Start Game'));
      
      expect(mockCreateGame).toHaveBeenCalledWith(['Alice', 'Bob'], undefined);
      expect(router.replace).toHaveBeenCalledWith('/game-play');
    });

    it('displays active game correctly', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
      }));
      
      const { getByText } = render(<GamePlayScreen />);
      
      expect(getByText('Round 3')).toBeTruthy(); // Next round number
      expect(getByText('Target: 500')).toBeTruthy();
      expect(getByText('Alice 👑')).toBeTruthy(); // Leader indicator
      expect(getByText('Add Round')).toBeTruthy();
    });

    it('shows score entry modal from game play', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
      }));
      
      const { getByText } = render(<GamePlayScreen />);
      
      fireEvent.press(getByText('Add Round'));
      
      // Check that the modal is shown by looking for the modal title
      // mockGame has 2 rounds, so next round would be 3
      expect(getByText('Round 3 Scores')).toBeTruthy();
    });

    it('handles score entry submission', async () => {
      const mockAddRound = jest.fn();
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
        addRound: mockAddRound,
      }));
      
      const { getByText, getAllByPlaceholderText } = render(<ScoreEntryScreen />);
      
      // Enter scores for players
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '15');
      fireEvent.changeText(scoreInputs[1], '20');
      
      // Submit scores
      fireEvent.press(getByText('Add Scores'));
      
      expect(mockAddRound).toHaveBeenCalled();
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('History and Game Details Flow', () => {
    it('displays game history correctly', () => {
      useGame.mockReturnValue(createMockGameContext({
        gameHistory: [mockCompletedGame],
      }));
      
      const { getByText } = render(<HistoryScreen />);
      
      expect(getByText('Players: Alice, Bob')).toBeTruthy();
      expect(getByText('Winner: Alice 👑')).toBeTruthy();
      expect(getByText('2 rounds')).toBeTruthy();
    });

    it('navigates to game details from history', () => {
      useGame.mockReturnValue(createMockGameContext({
        gameHistory: [mockCompletedGame],
      }));
      
      const { getByText } = render(<HistoryScreen />);
      
      // Find and press the game item
      const gameItem = getByText('Players: Alice, Bob').parent?.parent;
      if (gameItem) {
        fireEvent.press(gameItem);
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/game-details',
          params: { gameId: mockCompletedGame.id },
        });
      }
    });

    it('displays game details correctly', () => {
      useGame.mockReturnValue(createMockGameContext({
        gameHistory: [mockCompletedGame],
      }));
      
      const { getByText } = render(<GameDetailsScreen />);
      
      expect(getByText('Game Summary')).toBeTruthy();
      expect(getByText('Final Rankings')).toBeTruthy();
      expect(getByText('Round by Round')).toBeTruthy();
      expect(getByText('Alice 👑')).toBeTruthy(); // Winner
    });
  });

  describe('Modal Navigation', () => {
    it('handles score entry modal cancellation', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
      }));
      
      const { getByText } = render(<ScoreEntryScreen />);
      
      fireEvent.press(getByText('Cancel'));
      expect(router.back).toHaveBeenCalled();
    });

    it('handles rummy button toggle in score entry', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
      }));
      
      const { getAllByText } = render(<ScoreEntryScreen />);
      
      // Find and press a RUMMY button
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);
      
      // Verify haptic feedback was called
      const haptics = require('expo-haptics');
      expect(haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe('Navigation State Persistence', () => {
    it('handles app state restoration', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: mockGame,
      }));
      
      const { getByText } = render(<HomeScreen />);
      
      // Should show resume game option when there's a current game
      expect(getByText('Resume Current Game')).toBeTruthy();
      
      fireEvent.press(getByText('Resume Current Game'));
      expect(router.push).toHaveBeenCalledWith('/game-play');
    });

    it('handles deep linking to game details', () => {
      // Mock useLocalSearchParams to return a game ID
      const mockUseLocalSearchParams = jest.fn(() => ({ gameId: mockCompletedGame.id }));
      jest.doMock('expo-router', () => ({
        ...jest.requireActual('expo-router'),
        useLocalSearchParams: mockUseLocalSearchParams,
      }));
      
      useGame.mockReturnValue(createMockGameContext({
        gameHistory: [mockCompletedGame],
      }));
      
      const { getByText } = render(<GameDetailsScreen />);
      
      expect(getByText('Game Summary')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('redirects to home when accessing game play without current game', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: null,
      }));
      
      render(<GamePlayScreen />);
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('redirects to home when accessing score entry without current game', () => {
      useGame.mockReturnValue(createMockGameContext({
        currentGame: null,
      }));
      
      render(<ScoreEntryScreen />);
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('shows error when game details not found', () => {
      useGame.mockReturnValue(createMockGameContext({
        gameHistory: [], // Empty history
      }));
      
      const { getByText } = render(<GameDetailsScreen />);
      expect(getByText('Game not found')).toBeTruthy();
    });
  });
});