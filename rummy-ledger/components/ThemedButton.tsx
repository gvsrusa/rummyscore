/**
 * Themed Button Component
 * Accessible button with theme support and proper touch targets
 */

import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ViewStyle, 
  ActivityIndicator,
  AccessibilityRole 
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useHaptics } from '@/src/services/HapticService';
import { useAccessibility } from '@/src/services/AccessibilityService';
import { ThemedText } from './ThemedText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ThemedButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  animatePress?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  hapticFeedback = true,
  animatePress = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  ...touchableProps
}: ThemedButtonProps) {
  const { colors, theme } = useTheme();
  const { getSpacing, getTouchTarget } = useResponsive();
  const { buttonPress } = useHaptics();
  const { 
    shouldReduceAnimations, 
    getAnimationDuration,
    getInteractionHint,
    getAccessibilityState 
  } = useAccessibility();
  
  const isDisabled = disabled || loading;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Handle press with haptic feedback and animation
  const handlePress = async (event: any) => {
    if (isDisabled) return;
    
    if (animatePress && !shouldReduceAnimations()) {
      // Press animation with accessibility-aware duration
      const duration = getAnimationDuration(100);
      scale.value = withSequence(
        withTiming(0.95, { duration }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    
    if (hapticFeedback) {
      await buttonPress();
    }
    
    onPress?.(event);
  };
  
  // Get button styles based on variant
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...(fullWidth && { width: '100%' }),
    };
    
    // Size-based styles with responsive touch targets
    const sizeStyles = {
      small: {
        minHeight: getTouchTarget('small'),
        paddingHorizontal: getSpacing(theme.spacing.md),
        paddingVertical: getSpacing(theme.spacing.xs),
      },
      medium: {
        minHeight: getTouchTarget('medium'),
        paddingHorizontal: getSpacing(theme.spacing.lg),
        paddingVertical: getSpacing(theme.spacing.sm),
      },
      large: {
        minHeight: getTouchTarget('large'),
        paddingHorizontal: getSpacing(theme.spacing.xl),
        paddingVertical: getSpacing(theme.spacing.md),
      },
    };
    
    // Variant-based styles
    const variantStyles = {
      primary: {
        backgroundColor: isDisabled ? colors.border : colors.primary,
        ...theme.shadows.sm,
        shadowColor: colors.text,
      },
      secondary: {
        backgroundColor: isDisabled ? colors.border : colors.secondary,
        ...theme.shadows.sm,
        shadowColor: colors.text,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isDisabled ? colors.border : colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: isDisabled ? colors.border : colors.error,
        ...theme.shadows.sm,
        shadowColor: colors.text,
      },
    };
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };
  
  // Get text color based on variant
  const getTextColor = () => {
    if (isDisabled) {
      return colors.textTertiary;
    }
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return colors.textInverse;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text;
      default:
        return colors.textInverse;
    }
  };
  
  // Get text type based on size
  const getTextType = () => {
    switch (size) {
      case 'small':
        return 'button' as const;
      case 'medium':
        return 'button' as const;
      case 'large':
        return 'buttonLarge' as const;
      default:
        return 'button' as const;
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Enhanced accessibility properties
  const getAccessibilityProps = () => {
    const baseLabel = accessibilityLabel || title;
    const stateText = loading ? ', loading' : '';
    const fullLabel = `${baseLabel}${stateText}`;
    
    return {
      accessibilityRole: 'button' as const,
      accessibilityLabel: fullLabel,
      accessibilityHint: accessibilityHint || getInteractionHint('action-button'),
      accessibilityState: getAccessibilityState({
        disabled: isDisabled,
        busy: loading,
      }),
      // Enhanced focus management
      accessible: true,
      importantForAccessibility: 'yes' as const,
    };
  };

  return (
    <Animated.View style={[shouldReduceAnimations() ? {} : animatedStyle]}>
      <TouchableOpacity
        style={[getButtonStyles(), style]}
        disabled={isDisabled}
        activeOpacity={0.7}
        onPress={handlePress}
        {...getAccessibilityProps()}
        {...touchableProps}
      >
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={{ marginRight: theme.spacing.xs }}
            testID="activity-indicator"
            accessibilityElementsHidden={true}
          />
        )}
        <ThemedText 
          type={getTextType()}
          style={{ color: getTextColor() }}
          responsive={false}
          accessibilityElementsHidden={true} // Prevent double reading
        >
          {title}
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}