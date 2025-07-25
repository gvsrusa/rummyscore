/**
 * Haptic Feedback Service
 * Provides consistent haptic feedback throughout the app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticFeedbackType = 
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impact';

export class HapticService {
  private static isEnabled = true;

  /**
   * Enable or disable haptic feedback globally
   */
  static setEnabled(enabled: boolean): void {
    HapticService.isEnabled = enabled;
  }

  /**
   * Check if haptic feedback is enabled
   */
  static getEnabled(): boolean {
    return HapticService.isEnabled;
  }

  /**
   * Trigger haptic feedback based on type
   */
  static async trigger(type: HapticFeedbackType): Promise<void> {
    if (!HapticService.isEnabled || Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'impact':
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (error) {
      // Silently fail if haptics are not supported
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Convenience methods for common haptic patterns
   */
  static async buttonPress(): Promise<void> {
    return HapticService.trigger('light');
  }

  static async scoreEntry(): Promise<void> {
    return HapticService.trigger('medium');
  }

  static async gameCreation(): Promise<void> {
    return HapticService.trigger('success');
  }

  static async roundComplete(): Promise<void> {
    return HapticService.trigger('success');
  }

  static async gameWin(): Promise<void> {
    // Double success haptic for celebration
    await HapticService.trigger('success');
    setTimeout(() => HapticService.trigger('success'), 200);
  }

  static async errorAction(): Promise<void> {
    return HapticService.trigger('error');
  }

  static async deleteAction(): Promise<void> {
    return HapticService.trigger('warning');
  }

  static async rummyToggle(): Promise<void> {
    return HapticService.trigger('heavy');
  }

  static async leaderboardUpdate(): Promise<void> {
    return HapticService.trigger('light');
  }

  /**
   * Create a custom haptic pattern
   */
  static async customPattern(pattern: HapticFeedbackType[], delays: number[] = []): Promise<void> {
    for (let i = 0; i < pattern.length; i++) {
      await HapticService.trigger(pattern[i]);
      if (delays[i] && i < pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }

  /**
   * Celebration pattern for game wins
   */
  static async celebrationPattern(): Promise<void> {
    const pattern: HapticFeedbackType[] = ['success', 'heavy', 'success'];
    const delays = [150, 150];
    return HapticService.customPattern(pattern, delays);
  }
}

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
  return {
    trigger: HapticService.trigger,
    buttonPress: HapticService.buttonPress,
    scoreEntry: HapticService.scoreEntry,
    gameCreation: HapticService.gameCreation,
    roundComplete: HapticService.roundComplete,
    gameWin: HapticService.gameWin,
    errorAction: HapticService.errorAction,
    deleteAction: HapticService.deleteAction,
    rummyToggle: HapticService.rummyToggle,
    leaderboardUpdate: HapticService.leaderboardUpdate,
    celebrationPattern: HapticService.celebrationPattern,
    customPattern: HapticService.customPattern,
    setEnabled: HapticService.setEnabled,
    getEnabled: HapticService.getEnabled,
  };
}