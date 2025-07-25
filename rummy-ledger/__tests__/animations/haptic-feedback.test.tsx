/**
 * Haptic Feedback Tests
 * Tests for haptic feedback integration and patterns
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HapticService, useHaptics } from '@/src/services/HapticService';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemeProvider } from '@/src/context/ThemeContext';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock Platform
const mockPlatform = {
  OS: 'ios',
};

jest.mock('react-native/Libraries/Utilities/Platform', () => mockPlatform);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('HapticService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    HapticService.setEnabled(true);
  });

  describe('Basic Haptic Feedback', () => {
    it('should trigger light impact feedback', async () => {
      await HapticService.trigger('light');
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger medium impact feedback', async () => {
      await HapticService.trigger('medium');
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should trigger heavy impact feedback', async () => {
      await HapticService.trigger('heavy');
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should trigger success notification feedback', async () => {
      await HapticService.trigger('success');
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger warning notification feedback', async () => {
      await HapticService.trigger('warning');
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('should trigger error notification feedback', async () => {
      await HapticService.trigger('error');
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });

    it('should trigger selection feedback', async () => {
      await HapticService.trigger('selection');
      
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    it('should trigger button press feedback', async () => {
      await HapticService.buttonPress();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger score entry feedback', async () => {
      await HapticService.scoreEntry();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should trigger game creation feedback', async () => {
      await HapticService.gameCreation();
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger round complete feedback', async () => {
      await HapticService.roundComplete();
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger game win feedback with double success', async () => {
      jest.useFakeTimers();
      
      const gameWinPromise = HapticService.gameWin();
      
      // First success should be immediate
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
      
      // Fast-forward time for second success
      jest.advanceTimersByTime(200);
      
      await gameWinPromise;
      
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should trigger error action feedback', async () => {
      await HapticService.errorAction();
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });

    it('should trigger delete action feedback', async () => {
      await HapticService.deleteAction();
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    it('should trigger rummy toggle feedback', async () => {
      await HapticService.rummyToggle();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('should trigger leaderboard update feedback', async () => {
      await HapticService.leaderboardUpdate();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });

  describe('Custom Patterns', () => {
    it('should execute custom haptic pattern', async () => {
      jest.useFakeTimers();
      
      const pattern = ['success', 'heavy', 'success'] as const;
      const delays = [150, 150];
      
      const patternPromise = HapticService.customPattern(pattern, delays);
      
      // First haptic should be immediate
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
      
      // Advance time for second haptic
      jest.advanceTimersByTime(150);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Advance time for third haptic
      jest.advanceTimersByTime(150);
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
      
      await patternPromise;
      
      jest.useRealTimers();
    });

    it('should execute celebration pattern', async () => {
      jest.useFakeTimers();
      
      const celebrationPromise = HapticService.celebrationPattern();
      
      // Should trigger success, then heavy, then success with delays
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
      
      jest.advanceTimersByTime(150);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
      
      jest.advanceTimersByTime(150);
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
      
      await celebrationPromise;
      
      jest.useRealTimers();
    });
  });

  describe('Platform Compatibility', () => {
    it('should not trigger haptics on web platform', async () => {
      // Mock web platform
      mockPlatform.OS = 'web';
      
      await HapticService.trigger('success');
      
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      
      // Reset to iOS
      mockPlatform.OS = 'ios';
    });

    it('should handle haptic errors gracefully', async () => {
      // Mock haptic error
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Haptics not supported'));
      
      // Should not throw error
      await expect(HapticService.trigger('light')).resolves.toBeUndefined();
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should respect enabled state', async () => {
      HapticService.setEnabled(false);
      
      await HapticService.trigger('success');
      
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });

    it('should return enabled state', () => {
      HapticService.setEnabled(true);
      expect(HapticService.getEnabled()).toBe(true);
      
      HapticService.setEnabled(false);
      expect(HapticService.getEnabled()).toBe(false);
    });
  });
});

describe('useHaptics Hook', () => {
  const TestComponent = () => {
    const haptics = useHaptics();
    
    return (
      <ThemedButton
        title="Test Button"
        onPress={() => haptics.buttonPress()}
        testID="test-button"
      />
    );
  };

  it('should provide haptic methods', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const button = getByTestId('test-button');
    fireEvent.press(button);

    // Button should have been pressed (haptic feedback tested separately)
    expect(button).toBeTruthy();
  });

  it('should provide all haptic convenience methods', () => {
    const TestComponentWithAllMethods = () => {
      const haptics = useHaptics();
      
      // Verify all methods are available
      expect(typeof haptics.trigger).toBe('function');
      expect(typeof haptics.buttonPress).toBe('function');
      expect(typeof haptics.scoreEntry).toBe('function');
      expect(typeof haptics.gameCreation).toBe('function');
      expect(typeof haptics.roundComplete).toBe('function');
      expect(typeof haptics.gameWin).toBe('function');
      expect(typeof haptics.errorAction).toBe('function');
      expect(typeof haptics.deleteAction).toBe('function');
      expect(typeof haptics.rummyToggle).toBe('function');
      expect(typeof haptics.leaderboardUpdate).toBe('function');
      expect(typeof haptics.celebrationPattern).toBe('function');
      expect(typeof haptics.customPattern).toBe('function');
      expect(typeof haptics.setEnabled).toBe('function');
      expect(typeof haptics.getEnabled).toBe('function');
      
      return null;
    };

    render(
      <TestWrapper>
        <TestComponentWithAllMethods />
      </TestWrapper>
    );
  });
});

describe('ThemedButton Haptic Integration', () => {
  it('should trigger haptic feedback on button press', async () => {
    const mockOnPress = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <ThemedButton
          title="Test Button"
          onPress={mockOnPress}
          hapticFeedback={true}
        />
      </TestWrapper>
    );

    const button = getByText('Test Button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });
  });

  it('should not trigger haptic feedback when disabled', async () => {
    const mockOnPress = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <ThemedButton
          title="Test Button"
          onPress={mockOnPress}
          hapticFeedback={false}
        />
      </TestWrapper>
    );

    const button = getByText('Test Button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalled();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  it('should not trigger haptic feedback when button is disabled', async () => {
    const mockOnPress = jest.fn();
    
    const { getByText } = render(
      <TestWrapper>
        <ThemedButton
          title="Test Button"
          onPress={mockOnPress}
          disabled={true}
          hapticFeedback={true}
        />
      </TestWrapper>
    );

    const button = getByText('Test Button');
    fireEvent.press(button);

    // Button press should not be called when disabled
    expect(mockOnPress).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});