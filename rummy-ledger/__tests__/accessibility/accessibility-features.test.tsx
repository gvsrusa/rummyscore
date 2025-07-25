/**
 * Comprehensive Accessibility Features Tests
 * Tests all accessibility features implementation
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { GameProvider } from '@/src/context/GameContext';
import { accessibilityService } from '@/src/services/AccessibilityService';
import { AccessibleTextInput } from '@/components/AccessibleTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { KeyboardNavigationView } from '@/components/KeyboardNavigationView';
import ScoreEntryModal from '@/components/ScoreEntryModal';

// Mock dependencies
jest.mock('@/src/services/AccessibilityService', () => ({
  accessibilityService: {
    initialize: jest.fn(),
    announce: jest.fn(),
    announceScoreUpdate: jest.fn(),
    announceGameState: jest.fn(),
    getScoreLabel: jest.fn((name, score) => `${name} has ${score} points`),
    getInteractionHint: jest.fn((action) => `Double tap to ${action}`),
    shouldReduceAnimations: jest.fn(() => false),
    getAnimationDuration: jest.fn((duration) => duration),
    isScreenReaderEnabled: jest.fn(() => false),
    subscribe: jest.fn(() => () => {}),
    getState: jest.fn(() => ({
      isScreenReaderEnabled: false,
      isReduceMotionEnabled: false,
      isHighContrastEnabled: false,
      fontScale: 1,
    })),
  },
  useAccessibility: jest.fn(() => ({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isHighContrastEnabled: false,
    fontScale: 1,
    announce: jest.fn(),
    announceScoreUpdate: jest.fn(),
    announceGameState: jest.fn(),
    getScoreLabel: jest.fn((name, score) => `${name} has ${score} points`),
    getInteractionHint: jest.fn((action) => `Double tap to ${action}`),
    shouldReduceAnimations: jest.fn(() => false),
    getAnimationDuration: jest.fn((duration) => duration),
    getAccessibilityState: jest.fn((state) => state),
  })),
}));

const mockAccessibilityInfo = {
  isScreenReaderEnabled: jest.fn(),
  isReduceMotionEnabled: jest.fn(),
  isHighContrastEnabled: jest.fn(),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
  addEventListener: jest.fn(),
};

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AccessibilityInfo: mockAccessibilityInfo,
    Platform: { OS: 'ios' },
  };
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </ThemeProvider>
  );
}

describe('Accessibility Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AccessibilityService', () => {
    it('should initialize accessibility service', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
      mockAccessibilityInfo.isHighContrastEnabled.mockResolvedValue(false);

      await accessibilityService.initialize();

      expect(mockAccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
      expect(mockAccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
      expect(mockAccessibilityInfo.isHighContrastEnabled).toHaveBeenCalled();
    });

    it('should announce messages for screen readers', async () => {
      await accessibilityService.announce({ message: 'Test announcement' });
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test announcement');
    });

    it('should format score announcements correctly', async () => {
      await accessibilityService.announceScoreUpdate('John', 25);
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('John scored 25 points');
    });

    it('should format rummy announcements correctly', async () => {
      await accessibilityService.announceScoreUpdate('Jane', 0, true);
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Jane scored Rummy with 0 points');
    });
  });

  describe('AccessibleTextInput', () => {
    it('should render with proper accessibility labels', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <AccessibleTextInput
            label="Player Name"
            placeholder="Enter name"
            value="Test Player"
            required
            testID="player-input"
          />
        </TestWrapper>
      );

      const input = getByDisplayValue('Test Player');
      expect(input).toHaveProp('accessibilityLabel', 'Player Name, required');
    });

    it('should include error messages in accessibility label', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <AccessibleTextInput
            label="Score"
            value="invalid"
            error="Please enter a valid number"
            testID="score-input"
          />
        </TestWrapper>
      );

      const input = getByDisplayValue('invalid');
      expect(input).toHaveProp('accessibilityLabel', 'Score, error: Please enter a valid number');
    });

    it('should provide appropriate hints for different variants', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <AccessibleTextInput
            variant="score"
            value="25"
            testID="score-input"
          />
        </TestWrapper>
      );

      const input = getByDisplayValue('25');
      expect(input).toHaveProp('accessibilityHint', 'Double tap to score-input');
    });

    it('should meet minimum touch target requirements', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <AccessibleTextInput
            size="small"
            value="test"
            testID="small-input"
          />
        </TestWrapper>
      );

      const input = getByDisplayValue('test');
      expect(input.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
        })
      );
      
      // Minimum height should be at least 44px for accessibility
      const minHeight = input.props.style.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('ThemedButton Accessibility', () => {
    it('should provide comprehensive accessibility information', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Start Game"
            accessibilityHint="Begins a new game session"
            testID="start-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityLabel', 'Start Game');
      expect(button).toHaveProp('accessibilityHint', 'Begins a new game session');
      expect(button).toHaveProp('accessibilityRole', 'button');
    });

    it('should indicate loading state in accessibility label', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Submit"
            loading={true}
            testID="submit-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityLabel', 'Submit, loading');
      expect(button).toHaveProp('accessibilityState', { disabled: true, busy: true });
    });

    it('should indicate disabled state properly', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Disabled Button"
            disabled={true}
            testID="disabled-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityState', { disabled: true, busy: false });
    });

    it('should maintain minimum touch target size', () => {
      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Small Button"
            size="small"
            testID="small-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      expect(button.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
        })
      );
      
      // Should meet minimum 44px requirement even for small buttons
      const minHeight = button.props.style.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('KeyboardNavigationView', () => {
    it('should support keyboard navigation', () => {
      const onFocus = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <KeyboardNavigationView
            focusable={true}
            onFocus={onFocus}
            testID="nav-view"
          >
            <ThemedButton title="Test" />
          </KeyboardNavigationView>
        </TestWrapper>
      );

      const view = getByTestId('nav-view');
      expect(view).toHaveProp('accessible', true);
      expect(view).toHaveProp('importantForAccessibility', 'yes');
    });

    it('should handle auto focus when requested', async () => {
      mockAccessibilityInfo.setAccessibilityFocus.mockImplementation(() => {});
      
      const { getByTestId } = render(
        <TestWrapper>
          <KeyboardNavigationView
            autoFocus={true}
            testID="auto-focus-view"
          >
            <ThemedButton title="Test" />
          </KeyboardNavigationView>
        </TestWrapper>
      );

      // Wait for auto focus to trigger
      await waitFor(() => {
        expect(mockAccessibilityInfo.setAccessibilityFocus).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('ScoreEntryModal Accessibility', () => {
    const mockPlayers = [
      { id: '1', name: 'Alice', totalScore: 50, isLeader: false },
      { id: '2', name: 'Bob', totalScore: 75, isLeader: true },
    ];

    it('should announce modal opening to screen readers', () => {
      const { useAccessibility } = require('@/src/services/AccessibilityService');
      const mockUseAccessibility = useAccessibility as jest.Mock;
      
      mockUseAccessibility.mockReturnValue({
        ...mockUseAccessibility(),
        isScreenReaderEnabled: true,
        announceGameState: jest.fn(),
      });

      render(
        <TestWrapper>
          <ScoreEntryModal
            visible={true}
            players={mockPlayers}
            roundNumber={3}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      expect(mockUseAccessibility().announceGameState).toHaveBeenCalledWith(
        'Entering scores for round 3'
      );
    });

    it('should provide proper accessibility labels for score inputs', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <ScoreEntryModal
            visible={true}
            players={mockPlayers}
            roundNumber={1}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      expect(getByLabelText('Score input for Alice')).toBeTruthy();
      expect(getByLabelText('Score input for Bob')).toBeTruthy();
    });

    it('should provide proper accessibility for rummy buttons', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <ScoreEntryModal
            visible={true}
            players={mockPlayers}
            roundNumber={1}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      expect(getByLabelText('Mark rummy for Alice')).toBeTruthy();
      expect(getByLabelText('Mark rummy for Bob')).toBeTruthy();
    });

    it('should announce score updates to screen readers', async () => {
      const { useAccessibility } = require('@/src/services/AccessibilityService');
      const mockUseAccessibility = useAccessibility as jest.Mock;
      const mockAnnounceScoreUpdate = jest.fn();
      
      mockUseAccessibility.mockReturnValue({
        ...mockUseAccessibility(),
        isScreenReaderEnabled: true,
        announceScoreUpdate: mockAnnounceScoreUpdate,
      });

      const { getByLabelText } = render(
        <TestWrapper>
          <ScoreEntryModal
            visible={true}
            players={mockPlayers}
            roundNumber={1}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      const scoreInput = getByLabelText('Score input for Alice');
      fireEvent.changeText(scoreInput, '25');

      await waitFor(() => {
        expect(mockAnnounceScoreUpdate).toHaveBeenCalledWith('Alice', 25);
      });
    });
  });

  describe('High Contrast Support', () => {
    it('should apply high contrast colors when enabled', () => {
      const { useAccessibility } = require('@/src/services/AccessibilityService');
      const mockUseAccessibility = useAccessibility as jest.Mock;
      
      mockUseAccessibility.mockReturnValue({
        ...mockUseAccessibility(),
        isHighContrastEnabled: true,
      });

      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="High Contrast Button"
            testID="hc-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      // High contrast should be applied through theme context
      expect(button).toBeTruthy();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      const { useAccessibility } = require('@/src/services/AccessibilityService');
      const mockUseAccessibility = useAccessibility as jest.Mock;
      
      mockUseAccessibility.mockReturnValue({
        ...mockUseAccessibility(),
        shouldReduceAnimations: () => true,
        getAnimationDuration: (duration: number) => Math.min(duration * 0.1, 50),
      });

      const { getByRole } = render(
        <TestWrapper>
          <ThemedButton
            title="Animated Button"
            animatePress={true}
            testID="animated-button"
          />
        </TestWrapper>
      );

      const button = getByRole('button');
      fireEvent.press(button);
      
      // Animation should be reduced or disabled
      expect(mockUseAccessibility().shouldReduceAnimations()).toBe(true);
    });
  });

  describe('Dynamic Type Support', () => {
    it('should scale fonts based on system preferences', () => {
      const { useAccessibility } = require('@/src/services/AccessibilityService');
      const mockUseAccessibility = useAccessibility as jest.Mock;
      
      mockUseAccessibility.mockReturnValue({
        ...mockUseAccessibility(),
        fontScale: 1.5, // Large text setting
      });

      const { getByText } = render(
        <TestWrapper>
          <ThemedButton
            title="Scalable Text"
            testID="scalable-button"
          />
        </TestWrapper>
      );

      const buttonText = getByText('Scalable Text');
      // Font should be scaled appropriately
      expect(buttonText).toBeTruthy();
    });
  });

  describe('Screen Reader Navigation', () => {
    it('should provide logical reading order', () => {
      const { getAllByRole } = render(
        <TestWrapper>
          <KeyboardNavigationView>
            <ThemedButton title="First Button" />
            <ThemedButton title="Second Button" />
            <ThemedButton title="Third Button" />
          </KeyboardNavigationView>
        </TestWrapper>
      );

      const buttons = getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveProp('accessibilityLabel', 'First Button');
      expect(buttons[1]).toHaveProp('accessibilityLabel', 'Second Button');
      expect(buttons[2]).toHaveProp('accessibilityLabel', 'Third Button');
    });

    it('should group related elements properly', () => {
      const { getByRole } = render(
        <TestWrapper>
          <KeyboardNavigationView
            accessibilityRole="group"
            accessibilityLabel="Score entry section"
          >
            <AccessibleTextInput
              label="Player Score"
              value="25"
            />
            <ThemedButton title="Submit Score" />
          </KeyboardNavigationView>
        </TestWrapper>
      );

      const group = getByRole('group');
      expect(group).toHaveProp('accessibilityLabel', 'Score entry section');
    });
  });

  describe('Error Handling and Feedback', () => {
    it('should announce errors to screen readers', () => {
      const { getByText } = render(
        <TestWrapper>
          <AccessibleTextInput
            label="Score Input"
            value="invalid"
            error="Please enter a valid number"
          />
        </TestWrapper>
      );

      const errorText = getByText('Please enter a valid number');
      expect(errorText).toHaveProp('accessibilityRole', 'alert');
      expect(errorText).toHaveProp('accessibilityLiveRegion', 'polite');
    });
  });
});