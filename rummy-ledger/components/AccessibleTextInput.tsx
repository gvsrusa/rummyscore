/**
 * Accessible Text Input Component
 * Enhanced text input with comprehensive accessibility support
 */

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useAccessibility } from '@/src/services/AccessibilityService';
import { ThemedText } from './ThemedText';

export interface AccessibleTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
  variant?: 'default' | 'score' | 'player-name';
  size?: 'small' | 'medium' | 'large';
}

export interface AccessibleTextInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export const AccessibleTextInput = forwardRef<AccessibleTextInputRef, AccessibleTextInputProps>(
  ({
    label,
    error,
    hint,
    required = false,
    containerStyle,
    inputStyle,
    labelStyle,
    errorStyle,
    hintStyle,
    variant = 'default',
    size = 'medium',
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    ...textInputProps
  }, ref) => {
    const { colors, theme } = useTheme();
    const { 
      isScreenReaderEnabled, 
      getInteractionHint,
      getAccessibilityState,
    } = useAccessibility();
    
    const inputRef = useRef<TextInput>(null);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear(),
      isFocused: () => inputRef.current?.isFocused() || false,
    }));

    // Get variant-specific styles
    const getVariantStyles = () => {
      const baseStyle = {
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        backgroundColor: colors.background,
        borderColor: error ? colors.error : colors.border,
      };

      const sizeStyles = {
        small: {
          minHeight: theme.responsive.getTouchTarget('small'),
          paddingHorizontal: theme.responsive.getSpacing(theme.spacing.sm),
          paddingVertical: theme.responsive.getSpacing(theme.spacing.xs),
          fontSize: theme.responsive.getFontSize(14),
        },
        medium: {
          minHeight: theme.responsive.getTouchTarget('medium'),
          paddingHorizontal: theme.responsive.getSpacing(theme.spacing.md),
          paddingVertical: theme.responsive.getSpacing(theme.spacing.sm),
          fontSize: theme.responsive.getFontSize(16),
        },
        large: {
          minHeight: theme.responsive.getTouchTarget('large'),
          paddingHorizontal: theme.responsive.getSpacing(theme.spacing.lg),
          paddingVertical: theme.responsive.getSpacing(theme.spacing.md),
          fontSize: theme.responsive.getFontSize(18),
        },
      };

      const variantStyles = {
        default: {},
        score: {
          textAlign: 'center' as const,
          fontWeight: '600' as const,
          fontSize: theme.responsive.getFontSize(20),
        },
        'player-name': {
          fontWeight: '500' as const,
        },
      };

      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
      };
    };

    // Generate accessibility properties
    const getAccessibilityProps = () => {
      const baseLabel = accessibilityLabel || label || textInputProps.placeholder || 'Text input';
      const requiredText = required ? ', required' : '';
      const errorText = error ? `, error: ${error}` : '';
      const hintText = hint ? `, ${hint}` : '';
      
      const fullLabel = `${baseLabel}${requiredText}${errorText}${hintText}`;
      
      const interactionHint = accessibilityHint || 
        (variant === 'score' ? getInteractionHint('score-input') : 'Enter text using the keyboard');

      return {
        accessibilityLabel: fullLabel,
        accessibilityHint: interactionHint,
        accessibilityRole: accessibilityRole || 'none', // Let TextInput handle its own role
        accessibilityState: getAccessibilityState({
          disabled: textInputProps.editable === false,
        }),
        // Enhanced accessibility for screen readers
        ...(isScreenReaderEnabled && {
          accessibilityLiveRegion: error ? 'polite' as const : undefined,
          importantForAccessibility: 'yes' as const,
        }),
      };
    };

    const inputStyles = getVariantStyles();

    return (
      <View style={containerStyle}>
        {/* Label */}
        {label && (
          <ThemedText
            type="label"
            style={[
              {
                marginBottom: theme.responsive.getSpacing(theme.spacing.xs),
                color: error ? colors.error : colors.text,
              },
              labelStyle,
            ]}
            accessibilityRole="none" // Prevent double reading with input
          >
            {label}
            {required && (
              <ThemedText style={{ color: colors.error }}> *</ThemedText>
            )}
          </ThemedText>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            {
              color: colors.text,
              ...inputStyles,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          {...getAccessibilityProps()}
          {...textInputProps}
          // Enhanced keyboard handling for accessibility
          returnKeyType={textInputProps.returnKeyType || 'done'}
          blurOnSubmit={textInputProps.blurOnSubmit !== false}
          // Ensure proper focus management
          onFocus={(e) => {
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            textInputProps.onBlur?.(e);
          }}
        />

        {/* Error Message */}
        {error && (
          <ThemedText
            type="caption"
            style={[
              {
                marginTop: theme.responsive.getSpacing(theme.spacing.xs),
                color: colors.error,
              },
              errorStyle,
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </ThemedText>
        )}

        {/* Hint Text */}
        {hint && !error && (
          <ThemedText
            type="caption"
            style={[
              {
                marginTop: theme.responsive.getSpacing(theme.spacing.xs),
                color: colors.textSecondary,
              },
              hintStyle,
            ]}
            accessibilityRole="none" // Already included in input's accessibility label
          >
            {hint}
          </ThemedText>
        )}
      </View>
    );
  }
);

AccessibleTextInput.displayName = 'AccessibleTextInput';