/**
 * Theme Context Tests
 * Tests for theme provider and theme switching functionality
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';

// Mock dependencies
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(),
}));

// Mock React Native modules that cause issues in tests
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock problematic components
  const mockComponent = (name: string) => {
    const MockedComponent = (props: any) => {
      const React = require('react');
      return React.createElement('View', props, props.children);
    };
    MockedComponent.displayName = name;
    return MockedComponent;
  };

  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    PixelRatio: {
      getFontScale: jest.fn(() => 1),
      get: jest.fn(() => 2),
    },
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    StatusBar: mockComponent('StatusBar'),
    // Mock components that cause TurboModule issues
    DevMenu: undefined,
    Clipboard: undefined,
    ProgressBarAndroid: undefined,
    // Mock VirtualizedList components
    VirtualizedList: mockComponent('VirtualizedList'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Test component that uses theme
function TestComponent() {
  const { colorScheme, colors, toggleTheme, setTheme, themePreference, isSystemTheme } = useTheme();
  
  return (
    <>
      <ThemedText testID="color-scheme">{colorScheme}</ThemedText>
      <ThemedText testID="theme-preference">{themePreference}</ThemedText>
      <ThemedText testID="is-system-theme">{isSystemTheme.toString()}</ThemedText>
      <ThemedText testID="background-color">{colors.background}</ThemedText>
      <ThemedText testID="text-color">{colors.text}</ThemedText>
      <ThemedText testID="toggle-theme" onPress={toggleTheme}>Toggle</ThemedText>
      <ThemedText testID="set-light" onPress={() => setTheme('light')}>Light</ThemedText>
      <ThemedText testID="set-dark" onPress={() => setTheme('dark')}>Dark</ThemedText>
      <ThemedText testID="set-system" onPress={() => setTheme('system')}>System</ThemedText>
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockUseColorScheme.mockReturnValue('light');
  });

  describe('Theme Provider', () => {
    it('should provide default light theme when no preference is stored', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('color-scheme')).toHaveTextContent('light');
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
        expect(getByTestId('is-system-theme')).toHaveTextContent('true');
      });
    });

    it('should use system dark theme when system is dark', async () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('color-scheme')).toHaveTextContent('dark');
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
        expect(getByTestId('is-system-theme')).toHaveTextContent('true');
      });
    });

    it('should load stored theme preference', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('dark');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('color-scheme')).toHaveTextContent('dark');
        expect(getByTestId('theme-preference')).toHaveTextContent('dark');
        expect(getByTestId('is-system-theme')).toHaveTextContent('false');
      });
    });

    it('should provide correct colors for light theme', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('background-color')).toHaveTextContent('#FFFFFF');
        expect(getByTestId('text-color')).toHaveTextContent('#111827');
      });
    });

    it('should provide correct colors for dark theme', async () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('background-color')).toHaveTextContent('#000000');
        expect(getByTestId('text-color')).toHaveTextContent('#F9FAFB');
      });
    });
  });

  describe('Theme Switching', () => {
    it('should toggle theme from system to manual', async () => {
      mockUseColorScheme.mockReturnValue('light');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
      });

      act(() => {
        getByTestId('toggle-theme').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('dark');
        expect(getByTestId('color-scheme')).toHaveTextContent('dark');
        expect(getByTestId('is-system-theme')).toHaveTextContent('false');
      });
    });

    it('should toggle between light and dark when in manual mode', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('light');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('light');
      });

      act(() => {
        getByTestId('toggle-theme').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('dark');
        expect(getByTestId('color-scheme')).toHaveTextContent('dark');
      });

      act(() => {
        getByTestId('toggle-theme').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('light');
        expect(getByTestId('color-scheme')).toHaveTextContent('light');
      });
    });

    it('should set specific theme', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        getByTestId('set-dark').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('dark');
        expect(getByTestId('color-scheme')).toHaveTextContent('dark');
        expect(getByTestId('is-system-theme')).toHaveTextContent('false');
      });

      act(() => {
        getByTestId('set-system').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
        expect(getByTestId('is-system-theme')).toHaveTextContent('true');
      });
    });

    it('should save theme preference to storage', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        getByTestId('set-dark').props.onPress();
      });

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@RummyLedger:themePreference',
          'dark'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage load errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load theme preference:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle storage save errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      act(() => {
        getByTestId('set-dark').props.onPress();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save theme preference:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should ignore invalid stored theme values', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-theme');

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('theme-preference')).toHaveTextContent('system');
      });
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});