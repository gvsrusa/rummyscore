import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import GameHistoryScreen from '../../app/history';
import { useGame } from '../../src/context/GameContext';
import { Game } from '../../src/types';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('../../src/context/GameContext', () => ({
  useGame: jest.fn(),
}));

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

describe('GameHistoryScreen', () => {
  const mockGame1: Game = {
    id: 'game-1',
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
          { playerId: 'p3', score: 44, isRummy: false },
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

  const mockGame2: Game = {
    id: 'game-2',
    players: [
      { id: 'p4', name: 'David', totalScore: 78, isLeader: false },
      { id: 'p5', name: 'Eve', totalScore: 56, isLeader: true },
    ],
    rounds: [
      {
        id: 'r3',
        roundNumber: 1,
        scores: [
          { playerId: 'p4', score: 78, isRummy: false },
          { playerId: 'p5', score: 56, isRummy: false },
        ],
        timestamp: new Date('2024-01-14T14:00:00Z'),
      },
    ],
    status: 'completed',
    winner: 'Eve',
    createdAt: new Date('2024-01-14T13:30:00Z'),
    completedAt: new Date('2024-01-14T14:30:00Z'),
  };

  const mockRecentGame: Game = {
    id: 'game-recent',
    players: [
      { id: 'p6', name: 'Frank', totalScore: 25, isLeader: true },
      { id: 'p7', name: 'Grace', totalScore: 40, isLeader: false },
    ],
    rounds: [
      {
        id: 'r4',
        roundNumber: 1,
        scores: [
          { playerId: 'p6', score: 25, isRummy: false },
          { playerId: 'p7', score: 40, isRummy: false },
        ],
        timestamp: new Date(),
      },
    ],
    targetScore: 50,
    status: 'completed',
    winner: 'Frank',
    createdAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when no games exist', () => {
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

      const { getByText } = render(<GameHistoryScreen />);

      expect(getByText('No Games Yet')).toBeTruthy();
      expect(getByText('Start playing some Rummy games to see your history here!')).toBeTruthy();
      expect(getByText('Create Your First Game')).toBeTruthy();
    });

    it('should navigate to game setup when create first game button is pressed', () => {
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

      const { getByText } = render(<GameHistoryScreen />);
      
      fireEvent.press(getByText('Create Your First Game'));
      
      expect(mockRouterPush).toHaveBeenCalledWith('/game-setup');
    });
  });

  describe('Game List Display', () => {
    beforeEach(() => {
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame1, mockGame2, mockRecentGame],
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

    it('should display chronological list of games', () => {
      const { getByText } = render(<GameHistoryScreen />);

      // Should show all games
      expect(getByText('3 games found')).toBeTruthy();
      
      // Should show game details
      expect(getByText('Players: Alice, Bob, Charlie')).toBeTruthy();
      expect(getByText('Winner: Bob 👑')).toBeTruthy();
      expect(getByText('Players: David, Eve')).toBeTruthy();
      expect(getByText('Winner: Eve 👑')).toBeTruthy();
    });

    it('should display game date and time correctly', () => {
      const { getByText } = render(<GameHistoryScreen />);

      // Check date formatting (will vary based on locale, but should contain date elements)
      expect(getByText(/Jan.*15.*2024/)).toBeTruthy();
      expect(getByText(/Jan.*14.*2024/)).toBeTruthy();
    });

    it('should display game statistics', () => {
      const { getByText, getAllByText } = render(<GameHistoryScreen />);

      expect(getByText('2 rounds')).toBeTruthy();
      expect(getByText('Target: 100')).toBeTruthy();
      expect(getAllByText('1 rounds')).toHaveLength(2); // Two games have 1 round each
    });

    it('should display final scores with rankings', () => {
      const { getByText, getAllByText } = render(<GameHistoryScreen />);

      // Check that rankings are displayed (multiple games will have #1, #2, etc.)
      expect(getAllByText('#1').length).toBeGreaterThan(0);
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('32')).toBeTruthy();
    });

    it('should navigate to game details when game item is pressed', () => {
      const { getByText } = render(<GameHistoryScreen />);
      
      // The players are displayed in score order, so Bob, Alice, Charlie
      fireEvent.press(getByText('Players: Bob, Alice, Charlie'));
      
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/game-details',
        params: { gameId: 'game-1' },
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame1, mockGame2, mockRecentGame],
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

    it('should filter games by player name', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<GameHistoryScreen />);
      
      const searchInput = getByPlaceholderText('Search by player name, winner, or date...');
      fireEvent.changeText(searchInput, 'Alice');

      await waitFor(() => {
        expect(getByText('1 game found')).toBeTruthy();
        expect(getByText('Players: Bob, Alice, Charlie')).toBeTruthy(); // Players shown in score order
        expect(queryByText('Players: Eve, David')).toBeNull();
      });
    });

    it('should filter games by winner name', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<GameHistoryScreen />);
      
      const searchInput = getByPlaceholderText('Search by player name, winner, or date...');
      fireEvent.changeText(searchInput, 'Eve');

      await waitFor(() => {
        expect(getByText('1 game found')).toBeTruthy();
        expect(getByText('Players: Eve, David')).toBeTruthy(); // Players shown in score order
        expect(queryByText('Players: Bob, Alice, Charlie')).toBeNull();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      const { getByPlaceholderText, getByText } = render(<GameHistoryScreen />);
      
      const searchInput = getByPlaceholderText('Search by player name, winner, or date...');
      fireEvent.changeText(searchInput, 'NonexistentPlayer');

      await waitFor(() => {
        expect(getByText('0 games found')).toBeTruthy();
        expect(getByText('No Games Found')).toBeTruthy();
        expect(getByText('Try adjusting your search or filter criteria')).toBeTruthy();
      });
    });

    it('should clear search when clear filters button is pressed', async () => {
      const { getByPlaceholderText, getByText } = render(<GameHistoryScreen />);
      
      const searchInput = getByPlaceholderText('Search by player name, winner, or date...');
      fireEvent.changeText(searchInput, 'NonexistentPlayer');

      await waitFor(() => {
        expect(getByText('No Games Found')).toBeTruthy();
      });

      fireEvent.press(getByText('Clear All Filters'));

      await waitFor(() => {
        expect(getByText('3 games found')).toBeTruthy();
      });
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame1, mockGame2, mockRecentGame],
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

    it('should open filter modal when filter button is pressed', async () => {
      const { getByText } = render(<GameHistoryScreen />);
      
      fireEvent.press(getByText('All Games'));

      await waitFor(() => {
        expect(getByText('Filter Games')).toBeTruthy();
        expect(getByText('Completed')).toBeTruthy();
        expect(getByText('With Target')).toBeTruthy();
        expect(getByText('Recent (7 days)')).toBeTruthy();
      });
    });

    it('should filter by completed games', async () => {
      const { getByText } = render(<GameHistoryScreen />);
      
      fireEvent.press(getByText('All Games'));
      
      await waitFor(() => {
        expect(getByText('Filter Games')).toBeTruthy();
      });

      fireEvent.press(getByText('Completed'));

      await waitFor(() => {
        expect(getByText('Completed')).toBeTruthy(); // Filter button should show selected filter
        expect(getByText('3 games found')).toBeTruthy(); // All test games are completed
      });
    });

    it('should filter by games with target score', async () => {
      const { getByText } = render(<GameHistoryScreen />);
      
      fireEvent.press(getByText('All Games'));
      fireEvent.press(getByText('With Target'));

      await waitFor(() => {
        expect(getByText('With Target')).toBeTruthy();
        expect(getByText('2 games found')).toBeTruthy(); // mockGame1 and mockRecentGame have target scores
      });
    });

    it('should close filter modal when cancel is pressed', async () => {
      const { getByText, queryByText } = render(<GameHistoryScreen />);
      
      fireEvent.press(getByText('All Games'));
      
      await waitFor(() => {
        expect(getByText('Filter Games')).toBeTruthy();
      });

      fireEvent.press(getByText('Cancel'));

      await waitFor(() => {
        expect(queryByText('Filter Games')).toBeNull();
      });
    });
  });

  describe('Combined Search and Filter', () => {
    beforeEach(() => {
      mockUseGame.mockReturnValue({
        gameHistory: [mockGame1, mockGame2, mockRecentGame],
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

    it('should apply both search and filter simultaneously', async () => {
      const { getByPlaceholderText, getByText } = render(<GameHistoryScreen />);
      
      // Apply filter first
      fireEvent.press(getByText('All Games'));
      fireEvent.press(getByText('With Target'));

      await waitFor(() => {
        expect(getByText('2 games found')).toBeTruthy();
      });

      // Then apply search
      const searchInput = getByPlaceholderText('Search by player name, winner, or date...');
      fireEvent.changeText(searchInput, 'Alice');

      await waitFor(() => {
        expect(getByText('1 game found')).toBeTruthy(); // Only mockGame1 has Alice and target score
      });
    });
  });
});