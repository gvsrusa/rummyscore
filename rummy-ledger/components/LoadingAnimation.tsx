/**
 * Loading Animation Component
 * Provides various loading animations with theme support
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'bars' | 'skeleton';

interface LoadingAnimationProps {
  type?: LoadingType;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export function LoadingAnimation({
  type = 'spinner',
  size = 'medium',
  color,
  text,
  style,
}: LoadingAnimationProps) {
  const { colors, theme } = useTheme();
  
  const animationValue = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  
  const loadingColor = color || colors.primary;
  
  // Get size values
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { container: 24, element: 4, spacing: 6 };
      case 'large':
        return { container: 64, element: 12, spacing: 16 };
      case 'medium':
      default:
        return { container: 40, element: 8, spacing: 10 };
    }
  };
  
  const sizeValues = getSizeValues();
  const duration = theme.animations.getDuration(theme.animations.normal);

  // Start animations
  useEffect(() => {
    switch (type) {
      case 'spinner':
        animationValue.value = withRepeat(
          withTiming(1, { duration: duration * 2 }),
          -1,
          false
        );
        break;
        
      case 'dots':
        const dotDuration = duration / 2;
        dot1.value = withRepeat(
          withSequence(
            withTiming(1, { duration: dotDuration }),
            withTiming(0.3, { duration: dotDuration })
          ),
          -1,
          false
        );
        dot2.value = withDelay(
          dotDuration / 3,
          withRepeat(
            withSequence(
              withTiming(1, { duration: dotDuration }),
              withTiming(0.3, { duration: dotDuration })
            ),
            -1,
            false
          )
        );
        dot3.value = withDelay(
          (dotDuration * 2) / 3,
          withRepeat(
            withSequence(
              withTiming(1, { duration: dotDuration }),
              withTiming(0.3, { duration: dotDuration })
            ),
            -1,
            false
          )
        );
        break;
        
      case 'pulse':
        animationValue.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration }),
            withTiming(0.6, { duration: duration })
          ),
          -1,
          false
        );
        break;
        
      case 'bars':
        animationValue.value = withRepeat(
          withTiming(1, { duration: duration }),
          -1,
          true
        );
        break;
        
      case 'skeleton':
        animationValue.value = withRepeat(
          withTiming(1, { duration: duration * 1.5 }),
          -1,
          false
        );
        break;
    }
  }, [type, duration]);

  // Spinner animation
  const spinnerStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      animationValue.value,
      [0, 1],
      [0, 360],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Dots animation styles
  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ scale: dot1.value }],
  }));
  
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ scale: dot2.value }],
  }));
  
  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
    transform: [{ scale: dot3.value }],
  }));

  // Pulse animation
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: animationValue.value,
    transform: [{ scale: animationValue.value }],
  }));

  // Bars animation
  const barsStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationValue.value,
      [0, 1],
      [0.3, 1],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ scaleY: height }],
    };
  });

  // Skeleton animation
  const skeletonStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animationValue.value,
      [0, 1],
      [-100, 100],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  // Render different loading types
  const renderLoading = () => {
    switch (type) {
      case 'spinner':
        return (
          <Animated.View
            style={[
              {
                width: sizeValues.container,
                height: sizeValues.container,
                borderWidth: sizeValues.element / 2,
                borderColor: `${loadingColor}20`,
                borderTopColor: loadingColor,
                borderRadius: sizeValues.container / 2,
              },
              spinnerStyle,
            ]}
          />
        );
        
      case 'dots':
        return (
          <ThemedView
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              style={[
                {
                  width: sizeValues.element,
                  height: sizeValues.element,
                  backgroundColor: loadingColor,
                  borderRadius: sizeValues.element / 2,
                  marginHorizontal: sizeValues.spacing / 4,
                },
                dot1Style,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: sizeValues.element,
                  height: sizeValues.element,
                  backgroundColor: loadingColor,
                  borderRadius: sizeValues.element / 2,
                  marginHorizontal: sizeValues.spacing / 4,
                },
                dot2Style,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: sizeValues.element,
                  height: sizeValues.element,
                  backgroundColor: loadingColor,
                  borderRadius: sizeValues.element / 2,
                  marginHorizontal: sizeValues.spacing / 4,
                },
                dot3Style,
              ]}
            />
          </ThemedView>
        );
        
      case 'pulse':
        return (
          <Animated.View
            style={[
              {
                width: sizeValues.container,
                height: sizeValues.container,
                backgroundColor: loadingColor,
                borderRadius: sizeValues.container / 2,
              },
              pulseStyle,
            ]}
          />
        );
        
      case 'bars':
        return (
          <ThemedView
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
              height: sizeValues.container,
            }}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    width: sizeValues.element / 2,
                    height: sizeValues.container,
                    backgroundColor: loadingColor,
                    marginHorizontal: 1,
                    borderRadius: sizeValues.element / 4,
                  },
                  barsStyle,
                  {
                    animationDelay: `${index * 100}ms`,
                  },
                ]}
              />
            ))}
          </ThemedView>
        );
        
      case 'skeleton':
        return (
          <ThemedView
            style={{
              width: sizeValues.container * 3,
              height: sizeValues.container / 2,
              backgroundColor: `${colors.textSecondary}20`,
              borderRadius: theme.borderRadius.sm,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: `${colors.background}80`,
                  width: '30%',
                },
                skeletonStyle,
              ]}
            />
          </ThemedView>
        );
        
      default:
        return null;
    }
  };

  return (
    <ThemedView
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      {renderLoading()}
      {text && (
        <ThemedText
          type="bodySmall"
          style={{
            marginTop: theme.spacing.sm,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {text}
        </ThemedText>
      )}
    </ThemedView>
  );
}

// Preset loading components
export function SpinnerLoading(props: Omit<LoadingAnimationProps, 'type'>) {
  return <LoadingAnimation {...props} type="spinner" />;
}

export function DotsLoading(props: Omit<LoadingAnimationProps, 'type'>) {
  return <LoadingAnimation {...props} type="dots" />;
}

export function PulseLoading(props: Omit<LoadingAnimationProps, 'type'>) {
  return <LoadingAnimation {...props} type="pulse" />;
}

export function BarsLoading(props: Omit<LoadingAnimationProps, 'type'>) {
  return <LoadingAnimation {...props} type="bars" />;
}

export function SkeletonLoading(props: Omit<LoadingAnimationProps, 'type'>) {
  return <LoadingAnimation {...props} type="skeleton" />;
}