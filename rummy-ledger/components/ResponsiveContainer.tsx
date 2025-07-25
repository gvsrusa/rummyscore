/**
 * Responsive Container Component
 * Provides responsive layout utilities with enhanced device support
 */

import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: number | 'sm' | 'md' | 'lg' | 'xl';
  centerContent?: boolean;
  padding?: keyof typeof import('@/constants/Theme').spacing;
  margin?: keyof typeof import('@/constants/Theme').spacing;
  style?: ViewStyle;
  breakpoint?: 'phoneSmall' | 'phone' | 'tablet' | 'desktop';
}

export function ResponsiveContainer({
  children,
  maxWidth,
  centerContent = false,
  padding = 'md',
  margin,
  style,
  breakpoint,
}: ResponsiveContainerProps) {
  const { theme } = useTheme();
  const { getSpacing, deviceType } = useResponsive();
  
  // Hide content if breakpoint doesn't match
  if (breakpoint && deviceType !== breakpoint) {
    return null;
  }
  
  const containerStyle: ViewStyle = {
    width: '100%',
    ...(centerContent && { alignSelf: 'center' }),
  };
  
  // Handle maxWidth
  if (maxWidth) {
    if (typeof maxWidth === 'number') {
      containerStyle.maxWidth = maxWidth;
    } else {
      containerStyle.maxWidth = theme.layout.maxWidth[maxWidth];
    }
  }
  
  if (padding && theme.spacing[padding]) {
    containerStyle.padding = getSpacing(theme.spacing[padding]);
  }
  
  if (margin && theme.spacing[margin]) {
    containerStyle.margin = getSpacing(theme.spacing[margin]);
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

interface ResponsiveRowProps {
  children: ReactNode;
  spacing?: keyof typeof import('@/constants/Theme').spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: ViewStyle;
  reverseOnSmall?: boolean;
}

export function ResponsiveRow({
  children,
  spacing = 'sm',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
  reverseOnSmall = false,
}: ResponsiveRowProps) {
  const { theme } = useTheme();
  const { getSpacing, isSmallDevice } = useResponsive();
  
  const rowStyle: ViewStyle = {
    flexDirection: (reverseOnSmall && isSmallDevice) ? 'column' : 'row',
    alignItems: align,
    justifyContent: justify,
    ...(wrap && { flexWrap: 'wrap' }),
  };
  
  if (spacing && theme.spacing[spacing]) {
    rowStyle.gap = getSpacing(theme.spacing[spacing]);
  }

  return (
    <View style={[rowStyle, style]}>
      {children}
    </View>
  );
}

interface ResponsiveColumnProps {
  children: ReactNode;
  spacing?: keyof typeof import('@/constants/Theme').spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  style?: ViewStyle;
  reverseOnLarge?: boolean;
}

export function ResponsiveColumn({
  children,
  spacing = 'sm',
  align = 'stretch',
  justify = 'flex-start',
  style,
  reverseOnLarge = false,
}: ResponsiveColumnProps) {
  const { theme } = useTheme();
  const { getSpacing, isTablet } = useResponsive();
  
  const columnStyle: ViewStyle = {
    flexDirection: (reverseOnLarge && isTablet) ? 'row' : 'column',
    alignItems: align,
    justifyContent: justify,
  };
  
  if (spacing && theme.spacing[spacing]) {
    columnStyle.gap = getSpacing(theme.spacing[spacing]);
  }

  return (
    <View style={[columnStyle, style]}>
      {children}
    </View>
  );
}

// Grid component for responsive layouts
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    phoneSmall?: number;
    phone?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  spacing?: keyof typeof import('@/constants/Theme').spacing;
  style?: ViewStyle;
}

export function ResponsiveGrid({
  children,
  columns = { default: 2 },
  spacing = 'md',
  style,
}: ResponsiveGridProps) {
  const { theme } = useTheme();
  const { getSpacing, getValue } = useResponsive();
  
  const numColumns = getValue(columns);
  const gap = getSpacing(theme.spacing[spacing]);
  
  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap,
  };
  
  const childWidth = `${(100 / numColumns)}%`;
  
  return (
    <View style={[gridStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ width: childWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}