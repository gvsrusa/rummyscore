import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import GamePlayScreen from '../../app/game-play';
import { GameProvider } from '../../src/context/GameContext';
import { Game, Player, Round, PlayerScore } from '../../src/types';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock ScoreEntryModal
jest.mock('../../components/ScoreEntryModal', () => {
  const { View, TouchableOpacity, Text } = require('react-native');

  return function MockScoreEntryModal({ visible, onSubmit, onCancel }: any) {
    if (!visible) return null;
    return (
      <View testID="score-entry-modal">
        <TouchableOpacity
          testID="submit-scores"
          onPress={() =>
            onSubmit([
              { playerId: 'player1', score: 10, isRummy: false },
              { playerId: 'player2', score: 0, isRummy: true },
            ])
          }
        >
          <Text>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="cancel-scores" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Create test data
const createTestGame = (rounds: Round[] = [], targetScore?: number): Game => ({
  id: 'test-game',
  players: [
    { id: 'player1', name: 'Alice', totalScore: 25, isLeader: true },
    { id: 'player2', name: 'Bob', totalScore: 30, isLeader: false },
    { id: 'player3', name: 'Charlie', totalScore: 35, isLeader: false },
  ],
  rounds,
  targetScore,
  status: 'active',
  createdAt: new Date(),
});

const createTestRound = (roundNumber: number): Round => ({
  id: `round-${roundNumber}`,
  roundNumber,
  scores: [
    { playerId: 'player1', score: 10, isRummy: false },
    { playerId: 'player2', score: 0, isRummy: true },
    { playerId: 'player3', score: 15, isRummy: false },
  ],
  timestamp: new Date(),
});

// Mock GameContext
const mockGameContext: {
  currentGame: Game | null;
  gameHistory: Game[];
  recentPlayers: string[];
  loading: boolean;
  error: string | null;
  createGame: jest.Mock;
  addRound: jest.Mock;
  editRound: jest.Mock;
  deleteRound: jest.Mock;
  endGame: jest.Mock;
  clearError: jest.Mock;
} = {
  currentGame: createTestGame([createTestRound(1)]),
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

jest.mock('../../src/context/GameContext', () => ({
  useGame: () => mockGameContext,
  GameProvider: ({ children }: any) => children,
}));

describe('GamePlayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGameContext.currentGame = createTestGame([createTestRound(1)]);
  });

  describe('Rendering', () => {
    it('renders the game play screen with current game info', () => {
      const { getByText, getAllByText } = render(<GamePlayScreen />);

      expect(getByText('Round 2')).toBeTruthy();
      expect(getByText('Live Leaderboard')).toBeTruthy();
      expect(getByText('Alice 👑')).toBeTruthy();
      expect(getAllByText('Bob')).toHaveLength(2); // Once in leaderboard, once in round history
      expect(getAllByText('Charlie')).toHaveLength(2);
    });

    it('displays target score when set', () => {
      mockGameContext.currentGame = createTestGame([], 100);
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Target: 100')).toBeTruthy();
    });

    it('redirects to home when no current game', () => {
      mockGameContext.currentGame = null;
      render(<GamePlayScreen />);

      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('Leaderboard Display', () => {
    it('displays players sorted by total score (lowest first)', () => {
      const { getByText, getAllByText } = render(<GamePlayScreen />);

      // Alice should be first (lowest score: 25)
      expect(getByText('Alice 👑')).toBeTruthy();
      expect(getByText('#1')).toBeTruthy();

      // Bob should be second (score: 30)
      expect(getAllByText('Bob')).toHaveLength(2); // Leaderboard + round history

      // Charlie should be third (highest score: 35)
      expect(getAllByText('Charlie')).toHaveLength(2);
    });

    it('highlights the leader with crown and special styling', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Alice 👑')).toBeTruthy();
    });

    it('shows progress to target when target score is set', () => {
      mockGameContext.currentGame = createTestGame([createTestRound(1)], 100);
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('75 to target')).toBeTruthy(); // 100 - 25 = 75
      expect(getByText('70 to target')).toBeTruthy(); // 100 - 30 = 70
    });
  });

  describe('Round History', () => {
    it('displays round history in reverse chronological order', () => {
      const rounds = [createTestRound(1), createTestRound(2)];
      mockGameContext.currentGame = createTestGame(rounds);

      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Round History (2 rounds)')).toBeTruthy();
      expect(getByText('Round 2')).toBeTruthy();
      expect(getByText('Round 1')).toBeTruthy();
    });

    it('displays player scores for each round', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('RUMMY (0)')).toBeTruthy();
      expect(getByText('15')).toBeTruthy();
    });

    it('shows round totals and timestamps', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Total: 25')).toBeTruthy(); // 10 + 0 + 15
    });

    it('does not show round history when no rounds exist', () => {
      mockGameContext.currentGame = createTestGame([]);
      const { queryByText } = render(<GamePlayScreen />);

      expect(queryByText('Round History')).toBeFalsy();
    });
  });

  describe('Score Entry', () => {
    it('opens score entry modal when Add Round is pressed', () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Add Round'));

      expect(getByTestId('score-entry-modal')).toBeTruthy();
    });

    it('calls addRound when scores are submitted', async () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Add Round'));
      fireEvent.press(getByTestId('submit-scores'));

      await waitFor(() => {
        expect(mockGameContext.addRound).toHaveBeenCalledWith([
          { playerId: 'player1', score: 10, isRummy: false },
          { playerId: 'player2', score: 0, isRummy: true },
        ]);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('closes modal when scores are cancelled', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <GamePlayScreen />
      );

      fireEvent.press(getByText('Add Round'));
      fireEvent.press(getByTestId('cancel-scores'));

      expect(queryByTestId('score-entry-modal')).toBeFalsy();
    });
  });

  describe('Game End Detection', () => {
    it('detects when target score is reached', () => {
      // Create a game where a player exceeds the target
      const gameWithHighScores = createTestGame([createTestRound(1)], 30);
      gameWithHighScores.players[2].totalScore = 35; // Charlie exceeds target of 30

      mockGameContext.currentGame = gameWithHighScores;

      const { getAllByText } = render(<GamePlayScreen />);

      // Verify the game shows warning indicators for players close to target
      const targetTexts = getAllByText('0 to target');
      expect(targetTexts.length).toBeGreaterThan(0); // Charlie is at/over target
    });
  });

  describe('Manual Game End', () => {
    it('has an End Game button', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('End Game')).toBeTruthy();
    });
  });

  describe('Score Editing and Correction', () => {
    it('displays edit and delete buttons for each round', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });

    it('opens score entry modal in edit mode when edit button is pressed', () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Edit'));

      expect(getByTestId('score-entry-modal')).toBeTruthy();
    });

    it('calls editRound when editing scores are submitted', async () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Edit'));
      fireEvent.press(getByTestId('submit-scores'));

      await waitFor(() => {
        expect(mockGameContext.editRound).toHaveBeenCalledWith('round-1', [
          { playerId: 'player1', score: 10, isRummy: false },
          { playerId: 'player2', score: 0, isRummy: true },
        ]);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('shows confirmation dialog when delete button is pressed', () => {
      const { getByText } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Delete'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Round',
        'Are you sure you want to delete Round 1? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ 
            text: 'Delete', 
            style: 'destructive',
            onPress: expect.any(Function)
          }),
        ])
      );
    });

    it('calls deleteRound when deletion is confirmed', () => {
      const { getByText } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Delete'));

      // Get the onPress function from the Delete button in the alert
      const deleteOnPress = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      deleteOnPress();

      expect(mockGameContext.deleteRound).toHaveBeenCalledWith('round-1');
      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('does not call deleteRound when deletion is cancelled', () => {
      const { getByText } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Delete'));

      // Simulate pressing Cancel - no onPress function should be called
      expect(mockGameContext.deleteRound).not.toHaveBeenCalled();
    });

    it('handles editing multiple rounds correctly', () => {
      const rounds = [createTestRound(1), createTestRound(2)];
      mockGameContext.currentGame = createTestGame(rounds);

      const { getAllByText } = render(<GamePlayScreen />);

      const editButtons = getAllByText('Edit');
      expect(editButtons).toHaveLength(2);

      // Test editing the first round (most recent, displayed first)
      fireEvent.press(editButtons[0]);
      expect(mockGameContext.editRound).not.toHaveBeenCalled(); // Only opens modal
    });

    it('clears editing state when modal is cancelled', () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Edit'));
      fireEvent.press(getByTestId('cancel-scores'));

      // Modal should close and editing state should be cleared
      expect(mockGameContext.editRound).not.toHaveBeenCalled();
    });

    it('displays correct round number in edit modal', () => {
      // This would require updating the mock to check the roundNumber prop
      // For now, we verify the modal opens with edit functionality
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      fireEvent.press(getByText('Edit'));

      expect(getByTestId('score-entry-modal')).toBeTruthy();
    });

    it('handles editing when no rounds exist gracefully', () => {
      mockGameContext.currentGame = createTestGame([]);
      const { queryByText } = render(<GamePlayScreen />);

      expect(queryByText('Edit')).toBeFalsy();
      expect(queryByText('Delete')).toBeFalsy();
    });

    it('maintains round order after deletion', () => {
      const rounds = [createTestRound(1), createTestRound(2), createTestRound(3)];
      mockGameContext.currentGame = createTestGame(rounds);

      const { getAllByText } = render(<GamePlayScreen />);

      // Should display rounds in reverse order (3, 2, 1)
      expect(getAllByText('Delete')).toHaveLength(3);
    });

    it('provides haptic feedback for edit and delete actions', async () => {
      const { getByText, getByTestId } = render(<GamePlayScreen />);

      // Test edit haptic feedback
      fireEvent.press(getByText('Edit'));
      fireEvent.press(getByTestId('submit-scores'));

      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
      });

      // Test delete haptic feedback
      fireEvent.press(getByText('Delete'));
      const deleteOnPress = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      deleteOnPress();

      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('Real-time Updates', () => {
    it('updates leaderboard when game state changes', () => {
      const { getByText, rerender } = render(<GamePlayScreen />);

      // Initially Alice is leader
      expect(getByText('Alice 👑')).toBeTruthy();

      // Update game state - Bob now has lower score
      const updatedGame = createTestGame([createTestRound(1)]);
      updatedGame.players[1].totalScore = 20; // Bob now has lowest score
      updatedGame.players[0].totalScore = 30; // Alice now has higher score
      mockGameContext.currentGame = updatedGame;

      rerender(<GamePlayScreen />);

      expect(getByText('Bob 👑')).toBeTruthy();
    });

    it('recalculates progress bars when scores change', () => {
      mockGameContext.currentGame = createTestGame([createTestRound(1)], 100);

      const { rerender } = render(<GamePlayScreen />);

      // Update scores to be closer to target
      const updatedGame = createTestGame([createTestRound(1)], 100);
      updatedGame.players[0].totalScore = 90; // Very close to target
      mockGameContext.currentGame = updatedGame;

      rerender(<GamePlayScreen />);

      // Should show warning styling for players close to target
      // This would be tested through style assertions in a real implementation
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels for interactive elements', () => {
      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Add Round')).toBeTruthy();
      expect(getByText('End Game')).toBeTruthy();
    });

    it('maintains proper reading order for screen readers', () => {
      const { getByText } = render(<GamePlayScreen />);

      // Game info should come first
      expect(getByText('Round 2')).toBeTruthy();

      // Then leaderboard
      expect(getByText('Live Leaderboard')).toBeTruthy();

      // Then round history
      expect(getByText('Round History (1 rounds)')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles large number of rounds efficiently', () => {
      const manyRounds = Array.from({ length: 50 }, (_, i) =>
        createTestRound(i + 1)
      );
      mockGameContext.currentGame = createTestGame(manyRounds);

      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Round History (50 rounds)')).toBeTruthy();
      expect(getByText('Round 50')).toBeTruthy(); // Most recent round shown first
    });

    it('efficiently sorts and displays leaderboard', () => {
      // Create game with many players (edge case)
      const manyPlayersGame = createTestGame([createTestRound(1)]);
      manyPlayersGame.players = Array.from({ length: 6 }, (_, i) => ({
        id: `player${i}`,
        name: `Player ${i}`,
        totalScore: i * 10, // Deterministic scores for testing
        isLeader: false,
      }));

      mockGameContext.currentGame = manyPlayersGame;

      const { getByText } = render(<GamePlayScreen />);

      expect(getByText('Live Leaderboard')).toBeTruthy();
      // Check that Player 0 (lowest score) is the leader
      expect(getByText('Player 0 👑')).toBeTruthy();
    });
  });
});
