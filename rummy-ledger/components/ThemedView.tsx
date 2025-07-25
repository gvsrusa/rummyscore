import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  backgroundColor?: keyof ReturnType<typeof useTheme>['colors'];
  padding?: keyof typeof import('@/constants/Theme').spacing;
  margin?: keyof typeof import('@/constants/Theme').spacing;
  borderRadius?: keyof typeof import('@/constants/Theme').borderRadius;
  shadow?: keyof typeof import('@/constants/Theme').shadows;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  backgroundColor: backgroundColorKey,
  padding,
  margin,
  borderRadius,
  shadow,
  ...otherProps
}: ThemedViewProps) {
  const { colors, theme } = useTheme();
  
  // Determine background color
  let backgroundColor = colors.background;
  if (lightColor || darkColor) {
    backgroundColor = theme.colorScheme === 'light' ? (lightColor || colors.background) : (darkColor || colors.background);
  } else if (backgroundColorKey && colors[backgroundColorKey]) {
    backgroundColor = colors[backgroundColorKey] as string;
  }

  // Build dynamic styles
  const dynamicStyles: any = { backgroundColor };
  
  if (padding && theme.spacing[padding]) {
    const paddingValue = theme.responsive.getSpacing(theme.spacing[padding]);
    dynamicStyles.padding = paddingValue;
  }
  
  if (margin && theme.spacing[margin]) {
    const marginValue = theme.responsive.getSpacing(theme.spacing[margin]);
    dynamicStyles.margin = marginValue;
  }
  
  if (borderRadius && theme.borderRadius[borderRadius]) {
    dynamicStyles.borderRadius = theme.borderRadius[borderRadius];
  }
  
  if (shadow && theme.shadows[shadow]) {
    Object.assign(dynamicStyles, theme.shadows[shadow]);
    dynamicStyles.shadowColor = colors.text;
  }

  return <View style={[dynamicStyles, style]} {...otherProps} />;
}
