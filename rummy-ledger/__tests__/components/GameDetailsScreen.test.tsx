import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import GameDetailsScreen from '../../app/game-details';
import { useGame } from '../../src/context/GameContext';
import { Game } from '../../src/types';

// Mock dependencies
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../src/context/GameContext', () => ({
  useGame: jest.fn(),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;

describe('GameDetailsScreen', () => {
  const mockGame: Game = {
    id: 'test-game-id',
    players: [
      { id: 'p1', name: 'Alice', totalScore: 45, isLeader: false },
      { id: 'p2', name: 'Bob', totalScore: 32, isLeader: true },
      { id: 'p3', name: 'Charlie', totalScore: 67, isLeader: false },
    ],
    rounds: [
      {
        id: 'r1',
        roundNumber: 1,
        scores: [
          { playerId: 'p1', score: 15, isRummy: false },
          { playerId: 'p2', score: 12, isRummy: false },
          { playerId: 'p3', score: 23, isRummy: false },
        ],
        timestamp: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'r2',
        roundNumber: 2,
        scores: [
          { playerId: 'p1', score: 30, isRummy: false },
          { playerId: 'p2', score: 20, isRummy: false },
          { playerId: 'p3', score: 0, isRummy: true },
        ],
        timestamp: new Date('2024-01-15T10:15:00Z'),
      },
    ],
    targetScore: 100,
    status: 'completed',
    winner: 'Bob',
    createdAt: new Date('2024-01-15T09:30:00Z'),
    completedAt: new Date('2024-01-15T10:30:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Game Found', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ gameId: 'test-game-id' });
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });
    });

    it('should display game summary information', () => {
      const { getByText } = render(<GameDetailsScreen />);

      expect(getByText('Game Summary')).toBeTruthy();
      expect(getByText('Date')).toBeTruthy();
      expect(getByText('Duration')).toBeTruthy();
      expect(getByText('Rounds')).toBeTruthy();
      expect(getByText('Target Score')).toBeTruthy();
      
      // Check values
      expect(getByText('2')).toBeTruthy(); // rounds count
      expect(getByText('100')).toBeTruthy(); // target score
      expect(getByText('60 minutes')).toBeTruthy(); // duration
    });

    it('should display final rankings with winner highlighted', () => {
      const { getByText, getAllByText } = render(<GameDetailsScreen />);

      expect(getByText('Final Rankings')).toBeTruthy();
      
      // Check rankings (sorted by score)
      expect(getByText('#1')).toBeTruthy();
      expect(getByText('Bob 👑')).toBeTruthy(); // Winner with crown
      expect(getAllByText('32').length).toBeGreaterThan(0); // Bob's score (may appear multiple times)
      
      expect(getByText('#2')).toBeTruthy();
      expect(getAllByText('Alice').length).toBeGreaterThan(0);
      expect(getAllByText('45').length).toBeGreaterThan(0); // Alice's score
      
      expect(getByText('#3')).toBeTruthy();
      expect(getAllByText('Charlie').length).toBeGreaterThan(0);
      expect(getAllByText('67').length).toBeGreaterThan(0); // Charlie's score
    });

    it('should display round by round breakdown', () => {
      const { getByText, getAllByText } = render(<GameDetailsScreen />);

      expect(getByText('Round by Round')).toBeTruthy();
      
      // Round 1
      expect(getByText('Round 1')).toBeTruthy();
      expect(getAllByText('15').length).toBeGreaterThan(0); // Alice's round 1 score
      expect(getAllByText('12').length).toBeGreaterThan(0); // Bob's round 1 score
      expect(getAllByText('23').length).toBeGreaterThan(0); // Charlie's round 1 score
      
      // Round 2
      expect(getByText('Round 2')).toBeTruthy();
      expect(getAllByText('30').length).toBeGreaterThan(0); // Alice's round 2 score
      expect(getAllByText('20').length).toBeGreaterThan(0); // Bob's round 2 score
      expect(getByText('RUMMY (0)')).toBeTruthy(); // Charlie's rummy
    });

    it('should display running totals after each round', () => {
      const { getAllByText } = render(<GameDetailsScreen />);

      expect(getAllByText('Running Totals:').length).toBeGreaterThan(0); // Should appear for each round
      
      // After round 1: Alice=15, Bob=12, Charlie=23
      // After round 2: Alice=45, Bob=32, Charlie=23
      // The component should show running totals for each round
    });

    it('should handle game without target score', () => {
      const gameWithoutTarget = { ...mockGame, targetScore: undefined };
      mockUseGame.mockReturnValue({
        gameHistory: [gameWithoutTarget],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText, queryByText } = render(<GameDetailsScreen />);

      expect(getByText('Game Summary')).toBeTruthy();
      expect(queryByText('Target Score')).toBeNull(); // Should not show target score section
    });

    it('should handle game in progress', () => {
      const gameInProgress = { ...mockGame, completedAt: undefined, status: 'active' as const };
      mockUseGame.mockReturnValue({
        gameHistory: [gameInProgress],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText } = render(<GameDetailsScreen />);

      expect(getByText('In progress')).toBeTruthy(); // Duration should show "In progress"
    });

    it('should handle game with no rounds', () => {
      const gameWithoutRounds = { ...mockGame, rounds: [] };
      mockUseGame.mockReturnValue({
        gameHistory: [gameWithoutRounds],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText, queryByText } = render(<GameDetailsScreen />);

      expect(getByText('0')).toBeTruthy(); // rounds count should be 0
      expect(queryByText('Round by Round')).toBeNull(); // Should not show round breakdown
    });
  });

  describe('Game Not Found', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ gameId: 'nonexistent-game-id' });
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame], // Game exists but with different ID
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });
    });

    it('should display error message when game is not found', () => {
      const { getByText } = render(<GameDetailsScreen />);

      expect(getByText('Game not found')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing gameId parameter', () => {
      mockUseLocalSearchParams.mockReturnValue({});
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText } = render(<GameDetailsScreen />);

      expect(getByText('Game not found')).toBeTruthy();
    });

    it('should handle empty game history', () => {
      mockUseLocalSearchParams.mockReturnValue({ gameId: 'test-game-id' });
      mockUseGame.mockReturnValue({
        gameHistory: [],
        currentGame: null,
        recentPlayers: [],
        loading: false,
        error: null,
        createGame: jest.fn(),
        addRound: jest.fn(),
        editRound: jest.fn(),
        deleteRound: jest.fn(),
        endGame: jest.fn(),
        clearError: jest.fn(),
      });

      const { getByText } = render(<GameDetailsScreen />);

      expect(getByText('Game not found')).toBeTruthy();
    });
  });
});