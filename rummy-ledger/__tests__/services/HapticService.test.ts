/**
 * HapticService Tests
 * Tests for haptic feedback service functionality
 */

import { HapticService } from '@/src/services/HapticService';
import * as Haptics from 'expo-haptics';

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

describe('HapticService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    HapticService.setEnabled(true);
  });

  describe('Basic Functionality', () => {
    it('should trigger light impact feedback', async () => {
      await HapticService.trigger('light');
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger success notification feedback', async () => {
      await HapticService.trigger('success');
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should respect enabled state', async () => {
      HapticService.setEnabled(false);
      
      await HapticService.trigger('success');
      
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Haptics not supported'));
      
      await expect(HapticService.trigger('light')).resolves.toBeUndefined();
    });
  });

  describe('Convenience Methods', () => {
    it('should trigger button press feedback', async () => {
      await HapticService.buttonPress();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should trigger game creation feedback', async () => {
      await HapticService.gameCreation();
      
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('should trigger rummy toggle feedback', async () => {
      await HapticService.rummyToggle();
      
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });
  });
});