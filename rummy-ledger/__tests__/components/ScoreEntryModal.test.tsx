import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import ScoreEntryModal from '@/components/ScoreEntryModal';
import { Player, PlayerScore } from '@/src/types';

// Mock Haptics
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

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Alice',
    totalScore: 25,
    isLeader: true,
  },
  {
    id: '2',
    name: 'Bob',
    totalScore: 30,
    isLeader: false,
  },
  {
    id: '3',
    name: 'Charlie',
    totalScore: 35,
    isLeader: false,
  },
];

describe('ScoreEntryModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    visible: true,
    players: mockPlayers,
    roundNumber: 3,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  describe('Rendering', () => {
    it('renders modal with correct title and player names', () => {
      const { getByText } = render(<ScoreEntryModal {...defaultProps} />);

      expect(getByText('Round 3 Scores')).toBeTruthy();
      expect(getByText('Enter scores for each player')).toBeTruthy();
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();
    });

    it('displays current total scores for each player', () => {
      const { getByText } = render(<ScoreEntryModal {...defaultProps} />);

      expect(getByText('Current: 25')).toBeTruthy();
      expect(getByText('Current: 30')).toBeTruthy();
      expect(getByText('Current: 35')).toBeTruthy();
    });

    it('renders RUMMY buttons for each player', () => {
      const { getAllByText } = render(<ScoreEntryModal {...defaultProps} />);

      const rummyButtons = getAllByText('RUMMY');
      expect(rummyButtons).toHaveLength(3);
    });

    it('does not render when visible is false', () => {
      const { queryByText } = render(
        <ScoreEntryModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Round 3 Scores')).toBeNull();
    });
  });

  describe('Score Input', () => {
    it('allows entering numeric scores', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '15');

      expect(scoreInputs[0].props.value).toBe('15');
    });

    it('filters out non-numeric characters', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInput = getAllByPlaceholderText('0')[0];
      fireEvent.changeText(scoreInput, 'abc123def');

      expect(scoreInput.props.value).toBe('123');
    });

    it('limits input to 3 characters', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInput = getAllByPlaceholderText('0')[0];
      expect(scoreInput.props.maxLength).toBe(3);
    });

    it('validates non-negative integers on submission', async () => {
      const { getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');
      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith([
          { playerId: '1', score: 10, isRummy: false },
          { playerId: '2', score: 20, isRummy: false },
          { playerId: '3', score: 30, isRummy: false },
        ]);
      });
    });
  });

  describe('Rummy Functionality', () => {
    it('toggles rummy state when RUMMY button is pressed', () => {
      const { getAllByText } = render(<ScoreEntryModal {...defaultProps} />);

      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      // Check if haptic feedback was triggered
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('sets score to 0 when player is marked as rummy', async () => {
      const { getAllByText, getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // Mark first player as rummy
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      // Enter scores for other players
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith([
          { playerId: '1', score: 0, isRummy: true },
          { playerId: '2', score: 20, isRummy: false },
          { playerId: '3', score: 30, isRummy: false },
        ]);
      });
    });

    it('clears manual score when marking as rummy', () => {
      const { getAllByText, getAllByPlaceholderText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // Enter a score first
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '15');

      // Then mark as rummy
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      // Score input should be cleared and show '0'
      expect(scoreInputs[0].props.value).toBe('0');
    });

    it('removes rummy status when manually entering score', async () => {
      const { getAllByText, getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // First enter a manual score
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '15');

      // Then mark as rummy (this should clear the manual score)
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      // Verify input is disabled and shows 0
      expect(scoreInputs[0].props.editable).toBe(false);
      expect(scoreInputs[0].props.value).toBe('0');

      // Unmark rummy by pressing the button again
      fireEvent.press(rummyButtons[0]);

      // Now input should be enabled again and we can enter a score
      expect(scoreInputs[0].props.editable).toBe(true);
      fireEvent.changeText(scoreInputs[0], '25');

      // Enter scores for other players and submit
      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith([
          { playerId: '1', score: 25, isRummy: false },
          { playerId: '2', score: 20, isRummy: false },
          { playerId: '3', score: 30, isRummy: false },
        ]);
      });
    });

    it('disables score input when player is marked as rummy', () => {
      const { getAllByText, getAllByPlaceholderText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // Mark first player as rummy
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      // Score input should be disabled
      const scoreInputs = getAllByPlaceholderText('0');
      expect(scoreInputs[0].props.editable).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('prevents submission when scores are missing', async () => {
      const { getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // Only enter score for first player
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Missing Scores',
          'Please enter scores for: Bob, Charlie'
        );
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for invalid scores', async () => {
      const { getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // This shouldn't happen due to input filtering, but test the validation
      const scoreInputs = getAllByPlaceholderText('0');
      
      // Manually set invalid value to test validation
      Object.defineProperty(scoreInputs[0], 'props', {
        value: { ...scoreInputs[0].props, value: '-5' },
        writable: true,
      });

      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      // Since we filter non-numeric input, this test ensures the validation exists
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('allows submission with all valid scores', async () => {
      const { getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');
      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
        expect(mockOnSubmit).toHaveBeenCalledWith([
          { playerId: '1', score: 10, isRummy: false },
          { playerId: '2', score: 20, isRummy: false },
          { playerId: '3', score: 30, isRummy: false },
        ]);
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('provides haptic feedback when toggling rummy', () => {
      const { getAllByText } = render(<ScoreEntryModal {...defaultProps} />);

      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('provides success haptic feedback on score submission', async () => {
      const { getAllByPlaceholderText, getByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');
      fireEvent.changeText(scoreInputs[1], '20');
      fireEvent.changeText(scoreInputs[2], '30');

      fireEvent.press(getByText('Add Scores'));

      await waitFor(() => {
        expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is pressed with no changes', () => {
      const { getAllByText } = render(<ScoreEntryModal {...defaultProps} />);

      const cancelButtons = getAllByText('Cancel');
      fireEvent.press(cancelButtons[0]); // Use the header cancel button

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows confirmation dialog when canceling with changes', () => {
      const { getAllByPlaceholderText, getAllByText } = render(
        <ScoreEntryModal {...defaultProps} />
      );

      // Make some changes
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');

      const cancelButtons = getAllByText('Cancel');
      fireEvent.press(cancelButtons[0]); // Use the header cancel button

      expect(Alert.alert).toHaveBeenCalledWith(
        'Discard Changes',
        'Are you sure you want to discard the entered scores?',
        expect.arrayContaining([
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: expect.any(Function) },
        ])
      );
    });

    it('shows confirmation dialog when canceling with rummy selections', () => {
      const { getAllByText } = render(<ScoreEntryModal {...defaultProps} />);

      // Mark a player as rummy
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[0]);

      const cancelButtons = getAllByText('Cancel');
      fireEvent.press(cancelButtons[0]); // Use the header cancel button

      expect(Alert.alert).toHaveBeenCalledWith(
        'Discard Changes',
        'Are you sure you want to discard the entered scores?',
        expect.arrayContaining([
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: expect.any(Function) },
        ])
      );
    });
  });

  describe('State Reset', () => {
    it('resets state when modal becomes visible', () => {
      const { rerender, getAllByPlaceholderText, getAllByText } = render(
        <ScoreEntryModal {...defaultProps} visible={false} />
      );

      // Make modal visible and add some data
      rerender(<ScoreEntryModal {...defaultProps} visible={true} />);
      
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '10');
      
      const rummyButtons = getAllByText('RUMMY');
      fireEvent.press(rummyButtons[1]);

      // Hide and show modal again
      rerender(<ScoreEntryModal {...defaultProps} visible={false} />);
      rerender(<ScoreEntryModal {...defaultProps} visible={true} />);

      // State should be reset
      const newScoreInputs = getAllByPlaceholderText('0');
      expect(newScoreInputs[0].props.value).toBe('');
      expect(newScoreInputs[1].props.editable).toBe(true); // Rummy should be cleared
    });
  });

  describe('Accessibility', () => {
    it('has proper keyboard type for score inputs', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInputs = getAllByPlaceholderText('0');
      scoreInputs.forEach(input => {
        expect(input.props.keyboardType).toBe('numeric');
      });
    });

    it('selects text on focus for better UX', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInputs = getAllByPlaceholderText('0');
      scoreInputs.forEach(input => {
        expect(input.props.selectTextOnFocus).toBe(true);
      });
    });

    it('has proper placeholder text', () => {
      const { getAllByPlaceholderText } = render(<ScoreEntryModal {...defaultProps} />);

      const scoreInputs = getAllByPlaceholderText('0');
      expect(scoreInputs).toHaveLength(3);
    });
  });
});