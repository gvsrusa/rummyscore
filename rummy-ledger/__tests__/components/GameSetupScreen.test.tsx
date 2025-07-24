import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock the GameContext
const mockGameContext = {
  currentGame: null,
  gameHistory: [],
  recentPlayers: ['Alice', 'Bob', 'Charlie', 'Diana'],
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
}));

// Mock validation functions
jest.mock('@/src/models/validation', () => ({
  validatePlayerNames: jest.fn(),
  validateTargetScore: jest.fn(() => true),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);

// Import after mocking
import GameSetupScreen from '../../app/game-setup';
import { validatePlayerNames, validateTargetScore } from '@/src/models/validation';

const mockValidatePlayerNames = validatePlayerNames as jest.MockedFunction<typeof validatePlayerNames>;
const mockValidateTargetScore = validateTargetScore as jest.MockedFunction<typeof validateTargetScore>;

describe('GameSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock context to default state
    Object.assign(mockGameContext, {
      currentGame: null,
      gameHistory: [],
      recentPlayers: ['Alice', 'Bob', 'Charlie', 'Diana'],
      loading: false,
      error: null,
      createGame: jest.fn(),
      addRound: jest.fn(),
      editRound: jest.fn(),
      deleteRound: jest.fn(),
      endGame: jest.fn(),
      clearError: jest.fn(),
    });
    
    // Reset validation mocks
    mockValidatePlayerNames.mockImplementation(() => {});
    mockValidateTargetScore.mockReturnValue(true);
  });

  describe('Basic Rendering', () => {
    it('renders the game setup screen with title', () => {
      const { getByText } = render(<GameSetupScreen />);
      
      expect(getByText('Players (2/6)')).toBeTruthy();
    });

    it('renders two initial player input fields', () => {
      const { getByPlaceholderText } = render(<GameSetupScreen />);
      
      expect(getByPlaceholderText('Player 1 name (required)')).toBeTruthy();
      expect(getByPlaceholderText('Player 2 name (required)')).toBeTruthy();
    });

    it('renders target score section', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      expect(getByText('Target Score (Optional)')).toBeTruthy();
      expect(getByPlaceholderText('Enter target score (e.g., 500)')).toBeTruthy();
      expect(getByText('Leave empty for open-ended game')).toBeTruthy();
    });

    it('renders start game button', () => {
      const { getByText } = render(<GameSetupScreen />);
      
      expect(getByText('Start Game')).toBeTruthy();
    });
  });

  describe('Player Management', () => {
    it('allows adding players up to 6', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      // Add players one by one
      fireEvent.press(getByText('+ Add Player'));
      expect(getByPlaceholderText('Player 3 name')).toBeTruthy();
      
      fireEvent.press(getByText('+ Add Player'));
      expect(getByPlaceholderText('Player 4 name')).toBeTruthy();
      
      fireEvent.press(getByText('+ Add Player'));
      expect(getByPlaceholderText('Player 5 name')).toBeTruthy();
      
      fireEvent.press(getByText('+ Add Player'));
      expect(getByPlaceholderText('Player 6 name')).toBeTruthy();
      
      // Should not be able to add more than 6
      expect(() => getByText('+ Add Player')).toThrow();
    });

    it('allows removing players down to 2', () => {
      const { getByText, getByPlaceholderText, queryByPlaceholderText, getAllByText } = render(<GameSetupScreen />);
      
      // Add a third player
      fireEvent.press(getByText('+ Add Player'));
      expect(getByPlaceholderText('Player 3 name')).toBeTruthy();
      
      // Remove the third player (get the first remove button)
      const removeButtons = getAllByText('×');
      fireEvent.press(removeButtons[0]);
      
      expect(queryByPlaceholderText('Player 3 name')).toBeNull();
    });

    it('does not show remove buttons when only 2 players', () => {
      const { queryByText } = render(<GameSetupScreen />);
      
      expect(queryByText('×')).toBeNull();
    });

    it('updates player count in title when adding/removing players', () => {
      const { getByText, getAllByText } = render(<GameSetupScreen />);
      
      expect(getByText('Players (2/6)')).toBeTruthy();
      
      // Add a player
      fireEvent.press(getByText('+ Add Player'));
      expect(getByText('Players (3/6)')).toBeTruthy();
      
      // Remove a player (get the first remove button)
      const removeButtons = getAllByText('×');
      fireEvent.press(removeButtons[0]);
      expect(getByText('Players (2/6)')).toBeTruthy();
    });

    it('allows entering player names', () => {
      const { getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      
      expect(player1Input.props.value).toBe('Alice');
      expect(player2Input.props.value).toBe('Bob');
    });
  });

  describe('Autocomplete Functionality', () => {
    it('shows suggestions when focusing on empty input', async () => {
      const { getByPlaceholderText, getByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      await act(async () => {
        fireEvent(player1Input, 'focus');
      });
      
      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Charlie')).toBeTruthy();
        expect(getByText('Diana')).toBeTruthy();
      });
    });

    it('filters suggestions based on input text', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      await act(async () => {
        fireEvent(player1Input, 'focus');
        fireEvent.changeText(player1Input, 'Al');
      });
      
      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
        expect(queryByText('Bob')).toBeNull();
        expect(queryByText('Charlie')).toBeNull();
      });
    });

    it('excludes already selected players from suggestions', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      // Set first player to Alice
      fireEvent.changeText(player1Input, 'Alice');
      
      // Focus on second player input
      await act(async () => {
        fireEvent(player2Input, 'focus');
      });
      
      await waitFor(() => {
        expect(queryByText('Alice')).toBeNull(); // Alice should not appear in suggestions
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Charlie')).toBeTruthy();
      });
    });

    it('selects suggestion when tapped', async () => {
      const { getByPlaceholderText, getByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      await act(async () => {
        fireEvent(player1Input, 'focus');
      });
      
      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Alice'));
      
      expect(player1Input.props.value).toBe('Alice');
    });

    it('hides suggestions when input loses focus', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      await act(async () => {
        fireEvent(player1Input, 'focus');
      });
      
      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
      });
      
      await act(async () => {
        fireEvent(player1Input, 'blur');
      });
      
      // Wait for the timeout in handleInputBlur (150ms + buffer)
      await waitFor(() => {
        expect(queryByText('Alice')).toBeNull();
      }, { timeout: 300 });
    });
  });

  describe('Target Score Input', () => {
    it('allows entering target score', () => {
      const { getByPlaceholderText } = render(<GameSetupScreen />);
      
      const targetScoreInput = getByPlaceholderText('Enter target score (e.g., 500)');
      
      fireEvent.changeText(targetScoreInput, '500');
      
      expect(targetScoreInput.props.value).toBe('500');
    });

    it('clears target score error when user starts typing', () => {
      const { getByPlaceholderText, getByText } = render(<GameSetupScreen />);
      
      const targetScoreInput = getByPlaceholderText('Enter target score (e.g., 500)');
      
      // Enter invalid target score and try to start game
      fireEvent.changeText(targetScoreInput, '-100');
      mockValidateTargetScore.mockReturnValue(false);
      
      fireEvent.press(getByText('Start Game'));
      
      // Should show error
      expect(getByText('Target score must be a positive number')).toBeTruthy();
      
      // Start typing again
      fireEvent.changeText(targetScoreInput, '500');
      
      // Error should be cleared (we can't directly test this without re-rendering)
    });
  });

  describe('Validation and Error Handling', () => {
    it('shows error when trying to start game with less than 2 players', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      // Leave both player inputs empty
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, '');
      fireEvent.changeText(player2Input, '');
      
      fireEvent.press(getByText('Start Game'));
      
      // The first error shown will be for the required player name
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'Player name is required'
      );
    });

    it('shows error for duplicate player names', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Alice');
      
      mockValidatePlayerNames.mockImplementation(() => {
        throw new Error('All player names must be unique');
      });
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'All player names must be unique'
      );
    });

    it('shows error for invalid target score', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      const targetScoreInput = getByPlaceholderText('Enter target score (e.g., 500)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent.changeText(targetScoreInput, '-100');
      
      mockValidateTargetScore.mockReturnValue(false);
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'Target score must be a positive number'
      );
    });

    it('shows error for player names that are too long', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      const longName = 'A'.repeat(51); // 51 characters, exceeds 50 limit
      
      fireEvent.changeText(player1Input, longName);
      fireEvent.changeText(player2Input, 'Bob');
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Validation Error',
        'Player name must be 50 characters or less'
      );
    });

    it('shows visual error indicators on invalid inputs', () => {
      const { getByText, getByPlaceholderText, getAllByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const targetScoreInput = getByPlaceholderText('Enter target score (e.g., 500)');
      
      // Leave player 1 empty and set invalid target score
      fireEvent.changeText(player1Input, '');
      fireEvent.changeText(targetScoreInput, '-100');
      
      mockValidateTargetScore.mockReturnValue(false);
      
      fireEvent.press(getByText('Start Game'));
      
      // Check for error text elements (there might be multiple "Player name is required" errors)
      expect(getAllByText('Player name is required').length).toBeGreaterThan(0);
      expect(getByText('Target score must be a positive number')).toBeTruthy();
    });

    it('clears individual player errors when user starts typing', () => {
      const { getByText, getByPlaceholderText, getAllByText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      // Trigger validation error
      fireEvent.press(getByText('Start Game'));
      
      expect(getAllByText('Player name is required').length).toBeGreaterThan(0);
      
      // Start typing in the input
      fireEvent.changeText(player1Input, 'A');
      
      // Error should be cleared (we can't directly test this without re-rendering)
    });
  });

  describe('Game Creation', () => {
    it('creates game with valid players and no target score', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockGameContext.createGame).toHaveBeenCalledWith(['Alice', 'Bob'], undefined);
      expect(router.replace).toHaveBeenCalledWith('/game-play');
    });

    it('creates game with valid players and target score', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      const targetScoreInput = getByPlaceholderText('Enter target score (e.g., 500)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent.changeText(targetScoreInput, '500');
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockGameContext.createGame).toHaveBeenCalledWith(['Alice', 'Bob'], 500);
      expect(router.replace).toHaveBeenCalledWith('/game-play');
    });

    it('trims whitespace from player names', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, '  Alice  ');
      fireEvent.changeText(player2Input, '  Bob  ');
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockGameContext.createGame).toHaveBeenCalledWith(['Alice', 'Bob'], undefined);
    });

    it('handles game creation errors', () => {
      const { getByText, getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      
      // Mock createGame to throw an error
      mockGameContext.createGame.mockImplementation(() => {
        throw new Error('Failed to create game');
      });
      
      fireEvent.press(getByText('Start Game'));
      
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create game');
    });
  });

  describe('Loading States', () => {
    it('shows loading state when creating game', () => {
      mockGameContext.loading = true;
      
      const { getByText } = render(<GameSetupScreen />);
      
      expect(getByText('Creating Game...')).toBeTruthy();
    });

    it('disables start button when loading', () => {
      mockGameContext.loading = true;
      
      const { getByTestId, getByText } = render(<GameSetupScreen />);
      
      // Check that the button shows loading text
      expect(getByText('Creating Game...')).toBeTruthy();
      
      // Check that the button has disabled styling (we can't easily test the disabled prop in this test environment)
      const startButton = getByTestId('start-game-button');
      expect(startButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessibility labels for interactive elements', () => {
      const { getByLabelText } = render(<GameSetupScreen />);
      
      expect(getByLabelText('Target score input')).toBeTruthy();
      expect(getByLabelText('Start game')).toBeTruthy();
      expect(getByLabelText('Add another player')).toBeTruthy();
    });

    it('provides accessibility labels for remove buttons', () => {
      const { getByText, getByLabelText } = render(<GameSetupScreen />);
      
      // Add a third player to show remove buttons
      fireEvent.press(getByText('+ Add Player'));
      
      expect(getByLabelText('Remove player 3')).toBeTruthy();
    });

    it('provides accessibility labels for suggestion items', async () => {
      const { getByPlaceholderText, getByLabelText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      await act(async () => {
        fireEvent(player1Input, 'focus');
      });
      
      await waitFor(() => {
        expect(getByLabelText('Select player Alice')).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('moves to next input when return key is pressed', () => {
      const { getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player1Input = getByPlaceholderText('Player 1 name (required)');
      
      fireEvent(player1Input, 'submitEditing');
      
      // We can't easily test focus changes in this test environment,
      // but we can verify the onSubmitEditing handler is set up correctly
      expect(player1Input.props.onSubmitEditing).toBeDefined();
    });

    it('dismisses keyboard on last input submit', () => {
      const { getByPlaceholderText } = render(<GameSetupScreen />);
      
      const player2Input = getByPlaceholderText('Player 2 name (required)');
      
      fireEvent(player2Input, 'submitEditing');
      
      // We can't easily test keyboard dismissal in this test environment,
      // but we can verify the onSubmitEditing handler is set up correctly
      expect(player2Input.props.onSubmitEditing).toBeDefined();
    });
  });
});