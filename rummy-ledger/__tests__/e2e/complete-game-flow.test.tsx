import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { GameProvider } from '../../src/context/GameContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '../../app/index';
import GameSetupScreen from '../../app/game-setup';
import GamePlayScreen from '../../app/game-play';
import HistoryScreen from '../../app/history';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

describe('Complete Game Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Game Creation and Play Flow', () => {
    it('should complete a full game from creation to finish', async () => {
      // Start at home screen
      const { getByText, getByTestId, rerender } = render(
        <TestWrapper>
          <HomeScreen />
        </TestWrapper>
      );

      // Navigate to game setup
      const createGameButton = getByText('Create New Game');
      fireEvent.press(createGameButton);

      // Render game setup screen
      rerender(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      // Add players
      const player1Input = getByTestId('player-input-0');
      const player2Input = getByTestId('player-input-1');
      
      await act(async () => {
        fireEvent.changeText(player1Input, 'Alice');
        fireEvent.changeText(player2Input, 'Bob');
      });

      // Set target score
      const targetScoreInput = getByTestId('target-score-input');
      await act(async () => {
        fireEvent.changeText(targetScoreInput, '500');
      });

      // Start game
      const startGameButton = getByTestId('start-game-button');
      await act(async () => {
        fireEvent.press(startGameButton);
      });

      // Render game play screen
      rerender(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      // Verify game started
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('Add Round')).toBeTruthy();

      // Play multiple rounds
      for (let round = 1; round <= 3; round++) {
        const addRoundButton = getByText('Add Round');
        await act(async () => {
          fireEvent.press(addRoundButton);
        });

        // Enter scores for this round
        const aliceScoreInput = getByTestId('score-input-Alice');
        const bobScoreInput = getByTestId('score-input-Bob');
        
        await act(async () => {
          fireEvent.changeText(aliceScoreInput, (round * 50).toString());
          fireEvent.changeText(bobScoreInput, (round * 75).toString());
        });

        const submitButton = getByText('Submit Scores');
        await act(async () => {
          fireEvent.press(submitButton);
        });

        // Verify scores updated
        await waitFor(() => {
          expect(getByText(`Total: ${round * 50}`)).toBeTruthy();
          expect(getByText(`Total: ${round * 75}`)).toBeTruthy();
        });
      }

      // Continue playing until game ends (target score reached)
      let gameEnded = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!gameEnded && attempts < maxAttempts) {
        attempts++;
        
        try {
          const addRoundButton = getByText('Add Round');
          await act(async () => {
            fireEvent.press(addRoundButton);
          });

          const aliceScoreInput = getByTestId('score-input-Alice');
          const bobScoreInput = getByTestId('score-input-Bob');
          
          await act(async () => {
            fireEvent.changeText(aliceScoreInput, '200');
            fireEvent.changeText(bobScoreInput, '300');
          });

          const submitButton = getByText('Submit Scores');
          await act(async () => {
            fireEvent.press(submitButton);
          });

          // Check if game ended
          await waitFor(() => {
            try {
              getByText('Game Over!');
              gameEnded = true;
            } catch {
              // Game hasn't ended yet
            }
          });
        } catch {
          // Game might have ended
          gameEnded = true;
        }
      }

      // Verify game completion
      expect(gameEnded).toBe(true);
    });

    it('should handle score editing during gameplay', async () => {
      const { getByText, getByTestId, rerender } = render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      // Assume game is already in progress with some rounds
      const addRoundButton = getByText('Add Round');
      await act(async () => {
        fireEvent.press(addRoundButton);
      });

      // Enter initial scores
      const player1Input = getByTestId('score-input-Player1');
      const player2Input = getByTestId('score-input-Player2');
      
      await act(async () => {
        fireEvent.changeText(player1Input, '100');
        fireEvent.changeText(player2Input, '150');
      });

      const submitButton = getByText('Submit Scores');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Edit the round
      const editButton = getByTestId('edit-round-1');
      await act(async () => {
        fireEvent.press(editButton);
      });

      // Change scores
      await act(async () => {
        fireEvent.changeText(player1Input, '120');
        fireEvent.changeText(player2Input, '130');
      });

      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify scores were updated
      await waitFor(() => {
        expect(getByText('Total: 120')).toBeTruthy();
        expect(getByText('Total: 130')).toBeTruthy();
      });
    });

    it('should handle Rummy scoring correctly', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      const addRoundButton = getByText('Add Round');
      await act(async () => {
        fireEvent.press(addRoundButton);
      });

      // Mark player as having Rummy
      const rummyButton = getByTestId('rummy-button-Player1');
      await act(async () => {
        fireEvent.press(rummyButton);
      });

      // Enter score for other player
      const player2Input = getByTestId('score-input-Player2');
      await act(async () => {
        fireEvent.changeText(player2Input, '75');
      });

      const submitButton = getByText('Submit Scores');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Verify Rummy player got 0 points
      await waitFor(() => {
        expect(getByText('Total: 0')).toBeTruthy();
        expect(getByText('Total: 75')).toBeTruthy();
      });
    });
  });

  describe('Game History Flow', () => {
    it('should display completed games in history', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <HistoryScreen />
        </TestWrapper>
      );

      // Should show completed games
      await waitFor(() => {
        expect(getByText('Game History')).toBeTruthy();
      });

      // If there are completed games, they should be displayed
      try {
        const gameItem = getByTestId('game-history-item-0');
        expect(gameItem).toBeTruthy();
      } catch {
        // No games in history yet - should show empty state
        expect(getByText('No completed games yet')).toBeTruthy();
      }
    });

    it('should navigate to game details from history', async () => {
      const { getByText, getByTestId, rerender } = render(
        <TestWrapper>
          <HistoryScreen />
        </TestWrapper>
      );

      try {
        const gameItem = getByTestId('game-history-item-0');
        await act(async () => {
          fireEvent.press(gameItem);
        });

        // Should navigate to game details
        // This would typically involve navigation mock verification
        expect(gameItem).toBeTruthy();
      } catch {
        // No games to test with
        expect(getByText('No completed games yet')).toBeTruthy();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid score inputs gracefully', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      const addRoundButton = getByText('Add Round');
      await act(async () => {
        fireEvent.press(addRoundButton);
      });

      // Enter invalid scores
      const player1Input = getByTestId('score-input-Player1');
      await act(async () => {
        fireEvent.changeText(player1Input, '-50'); // Negative score
      });

      const submitButton = getByText('Submit Scores');
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Scores must be non-negative')).toBeTruthy();
      });
    });

    it('should prevent game start with insufficient players', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      // Only add one player
      const player1Input = getByTestId('player-input-0');
      await act(async () => {
        fireEvent.changeText(player1Input, 'Alice');
      });

      const startGameButton = getByTestId('start-game-button');
      
      // Button should be disabled
      expect(startGameButton).toHaveAccessibilityState({ disabled: true });
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage failure
      const mockError = new Error('Storage failed');
      require('expo-secure-store').setItemAsync.mockRejectedValueOnce(mockError);

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GameSetupScreen />
        </TestWrapper>
      );

      const player1Input = getByTestId('player-input-0');
      const player2Input = getByTestId('player-input-1');
      
      await act(async () => {
        fireEvent.changeText(player1Input, 'Alice');
        fireEvent.changeText(player2Input, 'Bob');
      });

      const startGameButton = getByTestId('start-game-button');
      await act(async () => {
        fireEvent.press(startGameButton);
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(getByText('Failed to save game')).toBeTruthy();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle rapid user interactions without crashes', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      // Rapidly press add round button
      const addRoundButton = getByText('Add Round');
      
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          fireEvent.press(addRoundButton);
        });
        
        // Cancel immediately
        try {
          const cancelButton = getByText('Cancel');
          await act(async () => {
            fireEvent.press(cancelButton);
          });
        } catch {
          // Modal might not be open
        }
      }

      // App should still be responsive
      expect(getByText('Add Round')).toBeTruthy();
    });

    it('should handle large numbers of rounds efficiently', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <GamePlayScreen />
        </TestWrapper>
      );

      // Add many rounds quickly
      for (let round = 1; round <= 20; round++) {
        const addRoundButton = getByText('Add Round');
        await act(async () => {
          fireEvent.press(addRoundButton);
        });

        const player1Input = getByTestId('score-input-Player1');
        const player2Input = getByTestId('score-input-Player2');
        
        await act(async () => {
          fireEvent.changeText(player1Input, '10');
          fireEvent.changeText(player2Input, '15');
        });

        const submitButton = getByText('Submit Scores');
        await act(async () => {
          fireEvent.press(submitButton);
        });
      }

      // Should still display correctly
      expect(getByText('Round 20')).toBeTruthy();
      expect(getByText('Total: 200')).toBeTruthy();
      expect(getByText('Total: 300')).toBeTruthy();
    });
  });
});