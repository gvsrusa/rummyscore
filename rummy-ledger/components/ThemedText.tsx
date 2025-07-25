import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 
    | 'default' 
    | 'h1' 
    | 'h2' 
    | 'h3' 
    | 'body' 
    | 'bodyLarge' 
    | 'bodySmall'
    | 'scoreDisplay'
    | 'scoreMedium'
    | 'scoreSmall'
    | 'playerName'
    | 'playerNameSmall'
    | 'button'
    | 'buttonLarge'
    | 'label'
    | 'caption'
    | 'link';
  color?: keyof ReturnType<typeof useTheme>['colors'];
  responsive?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  color: colorKey,
  responsive = true,
  ...rest
}: ThemedTextProps) {
  const { colors, theme } = useTheme();
  
  // Determine text color
  let textColor = colors.text;
  if (lightColor || darkColor) {
    textColor = theme.colorScheme === 'light' ? (lightColor || colors.text) : (darkColor || colors.text);
  } else if (colorKey && colors[colorKey]) {
    textColor = colors[colorKey] as string;
  }

  // Get typography style
  const getTypographyStyle = () => {
    const baseStyle = type === 'default' ? theme.typography.styles.body : theme.typography.styles[type as keyof typeof theme.typography.styles];
    
    if (!baseStyle) return theme.typography.styles.body;
    
    if (responsive) {
      return {
        ...baseStyle,
        fontSize: theme.responsive.getFontSize(baseStyle.fontSize),
      };
    }
    
    return baseStyle;
  };

  const typographyStyle = getTypographyStyle();

  return (
    <Text
      style={[
        {
          color: textColor,
          ...typographyStyle,
        },
        style,
      ]}
      {...rest}
    />
  );
}
