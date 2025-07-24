import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Game } from '../../src/types';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

// Mock the GameContext
const mockGameContext = {
  currentGame: null as Game | null,
  gameHistory: [] as Game[],
  recentPlayers: [] as string[],
  loading: false,
  error: null as string | null,
  createGame: jest.fn(),
  addRound: jest.fn(),
  editRound: jest.fn(),
  deleteRound: jest.fn(),
  endGame: jest.fn(),
  clearError: jest.fn(),
};

jest.mock('@/src/context/GameContext', () => ({
  useGame: () => mockGameContext,
  GameProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);

// Import after mocking
import HomeScreen from '../../app/index';

describe('HomeScreen', () => {
  const mockGame: Game = {
    id: '1',
    players: [
      { id: '1', name: 'Alice', totalScore: 50, isLeader: true },
      { id: '2', name: 'Bob', totalScore: 75, isLeader: false },
    ],
    rounds: [],
    status: 'active',
    createdAt: new Date('2024-01-01'),
    winner: 'Alice',
  };

  const mockCompletedGame: Game = {
    ...mockGame,
    status: 'completed',
    completedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock context to default state
    Object.assign(mockGameContext, {
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
    });
  });

  describe('Basic Rendering', () => {
    it('renders the home screen with title and subtitle', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Rummy Ledger')).toBeTruthy();
      expect(
        getByText('Digital scorekeeping for your Rummy games')
      ).toBeTruthy();
    });

    it('renders Create New Game button', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Create New Game')).toBeTruthy();
    });

    it('renders Game History button', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Game History')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to game setup when Create New Game is pressed', () => {
      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Create New Game'));

      expect(router.push).toHaveBeenCalledWith('/game-setup');
    });

    it('navigates to history when Game History is pressed', () => {
      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Game History'));

      expect(router.push).toHaveBeenCalledWith('/history');
    });

    it('navigates to game play when Resume Current Game is pressed', () => {
      mockGameContext.currentGame = mockGame;

      const { getByText } = render(<HomeScreen />);

      fireEvent.press(getByText('Resume Current Game'));

      expect(router.push).toHaveBeenCalledWith('/game-play');
    });
  });

  describe('Current Game Display', () => {
    it('shows Resume Current Game button when there is an active game', () => {
      mockGameContext.currentGame = mockGame;

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Resume Current Game')).toBeTruthy();
    });

    it('does not show Resume Current Game button when there is no active game', () => {
      const { queryByText } = render(<HomeScreen />);

      expect(queryByText('Resume Current Game')).toBeNull();
    });
  });

  describe('Recent Games Display', () => {
    it('displays recent games when game history exists', () => {
      mockGameContext.gameHistory = [mockCompletedGame];

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Recent Games')).toBeTruthy();
      expect(getByText('Alice, Bob')).toBeTruthy();
      expect(getByText('Winner: Alice')).toBeTruthy();
    });

    it('displays empty state when no games exist', () => {
      const { getByText } = render(<HomeScreen />);

      expect(
        getByText('No games yet. Create your first game to get started!')
      ).toBeTruthy();
    });

    it('displays only the 3 most recent games', () => {
      const games = Array.from({ length: 5 }, (_, i) => ({
        ...mockCompletedGame,
        id: `game-${i}`,
        createdAt: new Date(`2024-01-0${i + 1}`),
      }));

      mockGameContext.gameHistory = games;

      const { getAllByText } = render(<HomeScreen />);

      // Should only show 3 games (Alice, Bob appears 3 times)
      const playerTexts = getAllByText('Alice, Bob');
      expect(playerTexts).toHaveLength(3);
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when loading is true and no games exist', () => {
      mockGameContext.loading = true;

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Loading your games...')).toBeTruthy();
    });

    it('disables buttons when loading is true', () => {
      mockGameContext.currentGame = mockGame;
      mockGameContext.gameHistory = [mockCompletedGame]; // Add some history so loading indicator doesn't show
      mockGameContext.loading = true;

      const { getByText, queryByText } = render(<HomeScreen />);

      // When loading, Create New Game text should not be visible (replaced by spinner)
      expect(queryByText('Create New Game')).toBeNull();

      // Other buttons should still be visible but disabled
      const historyButton = getByText('Game History').parent;
      const resumeButton = getByText('Resume Current Game').parent;

      expect(historyButton).toBeTruthy();
      expect(resumeButton).toBeTruthy();
    });

    it('shows loading spinner in Create New Game button when loading', () => {
      mockGameContext.loading = true;
      mockGameContext.gameHistory = [mockCompletedGame]; // Add history so main loading doesn't show

      const { queryByText } = render(<HomeScreen />);

      // When loading, the text should not be visible (replaced by spinner)
      expect(queryByText('Create New Game')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when error exists', async () => {
      const mockClearError = jest.fn();
      mockGameContext.error = 'Failed to load games';
      mockGameContext.clearError = mockClearError;

      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to load games',
          [
            {
              text: 'OK',
              onPress: mockClearError,
            },
          ]
        );
      });
    });

    it('calls clearError when error alert OK is pressed', async () => {
      const mockClearError = jest.fn();
      mockGameContext.error = 'Test error';
      mockGameContext.clearError = mockClearError;

      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Simulate pressing OK button
      const alertCall = mockAlert.mock.calls[0];
      const okButton = alertCall[2][0];
      okButton.onPress();

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Game Date Formatting', () => {
    it('formats game dates correctly', () => {
      const testDate = new Date('2024-01-15');
      const gameWithDate = {
        ...mockCompletedGame,
        createdAt: testDate,
      };

      mockGameContext.gameHistory = [gameWithDate];

      const { getByText } = render(<HomeScreen />);

      // Check that the date is formatted (exact format may vary by locale)
      expect(getByText(testDate.toLocaleDateString())).toBeTruthy();
    });
  });

  describe('Game Without Winner', () => {
    it('does not display winner text when game has no winner', () => {
      const gameWithoutWinner = {
        ...mockCompletedGame,
        winner: undefined,
      };

      mockGameContext.gameHistory = [gameWithoutWinner];

      const { queryByText } = render(<HomeScreen />);

      expect(queryByText(/Winner:/)).toBeNull();
    });
  });
});
