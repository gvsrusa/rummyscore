/**
 * Responsive Container Tests
 * Tests for responsive layout components
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { 
  ResponsiveContainer, 
  ResponsiveRow, 
  ResponsiveColumn 
} from '@/components/ResponsiveContainer';
import { ThemedText } from '@/components/ThemedText';

// Mock Dimensions for different screen sizes
const mockDimensions = (width: number, height: number) => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height });
};

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ResponsiveContainer Component', () => {
    it('should render with default props', () => {
      mockDimensions(375, 812); // iPhone size
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer>
            <ThemedText testID="child">Test Content</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      expect(getByTestId('child')).toHaveTextContent('Test Content');
    });

    it('should apply responsive padding on small devices', () => {
      mockDimensions(320, 568); // Small device
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer padding="lg">
            <ThemedText testID="child">Test Content</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        padding: 19.2, // 24 * 0.8 for small device
      });
    });

    it('should apply responsive padding on tablets', () => {
      mockDimensions(768, 1024); // Tablet size
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer padding="lg">
            <ThemedText testID="child">Test Content</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        padding: 28.8, // 24 * 1.2 for tablet
      });
    });

    it('should center content when centerContent is true', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer centerContent maxWidth={600}>
            <ThemedText testID="child">Test Content</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        alignSelf: 'center',
        maxWidth: 600,
      });
    });
  });

  describe('ResponsiveRow Component', () => {
    it('should render children in a row', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveRow>
            <ThemedText testID="child1">Child 1</ThemedText>
            <ThemedText testID="child2">Child 2</ThemedText>
          </ResponsiveRow>
        </ThemeProvider>
      );

      const container = getByTestId('child1').parent;
      expect(container).toHaveStyle({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
      });
    });

    it('should apply responsive spacing', () => {
      mockDimensions(320, 568); // Small device
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveRow spacing="md">
            <ThemedText testID="child1">Child 1</ThemedText>
            <ThemedText testID="child2">Child 2</ThemedText>
          </ResponsiveRow>
        </ThemeProvider>
      );

      const container = getByTestId('child1').parent;
      expect(container).toHaveStyle({
        gap: 12.8, // 16 * 0.8 for small device
      });
    });

    it('should apply custom alignment and justification', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveRow align="flex-end" justify="space-between" wrap>
            <ThemedText testID="child">Child</ThemedText>
          </ResponsiveRow>
        </ThemeProvider>
      );

      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      });
    });
  });

  describe('ResponsiveColumn Component', () => {
    it('should render children in a column', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveColumn>
            <ThemedText testID="child1">Child 1</ThemedText>
            <ThemedText testID="child2">Child 2</ThemedText>
          </ResponsiveColumn>
        </ThemeProvider>
      );

      const container = getByTestId('child1').parent;
      expect(container).toHaveStyle({
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      });
    });

    it('should apply responsive spacing', () => {
      mockDimensions(768, 1024); // Tablet
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveColumn spacing="lg">
            <ThemedText testID="child1">Child 1</ThemedText>
            <ThemedText testID="child2">Child 2</ThemedText>
          </ResponsiveColumn>
        </ThemeProvider>
      );

      const container = getByTestId('child1').parent;
      expect(container).toHaveStyle({
        gap: 28.8, // 24 * 1.2 for tablet
      });
    });

    it('should apply custom alignment and justification', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveColumn align="center" justify="space-evenly">
            <ThemedText testID="child">Child</ThemedText>
          </ResponsiveColumn>
        </ThemeProvider>
      );

      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-evenly',
      });
    });
  });

  describe('Device Type Detection', () => {
    it('should detect small devices correctly', () => {
      mockDimensions(320, 568);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer padding="md">
            <ThemedText testID="child">Test</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      // Small device should have reduced padding (16 * 0.8 = 12.8)
      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        padding: 12.8,
      });
    });

    it('should detect tablets correctly', () => {
      mockDimensions(768, 1024);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer padding="md">
            <ThemedText testID="child">Test</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      // Tablet should have increased padding (16 * 1.2 = 19.2)
      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        padding: 19.2,
      });
    });

    it('should handle normal devices correctly', () => {
      mockDimensions(375, 812);
      
      const { getByTestId } = render(
        <ThemeProvider>
          <ResponsiveContainer padding="md">
            <ThemedText testID="child">Test</ThemedText>
          </ResponsiveContainer>
        </ThemeProvider>
      );

      // Normal device should have standard padding
      const container = getByTestId('child').parent;
      expect(container).toHaveStyle({
        padding: 16,
      });
    });
  });
});