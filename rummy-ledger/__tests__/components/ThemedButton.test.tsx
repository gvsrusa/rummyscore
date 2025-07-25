/**
 * ThemedButton Component Tests
 * Tests for themed button component with variants and accessibility
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ThemedButton } from '@/components/ThemedButton';

const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height });
};

describe('ThemedButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensions(375, 812);
  });

  describe('Basic Rendering', () => {
    it('should render button with title', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Test Button" />
        </ThemeProvider>
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should handle press events', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Press Me" onPress={onPress} />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Press Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Variants', () => {
    it('should apply primary variant styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Primary" variant="primary" />
        </ThemeProvider>
      );

      const button = getByText('Primary').parent;
      expect(button).toHaveStyle({
        backgroundColor: '#1E3A8A', // Primary color
      });
    });

    it('should apply secondary variant styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Secondary" variant="secondary" />
        </ThemeProvider>
      );

      const button = getByText('Secondary').parent;
      expect(button).toHaveStyle({
        backgroundColor: '#10B981', // Secondary color
      });
    });

    it('should apply outline variant styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Outline" variant="outline" />
        </ThemeProvider>
      );

      const button = getByText('Outline').parent;
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#1E3A8A', // Primary color
      });
    });

    it('should apply ghost variant styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Ghost" variant="ghost" />
        </ThemeProvider>
      );

      const button = getByText('Ghost').parent;
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
      });
    });

    it('should apply danger variant styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Danger" variant="danger" />
        </ThemeProvider>
      );

      const button = getByText('Danger').parent;
      expect(button).toHaveStyle({
        backgroundColor: '#EF4444', // Error color
      });
    });
  });

  describe('Button Sizes', () => {
    it('should apply small size styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Small" size="small" />
        </ThemeProvider>
      );

      const button = getByText('Small').parent;
      expect(button).toHaveStyle({
        minHeight: 32, // Small touch target
        paddingHorizontal: 16,
        paddingVertical: 4,
      });
    });

    it('should apply medium size styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Medium" size="medium" />
        </ThemeProvider>
      );

      const button = getByText('Medium').parent;
      expect(button).toHaveStyle({
        minHeight: 44, // Medium touch target
        paddingHorizontal: 24,
        paddingVertical: 8,
      });
    });

    it('should apply large size styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Large" size="large" />
        </ThemeProvider>
      );

      const button = getByText('Large').parent;
      expect(button).toHaveStyle({
        minHeight: 56, // Large touch target
        paddingHorizontal: 32,
        paddingVertical: 16,
      });
    });
  });

  describe('Button States', () => {
    it('should show loading state', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ThemedButton title="Loading" loading />
        </ThemeProvider>
      );

      // Should have ActivityIndicator
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('should be disabled when loading', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Loading" loading onPress={onPress} />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Loading'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should apply disabled styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Disabled" disabled />
        </ThemeProvider>
      );

      const button = getByText('Disabled').parent;
      expect(button).toHaveStyle({
        backgroundColor: '#E5E7EB', // Border color for disabled
      });
    });

    it('should not respond to press when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Disabled" disabled onPress={onPress} />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('should apply full width styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Full Width" fullWidth />
        </ThemeProvider>
      );

      const button = getByText('Full Width').parent;
      expect(button).toHaveStyle({
        width: '100%',
      });
    });
  });

  describe('Text Colors', () => {
    it('should use inverse text color for primary variant', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Primary" variant="primary" />
        </ThemeProvider>
      );

      const text = getByText('Primary');
      expect(text).toHaveStyle({
        color: '#FFFFFF', // Text inverse color
      });
    });

    it('should use primary text color for outline variant', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Outline" variant="outline" />
        </ThemeProvider>
      );

      const text = getByText('Outline');
      expect(text).toHaveStyle({
        color: '#1E3A8A', // Primary color
      });
    });

    it('should use tertiary text color when disabled', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Disabled" disabled />
        </ThemeProvider>
      );

      const text = getByText('Disabled');
      expect(text).toHaveStyle({
        color: '#6B7280', // Text tertiary color
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust padding on small devices', () => {
      mockDimensions(320, 568); // Small device

      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Small Device" size="medium" />
        </ThemeProvider>
      );

      const button = getByText('Small Device').parent;
      expect(button).toHaveStyle({
        paddingHorizontal: 19.2, // 24 * 0.8
        paddingVertical: 6.4, // 8 * 0.8
      });
    });

    it('should adjust padding on tablets', () => {
      mockDimensions(768, 1024); // Tablet

      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Tablet" size="medium" />
        </ThemeProvider>
      );

      const button = getByText('Tablet').parent;
      expect(button).toHaveStyle({
        paddingHorizontal: 28.8, // 24 * 1.2
        paddingVertical: 9.6, // 8 * 1.2
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Accessible" />
        </ThemeProvider>
      );

      const button = getByText('Accessible').parent;
      expect(button).toHaveProp('accessibilityRole', 'button');
    });

    it('should use title as accessibility label by default', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Default Label" />
        </ThemeProvider>
      );

      const button = getByText('Default Label').parent;
      expect(button).toHaveProp('accessibilityLabel', 'Default Label');
    });

    it('should use custom accessibility label', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton 
            title="Button" 
            accessibilityLabel="Custom Label"
            accessibilityHint="Custom Hint"
          />
        </ThemeProvider>
      );

      const button = getByText('Button').parent;
      expect(button).toHaveProp('accessibilityLabel', 'Custom Label');
      expect(button).toHaveProp('accessibilityHint', 'Custom Hint');
    });

    it('should indicate disabled state in accessibility', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Disabled" disabled />
        </ThemeProvider>
      );

      const button = getByText('Disabled').parent;
      expect(button).toHaveProp('accessibilityState', { disabled: true });
    });

    it('should indicate loading state in accessibility', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton title="Loading" loading />
        </ThemeProvider>
      );

      const button = getByText('Loading').parent;
      expect(button).toHaveProp('accessibilityState', { disabled: true });
    });
  });

  describe('Custom Styling', () => {
    it('should merge custom styles', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ThemedButton 
            title="Custom Style"
            style={{
              marginTop: 20,
              borderRadius: 20,
            }}
          />
        </ThemeProvider>
      );

      const button = getByText('Custom Style').parent;
      expect(button).toHaveStyle({
        marginTop: 20,
        borderRadius: 20,
        backgroundColor: '#1E3A8A', // Still has theme background
      });
    });
  });
});