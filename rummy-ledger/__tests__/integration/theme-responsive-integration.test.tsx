/**
 * Theme and Responsive Integration Tests
 * Tests for complete theme system and responsive design integration
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock Dimensions for different screen sizes
const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height });
  // Trigger dimension change event
  const listeners = (Dimensions.addEventListener as jest.Mock).mock.calls;
  listeners.forEach(([, callback]) => {
    callback({ window: { width, height } });
  });
};

// Test component that uses all theme features
function TestApp() {
  const { colorScheme, colors, toggleTheme, theme } = useTheme();
  
  return (
    <ThemedSafeAreaView testID="safe-area">
      <ResponsiveContainer maxWidth="lg" padding="md" testID="responsive-container">
        <ThemedText type="h1" testID="heading" style={{ marginBottom: 16 }}>
          Theme Test App
        </ThemedText>
        
        <ThemedText type="body" testID="body-text" style={{ marginBottom: 16 }}>
          Current theme: {colorScheme}
        </ThemedText>
        
        <ThemedText type="scoreDisplay" testID="score-text" style={{ marginBottom: 16 }}>
          123
        </ThemedText>
        
        <ThemedButton
          title="Toggle Theme"
          onPress={toggleTheme}
          testID="toggle-button"
          style={{ marginBottom: 16 }}
        />
        
        <ThemedText testID="color-info">
          Background: {colors.background}
        </ThemedText>
        <ThemedText testID="text-color-info">
          Text: {colors.text}
        </ThemedText>
        <ThemedText testID="primary-color-info">
          Primary: {colors.primary}
        </ThemedText>
      </ResponsiveContainer>
    </ThemedSafeAreaView>
  );
}

describe('Theme and Responsive Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockDimensions(375, 812); // Default iPhone size
  });

  describe('Theme System Integration', () => {
    it('should render with light theme by default', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: light');
        expect(getByTestId('color-info')).toHaveTextContent('Background: #FFFFFF');
        expect(getByTestId('text-color-info')).toHaveTextContent('Text: #111827');
        expect(getByTestId('primary-color-info')).toHaveTextContent('Primary: #1E3A8A');
      });
    });

    it('should switch to dark theme when toggled', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: light');
      });

      fireEvent.press(getByTestId('toggle-button'));

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: dark');
        expect(getByTestId('color-info')).toHaveTextContent('Background: #000000');
        expect(getByTestId('text-color-info')).toHaveTextContent('Text: #F9FAFB');
        expect(getByTestId('primary-color-info')).toHaveTextContent('Primary: #3B82F6');
      });
    });

    it('should persist theme preference', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: light');
      });

      fireEvent.press(getByTestId('toggle-button'));

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@RummyLedger:themePreference',
          'dark'
        );
      });
    });

    it('should load saved theme preference', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('dark');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: dark');
        expect(getByTestId('color-info')).toHaveTextContent('Background: #000000');
      });
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt to small screen sizes', async () => {
      mockDimensions(320, 568); // Small device

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const heading = getByTestId('heading');
        // Font size should be scaled down for small devices
        // Base h1 size is 32, scaled by 0.9 = 28.8
        expect(heading).toHaveStyle({
          fontSize: 28.8,
        });
      });
    });

    it('should adapt to tablet screen sizes', async () => {
      mockDimensions(768, 1024); // Tablet

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const heading = getByTestId('heading');
        // Font size should be scaled up for tablets
        // Base h1 size is 32, scaled by 1.1 = 35.2
        expect(heading).toHaveStyle({
          fontSize: 35.2,
        });
      });
    });

    it('should apply responsive spacing', async () => {
      mockDimensions(320, 568); // Small device

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const container = getByTestId('responsive-container');
        // Padding should be scaled down for small devices
        // Base md padding is 16, scaled by 0.8 = 12.8
        expect(container).toHaveStyle({
          padding: 12.8,
        });
      });
    });

    it('should handle orientation changes', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      // Start in portrait
      mockDimensions(375, 812);
      
      await waitFor(() => {
        expect(getByTestId('heading')).toBeTruthy();
      });

      // Switch to landscape
      mockDimensions(812, 375);

      await waitFor(() => {
        // Component should still render correctly
        expect(getByTestId('heading')).toBeTruthy();
      });
    });
  });

  describe('Typography System', () => {
    it('should apply correct typography styles', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const heading = getByTestId('heading');
        expect(heading).toHaveStyle({
          fontSize: 32,
          lineHeight: 48,
          fontWeight: '700',
        });

        const bodyText = getByTestId('body-text');
        expect(bodyText).toHaveStyle({
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '400',
        });

        const scoreText = getByTestId('score-text');
        expect(scoreText).toHaveStyle({
          fontSize: 48,
          lineHeight: 56,
          fontWeight: '700',
        });
      });
    });

    it('should scale typography responsively', async () => {
      mockDimensions(320, 568); // Small device

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const scoreText = getByTestId('score-text');
        // Score display should be scaled down: 48 * 0.9 = 43.2
        expect(scoreText).toHaveStyle({
          fontSize: 43.2,
        });
      });
    });
  });

  describe('Safe Area Handling', () => {
    it('should apply safe area insets', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const safeArea = getByTestId('safe-area');
        expect(safeArea).toHaveStyle({
          paddingTop: 44, // Top safe area inset
          paddingBottom: 34, // Bottom safe area inset
        });
      });
    });
  });

  describe('Button Integration', () => {
    it('should apply theme colors to buttons', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const button = getByTestId('toggle-button');
        expect(button).toHaveStyle({
          backgroundColor: '#1E3A8A', // Primary color in light theme
        });
      });

      fireEvent.press(getByTestId('toggle-button'));

      await waitFor(() => {
        const button = getByTestId('toggle-button');
        expect(button).toHaveStyle({
          backgroundColor: '#3B82F6', // Primary color in dark theme
        });
      });
    });

    it('should apply responsive touch targets', async () => {
      mockDimensions(320, 568); // Small device

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        const button = getByTestId('toggle-button');
        // Should maintain minimum 44px touch target even on small devices
        expect(button).toHaveStyle({
          minHeight: 44,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle theme loading errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        // Should still render with default theme
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: light');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load theme preference:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle theme saving errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByTestId } = render(
        <ThemeProvider>
          <TestApp />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: light');
      });

      fireEvent.press(getByTestId('toggle-button'));

      await waitFor(() => {
        // Theme should still switch even if saving fails
        expect(getByTestId('body-text')).toHaveTextContent('Current theme: dark');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save theme preference:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', async () => {
      let renderCount = 0;
      
      function CountingComponent() {
        renderCount++;
        const { colors } = useTheme();
        return <ThemedText testID="counting-text">Renders: {renderCount}</ThemedText>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('counting-text')).toHaveTextContent('Renders: 1');
      });

      // Multiple dimension changes shouldn't cause excessive re-renders
      mockDimensions(400, 800);
      mockDimensions(500, 900);
      mockDimensions(600, 1000);

      await waitFor(() => {
        // Should have reasonable number of re-renders (not excessive)
        expect(renderCount).toBeLessThan(10);
      });
    });
  });
});