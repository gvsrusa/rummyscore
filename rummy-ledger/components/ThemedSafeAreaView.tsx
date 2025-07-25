/**
 * Themed Safe Area View Component
 * Handles safe area insets with theme support and responsive design
 */

import React from 'react';
import { SafeAreaView, type ViewProps, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

export type ThemedSafeAreaViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  backgroundColor?: keyof ReturnType<typeof useTheme>['colors'];
  edges?: Edge[];
  padding?: keyof typeof import('@/constants/Theme').spacing;
  margin?: keyof typeof import('@/constants/Theme').spacing;
  statusBarStyle?: 'auto' | 'light' | 'dark';
  statusBarBackgroundColor?: string;
  forceInset?: Partial<Record<Edge, number>>;
};

export function ThemedSafeAreaView({
  style,
  lightColor,
  darkColor,
  backgroundColor: backgroundColorKey,
  edges = ['top', 'bottom', 'left', 'right'],
  padding,
  margin,
  statusBarStyle = 'auto',
  statusBarBackgroundColor,
  forceInset,
  ...otherProps
}: ThemedSafeAreaViewProps) {
  const { colors, theme, colorScheme } = useTheme();
  const { getSpacing } = useResponsive();
  const insets = useSafeAreaInsets();
  
  // Determine background color
  let backgroundColor = colors.background;
  if (lightColor || darkColor) {
    backgroundColor = colorScheme === 'light' ? (lightColor || colors.background) : (darkColor || colors.background);
  } else if (backgroundColorKey && colors[backgroundColorKey]) {
    backgroundColor = colors[backgroundColorKey] as string;
  }

  // Determine status bar style
  let finalStatusBarStyle: 'light-content' | 'dark-content' = 'dark-content';
  if (statusBarStyle === 'auto') {
    finalStatusBarStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';
  } else if (statusBarStyle === 'light') {
    finalStatusBarStyle = 'light-content';
  } else if (statusBarStyle === 'dark') {
    finalStatusBarStyle = 'dark-content';
  }

  // Build dynamic styles with safe area insets
  const dynamicStyles: any = { 
    backgroundColor,
    flex: 1,
  };
  
  // Apply safe area insets with force inset overrides
  if (edges.includes('top')) {
    dynamicStyles.paddingTop = forceInset?.top ?? insets.top;
  }
  if (edges.includes('bottom')) {
    dynamicStyles.paddingBottom = forceInset?.bottom ?? insets.bottom;
  }
  if (edges.includes('left')) {
    dynamicStyles.paddingLeft = forceInset?.left ?? insets.left;
  }
  if (edges.includes('right')) {
    dynamicStyles.paddingRight = forceInset?.right ?? insets.right;
  }
  
  // Apply responsive padding
  if (padding && theme.spacing[padding]) {
    const paddingValue = getSpacing(theme.spacing[padding]);
    // Add to existing padding from safe area
    if (dynamicStyles.paddingTop !== undefined) {
      dynamicStyles.paddingTop += paddingValue;
    }
    if (dynamicStyles.paddingBottom !== undefined) {
      dynamicStyles.paddingBottom += paddingValue;
    }
    if (dynamicStyles.paddingLeft !== undefined) {
      dynamicStyles.paddingLeft += paddingValue;
    }
    if (dynamicStyles.paddingRight !== undefined) {
      dynamicStyles.paddingRight += paddingValue;
    }
    
    // If no safe area padding, just use the padding value
    if (!edges.length) {
      dynamicStyles.padding = paddingValue;
    }
  }
  
  if (margin && theme.spacing[margin]) {
    const marginValue = getSpacing(theme.spacing[margin]);
    dynamicStyles.margin = marginValue;
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <StatusBar
          barStyle={finalStatusBarStyle}
          backgroundColor={statusBarBackgroundColor || backgroundColor}
        />
      )}
      {Platform.OS === 'android' && (
        <StatusBar
          barStyle={finalStatusBarStyle}
          backgroundColor={statusBarBackgroundColor || backgroundColor}
          translucent={false}
        />
      )}
      <SafeAreaView style={[dynamicStyles, style]} {...otherProps} />
    </>
  );
}