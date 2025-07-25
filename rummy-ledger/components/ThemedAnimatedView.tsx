/**
 * Themed Animated View Component
 * Provides theme-aware animations with responsive behavior
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'shake' | 'pulse';
export type AnimationDirection = 'up' | 'down' | 'left' | 'right';

interface ThemedAnimatedViewProps {
  children: React.ReactNode;
  animation?: AnimationType;
  direction?: AnimationDirection;
  duration?: number;
  delay?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
  backgroundColor?: keyof ReturnType<typeof useTheme>['colors'];
  borderRadius?: keyof typeof import('@/constants/Theme').borderRadius;
  shadow?: keyof typeof import('@/constants/Theme').shadows;
}

export function ThemedAnimatedView({
  children,
  animation = 'fade',
  direction = 'up',
  duration,
  delay = 0,
  autoPlay = true,
  loop = false,
  style,
  onAnimationComplete,
  backgroundColor,
  borderRadius,
  shadow,
}: ThemedAnimatedViewProps) {
  const { colors, theme } = useTheme();
  const responsive = useResponsive();
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  // Get responsive animation duration
  const animationDuration = duration || theme.animations.getDuration(theme.animations.normal);
  
  // Initialize animation values based on type
  useEffect(() => {
    if (animation === 'fade') {
      opacity.value = 0;
    } else if (animation === 'slide') {
      opacity.value = 0;
      switch (direction) {
        case 'up':
          translateY.value = 50;
          break;
        case 'down':
          translateY.value = -50;
          break;
        case 'left':
          translateX.value = 50;
          break;
        case 'right':
          translateX.value = -50;
          break;
      }
    } else if (animation === 'scale') {
      opacity.value = 0;
      scale.value = 0.8;
    } else if (animation === 'bounce') {
      opacity.value = 0;
      scale.value = 0.3;
    }
  }, [animation, direction, opacity, translateX, translateY, scale]);
  
  // Start animation
  const startAnimation = () => {
    const config = {
      duration: animationDuration,
    };
    
    const springConfig = {
      damping: 15,
      stiffness: 150,
      mass: 1,
    };
    
    const onComplete = () => {
      if (onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
      
      if (loop) {
        // Restart animation after a brief pause
        setTimeout(() => {
          startAnimation();
        }, 500);
      }
    };
    
    switch (animation) {
      case 'fade':
        opacity.value = withTiming(1, config, onComplete);
        break;
        
      case 'slide':
        opacity.value = withTiming(1, config);
        translateX.value = withTiming(0, config);
        translateY.value = withTiming(0, config, onComplete);
        break;
        
      case 'scale':
        opacity.value = withTiming(1, config);
        scale.value = withSpring(1, springConfig, onComplete);
        break;
        
      case 'bounce':
        opacity.value = withTiming(1, { duration: animationDuration / 2 });
        scale.value = withSequence(
          withSpring(1.1, { ...springConfig, damping: 8 }),
          withSpring(1, springConfig, onComplete)
        );
        break;
        
      case 'shake':
        translateX.value = withSequence(
          withTiming(-10, { duration: animationDuration / 8 }),
          withTiming(10, { duration: animationDuration / 4 }),
          withTiming(-10, { duration: animationDuration / 4 }),
          withTiming(10, { duration: animationDuration / 4 }),
          withTiming(0, { duration: animationDuration / 8 }, onComplete)
        );
        break;
        
      case 'pulse':
        scale.value = withSequence(
          withTiming(1.05, { duration: animationDuration / 2 }),
          withTiming(1, { duration: animationDuration / 2 }, onComplete)
        );
        break;
    }
  };
  
  // Auto-play animation
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        startAnimation();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoPlay, delay]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });
  
  // Theme-based styles
  const getThemeStyles = (): ViewStyle => {
    const themeStyles: ViewStyle = {};
    
    if (backgroundColor && colors[backgroundColor]) {
      themeStyles.backgroundColor = colors[backgroundColor] as string;
    }
    
    if (borderRadius && theme.borderRadius[borderRadius]) {
      themeStyles.borderRadius = theme.borderRadius[borderRadius];
    }
    
    if (shadow && theme.shadows[shadow]) {
      Object.assign(themeStyles, theme.shadows[shadow]);
      themeStyles.shadowColor = colors.text;
    }
    
    return themeStyles;
  };
  
  return (
    <Animated.View style={[getThemeStyles(), animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// Preset animation components for common use cases
export function FadeInView(props: Omit<ThemedAnimatedViewProps, 'animation'>) {
  return <ThemedAnimatedView {...props} animation="fade" />;
}

export function SlideInView(props: Omit<ThemedAnimatedViewProps, 'animation'>) {
  return <ThemedAnimatedView {...props} animation="slide" />;
}

export function ScaleInView(props: Omit<ThemedAnimatedViewProps, 'animation'>) {
  return <ThemedAnimatedView {...props} animation="scale" />;
}

export function BounceInView(props: Omit<ThemedAnimatedViewProps, 'animation'>) {
  return <ThemedAnimatedView {...props} animation="bounce" />;
}

export function ShakeView(props: Omit<ThemedAnimatedViewProps, 'animation' | 'autoPlay'>) {
  return <ThemedAnimatedView {...props} animation="shake" autoPlay={false} />;
}

export function PulseView(props: Omit<ThemedAnimatedViewProps, 'animation'>) {
  return <ThemedAnimatedView {...props} animation="pulse" />;
}

// Hook for programmatic animations
export function useThemedAnimation() {
  const { theme } = useTheme();
  
  const createAnimation = (
    sharedValue: Animated.SharedValue<number>,
    toValue: number,
    duration?: number,
    type: 'timing' | 'spring' = 'timing'
  ) => {
    const animationDuration = duration || theme.animations.getDuration(theme.animations.normal);
    
    if (type === 'spring') {
      return withSpring(toValue, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
    }
    
    return withTiming(toValue, { duration: animationDuration });
  };
  
  const createSequence = (...animations: any[]) => {
    return withSequence(...animations);
  };
  
  return {
    createAnimation,
    createSequence,
    duration: {
      fast: theme.animations.getDuration(theme.animations.fast),
      normal: theme.animations.getDuration(theme.animations.normal),
      slow: theme.animations.getDuration(theme.animations.slow),
    },
  };
}