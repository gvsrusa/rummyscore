/**
 * ThemedText Component Tests
 * Tests for themed text component with typography and responsive behavior
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions, PixelRatio } from 'react-native';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';

// Mock dependencies
const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height });
};

const mockPixelRatio = (scale: number) => {
  jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(scale);
};

describe('ThemedText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensions(375, 812);
    mockPixelRatio(1);
  });

  describe('Basic Rendering', () => {
    it('should render text with default styling', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText>Hello World</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Hello World');
      expect(textElement).toBeTruthy();
      expect(textElement).toHaveStyle({
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
      });
    });

    it('should apply custom text content', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText>Custom Text Content</ThemedText>
        </ThemeProvider>
      );

      expect(getByText('Custom Text Content')).toBeTruthy();
    });
  });

  describe('Typography Types', () => {
    it('should apply h1 typography', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="h1">Heading 1</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Heading 1');
      expect(textElement).toHaveStyle({
        fontSize: 32,
        lineHeight: 48,
        fontWeight: '700',
      });
    });

    it('should apply h2 typography', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="h2">Heading 2</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Heading 2');
      expect(textElement).toHaveStyle({
        fontSize: 24,
        lineHeight: 36,
        fontWeight: '600',
      });
    });

    it('should apply scoreDisplay typography', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="scoreDisplay">123</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('123');
      expect(textElement).toHaveStyle({
        fontSize: 48,
        lineHeight: 56,
        fontWeight: '700',
      });
    });

    it('should apply playerName typography', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="playerName">John Doe</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('John Doe');
      expect(textElement).toHaveStyle({
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600',
      });
    });

    it('should apply button typography', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="button">Button Text</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Button Text');
      expect(textElement).toHaveStyle({
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
      });
    });
  });

  describe('Color Handling', () => {
    it('should use theme text color by default', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText>Default Color</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Default Color');
      expect(textElement).toHaveStyle({
        color: '#111827', // Light theme text color
      });
    });

    it('should use custom color key', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText color="primary">Primary Color</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Primary Color');
      expect(textElement).toHaveStyle({
        color: '#1E3A8A', // Primary color
      });
    });

    it('should use light/dark color props', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText lightColor="#FF0000" darkColor="#00FF00">
            Custom Colors
          </ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Custom Colors');
      expect(textElement).toHaveStyle({
        color: '#FF0000', // Light color in light theme
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should scale font size on small devices', () => {
      mockDimensions(320, 568); // Small device
      mockPixelRatio(1);

      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="h1">Small Device</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Small Device');
      // Font size should be scaled down: 32 * 0.9 = 28.8
      expect(textElement).toHaveStyle({
        fontSize: 28.8,
      });
    });

    it('should scale font size on tablets', () => {
      mockDimensions(768, 1024); // Tablet
      mockPixelRatio(1);

      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="h1">Tablet</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Tablet');
      // Font size should be scaled up: 32 * 1.1 = 35.2
      expect(textElement).toHaveStyle({
        fontSize: 35.2,
      });
    });

    it('should respect font scale from system', () => {
      mockDimensions(375, 812);
      mockPixelRatio(1.5); // User has increased font size

      const { getByText } = render(
        <ThemeProvider>
          <ThemedText>Scaled Text</ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Scaled Text');
      // Font size should be scaled: 16 * 1.5 = 24
      expect(textElement).toHaveStyle({
        fontSize: 24,
      });
    });

    it('should disable responsive scaling when responsive=false', () => {
      mockDimensions(320, 568); // Small device
      mockPixelRatio(1);

      const { getByText } = render(
        <ThemeProvider>
          <ThemedText type="h1" responsive={false}>
            No Scaling
          </ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('No Scaling');
      // Font size should remain original: 32
      expect(textElement).toHaveStyle({
        fontSize: 32,
      });
    });
  });

  describe('Custom Styling', () => {
    it('should merge custom styles with theme styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText 
            style={{ 
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            Custom Style
          </ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Custom Style');
      expect(textElement).toHaveStyle({
        textAlign: 'center',
        marginTop: 10,
        fontSize: 16, // Still has theme font size
        color: '#111827', // Still has theme color
      });
    });

    it('should allow style overrides', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText 
            type="h1"
            style={{ 
              fontSize: 50,
              color: '#FF0000',
            }}
          >
            Override Style
          </ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Override Style');
      expect(textElement).toHaveStyle({
        fontSize: 50, // Overridden
        color: '#FF0000', // Overridden
        fontWeight: '700', // Still from theme
      });
    });
  });

  describe('Accessibility', () => {
    it('should pass through accessibility props', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedText 
            accessibilityLabel="Test Label"
            accessibilityHint="Test Hint"
            accessibilityRole="header"
          >
            Accessible Text
          </ThemedText>
        </ThemeProvider>
      );

      const textElement = getByText('Accessible Text');
      expect(textElement).toHaveProp('accessibilityLabel', 'Test Label');
      expect(textElement).toHaveProp('accessibilityHint', 'Test Hint');
      expect(textElement).toHaveProp('accessibilityRole', 'header');
    });
  });
});