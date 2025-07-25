/**
 * Accessibility Service
 * Provides comprehensive accessibility utilities and screen reader support
 */

import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityAnnouncement {
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  fontScale: number;
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private state: AccessibilityState = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isHighContrastEnabled: false,
    fontScale: 1,
  };

  private listeners: Array<(state: AccessibilityState) => void> = [];

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Check screen reader status
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.state.isScreenReaderEnabled = isScreenReaderEnabled;

      // Check reduce motion preference
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      this.state.isReduceMotionEnabled = isReduceMotionEnabled;

      // Check high contrast preference (iOS only)
      if (Platform.OS === 'ios') {
        try {
          const isHighContrastEnabled = await AccessibilityInfo.isHighContrastEnabled();
          this.state.isHighContrastEnabled = isHighContrastEnabled;
        } catch {
          // High contrast API not available on older iOS versions
          this.state.isHighContrastEnabled = false;
        }
      }

      // Set up listeners for accessibility changes
      this.setupListeners();
    } catch (error) {
      console.warn('Failed to initialize accessibility service:', error);
    }
  }

  private setupListeners(): void {
    // Listen for screen reader changes
    AccessibilityInfo.addEventListener('screenReaderChanged', (isEnabled) => {
      this.state.isScreenReaderEnabled = isEnabled;
      this.notifyListeners();
    });

    // Listen for reduce motion changes
    AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      this.state.isReduceMotionEnabled = isEnabled;
      this.notifyListeners();
    });

    // Listen for high contrast changes (iOS only)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.addEventListener('highContrastChanged', (isEnabled) => {
        this.state.isHighContrastEnabled = isEnabled;
        this.notifyListeners();
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Subscribe to accessibility state changes
   */
  subscribe(listener: (state: AccessibilityState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current accessibility state
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Check if screen reader is enabled
   */
  isScreenReaderEnabled(): boolean {
    return this.state.isScreenReaderEnabled;
  }

  /**
   * Check if reduce motion is enabled
   */
  isReduceMotionEnabled(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  /**
   * Check if high contrast is enabled
   */
  isHighContrastEnabled(): boolean {
    return this.state.isHighContrastEnabled;
  }

  /**
   * Announce message to screen reader
   */
  async announce(announcement: AccessibilityAnnouncement): Promise<void> {
    if (!this.state.isScreenReaderEnabled) {
      return;
    }

    try {
      await AccessibilityInfo.announceForAccessibility(announcement.message);
    } catch (error) {
      console.warn('Failed to announce for accessibility:', error);
    }
  }

  /**
   * Announce score update to screen reader
   */
  async announceScoreUpdate(playerName: string, score: number, isRummy: boolean = false): Promise<void> {
    const message = isRummy 
      ? `${playerName} scored Rummy with 0 points`
      : `${playerName} scored ${score} points`;
    
    await this.announce({ message, priority: 'medium' });
  }

  /**
   * Announce game state changes
   */
  async announceGameState(message: string): Promise<void> {
    await this.announce({ message, priority: 'high' });
  }

  /**
   * Announce leaderboard update
   */
  async announceLeaderboard(players: Array<{ name: string; totalScore: number; isLeader: boolean }>): Promise<void> {
    if (!this.state.isScreenReaderEnabled) {
      return;
    }

    const leader = players.find(p => p.isLeader);
    if (leader) {
      const message = `Current leader: ${leader.name} with ${leader.totalScore} points`;
      await this.announce({ message, priority: 'medium' });
    }
  }

  /**
   * Get accessibility label for score display
   */
  getScoreLabel(playerName: string, score: number, position?: number): string {
    const positionText = position ? ` in position ${position}` : '';
    return `${playerName} has ${score} points${positionText}`;
  }

  /**
   * Get accessibility hint for interactive elements
   */
  getInteractionHint(action: string): string {
    const hints = {
      'add-round': 'Double tap to add scores for a new round',
      'edit-round': 'Double tap to edit scores for this round',
      'delete-round': 'Double tap to delete this round',
      'rummy-toggle': 'Double tap to toggle Rummy status',
      'score-input': 'Enter score using the number keypad',
      'player-add': 'Double tap to add a new player',
      'player-remove': 'Double tap to remove this player',
      'game-start': 'Double tap to start the game',
      'game-end': 'Double tap to end the current game',
      'navigation': 'Double tap to navigate to this screen',
    };

    return hints[action as keyof typeof hints] || 'Double tap to activate';
  }

  /**
   * Get accessibility role for different UI elements
   */
  getAccessibilityRole(elementType: string): string {
    const roles = {
      'score-display': 'text',
      'player-name': 'text',
      'game-title': 'header',
      'section-header': 'header',
      'action-button': 'button',
      'input-field': 'none', // Let TextInput handle its own role
      'score-list': 'list',
      'score-item': 'text',
      'navigation-tab': 'tab',
    };

    return roles[elementType as keyof typeof roles] || 'none';
  }

  /**
   * Format number for screen reader announcement
   */
  formatNumberForScreenReader(number: number): string {
    if (number === 0) return 'zero';
    if (number === 1) return 'one point';
    return `${number} points`;
  }

  /**
   * Get accessibility state for interactive elements
   */
  getAccessibilityState(element: {
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
    busy?: boolean;
  }) {
    return {
      disabled: element.disabled || false,
      selected: element.selected || false,
      expanded: element.expanded || false,
      busy: element.busy || false,
    };
  }

  /**
   * Check if animations should be reduced
   */
  shouldReduceAnimations(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  /**
   * Get appropriate animation duration based on accessibility preferences
   */
  getAnimationDuration(baseDuration: number): number {
    if (this.state.isReduceMotionEnabled) {
      return Math.min(baseDuration * 0.1, 50); // Very short or no animation
    }
    return baseDuration;
  }

  /**
   * Focus management for screen readers
   */
  async setAccessibilityFocus(elementRef: any): Promise<void> {
    if (!this.state.isScreenReaderEnabled || !elementRef?.current) {
      return;
    }

    try {
      AccessibilityInfo.setAccessibilityFocus(elementRef.current);
    } catch (error) {
      console.warn('Failed to set accessibility focus:', error);
    }
  }
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance();

// Hook for using accessibility service in components
export function useAccessibility() {
  const [state, setState] = React.useState<AccessibilityState>(accessibilityService.getState());

  React.useEffect(() => {
    const unsubscribe = accessibilityService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    announce: accessibilityService.announce.bind(accessibilityService),
    announceScoreUpdate: accessibilityService.announceScoreUpdate.bind(accessibilityService),
    announceGameState: accessibilityService.announceGameState.bind(accessibilityService),
    announceLeaderboard: accessibilityService.announceLeaderboard.bind(accessibilityService),
    getScoreLabel: accessibilityService.getScoreLabel.bind(accessibilityService),
    getInteractionHint: accessibilityService.getInteractionHint.bind(accessibilityService),
    getAccessibilityRole: accessibilityService.getAccessibilityRole.bind(accessibilityService),
    formatNumberForScreenReader: accessibilityService.formatNumberForScreenReader.bind(accessibilityService),
    getAccessibilityState: accessibilityService.getAccessibilityState.bind(accessibilityService),
    shouldReduceAnimations: accessibilityService.shouldReduceAnimations.bind(accessibilityService),
    getAnimationDuration: accessibilityService.getAnimationDuration.bind(accessibilityService),
    setAccessibilityFocus: accessibilityService.setAccessibilityFocus.bind(accessibilityService),
  };
}

// Import React for the hook
import React from 'react';