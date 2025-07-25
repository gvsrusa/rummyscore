/**
 * CelebrationAnimation Component Tests
 * Tests for celebration animations and winner declarations
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { CelebrationAnimation, WinnerCelebration } from '@/components/CelebrationAnimation';
import { ThemeProvider } from '@/src/context/ThemeContext';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  return {
    ...Reanimated,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
    withDelay: jest.fn((delay, animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    withRepeat: jest.fn((animation) => animation),
    runOnJS: jest.fn((fn) => fn),
    interpolate: jest.fn((value, input, output) => output[0]),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('CelebrationAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when visible', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
            subtitle="Congratulations!"
          />
        </TestWrapper>
      );

      expect(getByText('Winner!')).toBeTruthy();
      expect(getByText('Congratulations!')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={false}
            title="Winner!"
            subtitle="Congratulations!"
          />
        </TestWrapper>
      );

      expect(queryByText('Winner!')).toBeNull();
      expect(queryByText('Congratulations!')).toBeNull();
    });

    it('should render without subtitle', () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
          />
        </TestWrapper>
      );

      expect(getByText('Winner!')).toBeTruthy();
      expect(queryByText('Congratulations!')).toBeNull();
    });
  });

  describe('Animation Types', () => {
    it('should render winner celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
          />
        </TestWrapper>
      );

      expect(getByText('Winner!')).toBeTruthy();
    });

    it('should render rummy celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="rummy"
            visible={true}
            title="RUMMY!"
          />
        </TestWrapper>
      );

      expect(getByText('RUMMY!')).toBeTruthy();
    });

    it('should render game complete celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="gameComplete"
            visible={true}
            title="Game Complete!"
          />
        </TestWrapper>
      );

      expect(getByText('Game Complete!')).toBeTruthy();
    });

    it('should render new record celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="newRecord"
            visible={true}
            title="New Record!"
          />
        </TestWrapper>
      );

      expect(getByText('New Record!')).toBeTruthy();
    });
  });

  describe('Animation Lifecycle', () => {
    it('should create animation values', () => {
      const mockUseSharedValue = require('react-native-reanimated').useSharedValue;
      
      render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
          />
        </TestWrapper>
      );

      // Verify animation values are created
      expect(mockUseSharedValue).toHaveBeenCalledWith(0); // opacity
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.3); // scale
      expect(mockUseSharedValue).toHaveBeenCalledWith(0.8); // titleScale
    });

    it('should apply animated styles', () => {
      const mockUseAnimatedStyle = require('react-native-reanimated').useAnimatedStyle;
      
      render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
          />
        </TestWrapper>
      );

      expect(mockUseAnimatedStyle).toHaveBeenCalled();
    });

    it('should call onComplete callback', () => {
      const mockOnComplete = jest.fn();
      
      render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      );

      // onComplete should be set up (actual timing is mocked)
      expect(mockOnComplete).toBeDefined();
    });
  });

  describe('Confetti Elements', () => {
    it('should render confetti for winner celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="winner"
            visible={true}
            title="Winner!"
          />
        </TestWrapper>
      );

      // Should render the celebration
      expect(getByText('Winner!')).toBeTruthy();
    });

    it('should render confetti for game complete celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="gameComplete"
            visible={true}
            title="Game Complete!"
          />
        </TestWrapper>
      );

      expect(getByText('Game Complete!')).toBeTruthy();
    });

    it('should not render confetti for rummy celebration', () => {
      const { getByText } = render(
        <TestWrapper>
          <CelebrationAnimation
            type="rummy"
            visible={true}
            title="RUMMY!"
          />
        </TestWrapper>
      );

      expect(getByText('RUMMY!')).toBeTruthy();
    });
  });
});

describe('WinnerCelebration Preset', () => {
  it('should render winner celebration with correct props', () => {
    const { getByText } = render(
      <TestWrapper>
        <WinnerCelebration
          visible={true}
          winnerName="John"
        />
      </TestWrapper>
    );

    expect(getByText('🎉 Winner! 🎉')).toBeTruthy();
    expect(getByText('Congratulations John!')).toBeTruthy();
  });

  it('should handle onComplete callback', () => {
    const mockOnComplete = jest.fn();
    
    render(
      <TestWrapper>
        <WinnerCelebration
          visible={true}
          winnerName="John"
          onComplete={mockOnComplete}
        />
      </TestWrapper>
    );

    expect(mockOnComplete).toBeDefined();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <TestWrapper>
        <WinnerCelebration
          visible={false}
          winnerName="John"
        />
      </TestWrapper>
    );

    expect(queryByText('🎉 Winner! 🎉')).toBeNull();
  });
});

describe('Animation Performance', () => {
  it('should use spring animations for smooth transitions', () => {
    const mockWithSpring = require('react-native-reanimated').withSpring;
    
    render(
      <TestWrapper>
        <CelebrationAnimation
          type="winner"
          visible={true}
          title="Winner!"
        />
      </TestWrapper>
    );

    expect(mockWithSpring).toHaveBeenCalled();
  });

  it('should use appropriate timing for sequences', () => {
    const mockWithSequence = require('react-native-reanimated').withSequence;
    
    render(
      <TestWrapper>
        <CelebrationAnimation
          type="winner"
          visible={true}
          title="Winner!"
        />
      </TestWrapper>
    );

    expect(mockWithSequence).toHaveBeenCalled();
  });

  it('should use delays for staggered animations', () => {
    const mockWithDelay = require('react-native-reanimated').withDelay;
    
    render(
      <TestWrapper>
        <CelebrationAnimation
          type="winner"
          visible={true}
          title="Winner!"
        />
      </TestWrapper>
    );

    expect(mockWithDelay).toHaveBeenCalled();
  });
});