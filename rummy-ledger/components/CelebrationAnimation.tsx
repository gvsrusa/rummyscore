/**
 * Celebration Animation Component
 * Provides celebratory animations for winner declarations and achievements
 */

import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export type CelebrationType = 'winner' | 'rummy' | 'gameComplete' | 'newRecord';

interface CelebrationAnimationProps {
  type: CelebrationType;
  visible: boolean;
  title: string;
  subtitle?: string;
  onComplete?: () => void;
  style?: ViewStyle;
}

export function CelebrationAnimation({
  type,
  visible,
  title,
  subtitle,
  onComplete,
  style,
}: CelebrationAnimationProps) {
  const { colors, theme } = useTheme();
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const titleScale = useSharedValue(0.8);
  const confettiScale = useSharedValue(0);
  const confettiRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerX = useSharedValue(-100);

  // Start celebration animation
  const startCelebration = () => {
    const duration = theme.animations.getDuration(theme.animations.normal);
    const fastDuration = theme.animations.getDuration(theme.animations.fast);
    
    // Main container animation
    opacity.value = withTiming(1, { duration: fastDuration });
    scale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
    
    // Title animation with bounce
    titleScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.2, { damping: 6, stiffness: 180 }),
        withSpring(1, { damping: 10, stiffness: 120 })
      )
    );
    
    // Confetti animation
    if (type === 'winner' || type === 'gameComplete') {
      confettiScale.value = withDelay(
        200,
        withSequence(
          withSpring(1, { damping: 8, stiffness: 150 }),
          withDelay(1000, withTiming(0, { duration: duration }))
        )
      );
      
      confettiRotation.value = withDelay(
        200,
        withRepeat(
          withTiming(360, { duration: duration * 2 }),
          3,
          false
        )
      );
    }
    
    // Pulse animation for emphasis
    pulseScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: duration }),
          withTiming(1, { duration: duration })
        ),
        2,
        false
      )
    );
    
    // Shimmer effect
    shimmerX.value = withDelay(
      400,
      withRepeat(
        withTiming(100, { duration: duration * 1.5 }),
        2,
        false
      )
    );
    
    // Auto-complete after animation
    if (onComplete) {
      const totalDuration = 3000; // 3 seconds total
      setTimeout(() => {
        runOnJS(onComplete)();
      }, totalDuration);
    }
  };

  // Hide animation
  const hideCelebration = () => {
    const duration = theme.animations.getDuration(theme.animations.fast);
    
    opacity.value = withTiming(0, { duration });
    scale.value = withTiming(0.8, { duration });
    titleScale.value = withTiming(0.8, { duration });
    confettiScale.value = withTiming(0, { duration });
    pulseScale.value = withTiming(1, { duration });
  };

  // Trigger animations based on visibility
  useEffect(() => {
    if (visible) {
      startCelebration();
    } else {
      hideCelebration();
    }
  }, [visible]);

  // Main container animated style
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
      ],
    };
  });

  // Title animated style
  const titleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: titleScale.value * pulseScale.value },
      ],
    };
  });

  // Confetti animated style
  const confettiStyle = useAnimatedStyle(() => {
    return {
      opacity: confettiScale.value,
      transform: [
        { scale: confettiScale.value },
        { rotate: `${confettiRotation.value}deg` },
      ],
    };
  });

  // Shimmer animated style
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerX.value,
      [-100, 100],
      [-200, 200],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ translateX }],
      opacity: interpolate(
        shimmerX.value,
        [-100, -50, 0, 50, 100],
        [0, 0.3, 0.8, 0.3, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  // Get celebration colors based on type
  const getCelebrationColors = () => {
    switch (type) {
      case 'winner':
        return {
          primary: colors.success,
          secondary: colors.warning,
          background: colors.successBackground,
        };
      case 'rummy':
        return {
          primary: colors.primary,
          secondary: colors.accent,
          background: colors.primaryBackground,
        };
      case 'gameComplete':
        return {
          primary: colors.info,
          secondary: colors.success,
          background: colors.infoBackground,
        };
      case 'newRecord':
        return {
          primary: colors.warning,
          secondary: colors.success,
          background: colors.warningBackground,
        };
      default:
        return {
          primary: colors.primary,
          secondary: colors.accent,
          background: colors.primaryBackground,
        };
    }
  };

  const celebrationColors = getCelebrationColors();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
        },
        containerStyle,
        style,
      ]}
    >
      {/* Background glow effect */}
      <ThemedView
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: celebrationColors.background,
          opacity: 0.3,
        }}
      />
      
      {/* Confetti elements */}
      {(type === 'winner' || type === 'gameComplete') && (
        <>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: 20,
                height: 20,
                backgroundColor: celebrationColors.primary,
                borderRadius: 10,
              },
              confettiStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: '25%',
                right: '25%',
                width: 15,
                height: 15,
                backgroundColor: celebrationColors.secondary,
                borderRadius: 7.5,
              },
              confettiStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: '30%',
                left: '30%',
                width: 18,
                height: 18,
                backgroundColor: colors.accent,
                borderRadius: 9,
              },
              confettiStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: '25%',
                right: '20%',
                width: 22,
                height: 22,
                backgroundColor: colors.success,
                borderRadius: 11,
              },
              confettiStyle,
            ]}
          />
        </>
      )}
      
      {/* Main content */}
      <ThemedView
        style={{
          alignItems: 'center',
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          borderRadius: theme.borderRadius.xl,
          backgroundColor: colors.surface,
          ...theme.shadows.lg,
          shadowColor: colors.text,
          overflow: 'hidden',
        }}
      >
        {/* Shimmer overlay */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              width: 50,
            },
            shimmerStyle,
          ]}
        />
        
        {/* Title */}
        <Animated.View style={titleStyle}>
          <ThemedText
            type="h1"
            style={{
              color: celebrationColors.primary,
              textAlign: 'center',
              fontWeight: '800',
              marginBottom: subtitle ? theme.spacing.sm : 0,
            }}
          >
            {title}
          </ThemedText>
        </Animated.View>
        
        {/* Subtitle */}
        {subtitle && (
          <ThemedText
            type="bodyLarge"
            style={{
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: theme.spacing.sm,
            }}
          >
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>
    </Animated.View>
  );
}

// Preset celebration components
export function WinnerCelebration({
  visible,
  winnerName,
  onComplete,
}: {
  visible: boolean;
  winnerName: string;
  onComplete?: () => void;
}) {
  return (
    <CelebrationAnimation
      type="winner"
      visible={visible}
      title="🎉 Winner! 🎉"
      subtitle={`Congratulations ${winnerName}!`}
      onComplete={onComplete}
    />
  );
}

export function RummyCelebration({
  visible,
  playerName,
  onComplete,
}: {
  visible: boolean;
  playerName: string;
  onComplete?: () => void;
}) {
  return (
    <CelebrationAnimation
      type="rummy"
      visible={visible}
      title="RUMMY!"
      subtitle={`${playerName} scored 0 points!`}
      onComplete={onComplete}
    />
  );
}

export function GameCompleteCelebration({
  visible,
  onComplete,
}: {
  visible: boolean;
  onComplete?: () => void;
}) {
  return (
    <CelebrationAnimation
      type="gameComplete"
      visible={visible}
      title="Game Complete!"
      subtitle="Great game everyone!"
      onComplete={onComplete}
    />
  );
}