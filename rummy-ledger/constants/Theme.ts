/**
 * Rummy Ledger Theme System
 * Comprehensive design system with spacing, typography, and responsive utilities
 */

import { Dimensions, PixelRatio } from 'react-native';
import { Colors } from './Colors';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 8px grid system - all spacing should be multiples of 8
export const spacing = {
  xs: 4,   // 0.5 * base
  sm: 8,   // 1 * base
  md: 16,  // 2 * base
  lg: 24,  // 3 * base
  xl: 32,  // 4 * base
  xxl: 48, // 6 * base
  xxxl: 64, // 8 * base
} as const;

// Typography system with large, clear fonts for optimal readability
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 48,
    display: 56,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Text styles for specific use cases
  styles: {
    // Headers
    h1: {
      fontSize: 32,
      lineHeight: 48,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      lineHeight: 36,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    
    // Body text
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    
    // Score display - extra large for readability
    scoreDisplay: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '700' as const,
    },
    scoreMedium: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    scoreSmall: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
    
    // Player names - clear and readable
    playerName: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    playerNameSmall: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
    
    // Buttons
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    buttonLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    
    // Labels and captions
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },
} as const;

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

// Shadow system
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Responsive breakpoints
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Device type detection
export const deviceType = {
  isSmallDevice: screenWidth < breakpoints.sm,
  isMediumDevice: screenWidth >= breakpoints.sm && screenWidth < breakpoints.md,
  isLargeDevice: screenWidth >= breakpoints.md && screenWidth < breakpoints.lg,
  isExtraLargeDevice: screenWidth >= breakpoints.lg,
  isTablet: screenWidth >= breakpoints.md,
  isPhone: screenWidth < breakpoints.md,
} as const;

// Responsive utilities
export const responsive = {
  // Get responsive value based on screen size
  getValue: <T>(values: {
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    default: T;
  }): T => {
    if (screenWidth >= breakpoints.xl && values.xl !== undefined) return values.xl;
    if (screenWidth >= breakpoints.lg && values.lg !== undefined) return values.lg;
    if (screenWidth >= breakpoints.md && values.md !== undefined) return values.md;
    if (screenWidth >= breakpoints.sm && values.sm !== undefined) return values.sm;
    return values.default;
  },
  
  // Get font size based on device with accessibility considerations
  getFontSize: (baseSize: number): number => {
    const scale = PixelRatio.getFontScale();
    let deviceScale = 1;
    
    if (deviceType.isSmallDevice) {
      deviceScale = 0.9;
    } else if (deviceType.isTablet) {
      deviceScale = 1.1;
    }
    
    const scaledSize = baseSize * deviceScale * scale;
    
    // Ensure minimum readable size and prevent excessive scaling
    const minSize = deviceType.isSmallDevice ? 12 : 14;
    const maxSize = baseSize * 1.5;
    
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  },
  
  // Get spacing based on device
  getSpacing: (baseSpacing: number): number => {
    if (deviceType.isSmallDevice) {
      return Math.max(baseSpacing * 0.8, 4);
    }
    if (deviceType.isTablet) {
      return baseSpacing * 1.2;
    }
    return baseSpacing;
  },
  
  // Get touch target size with accessibility compliance
  getTouchTarget: (size: keyof typeof touchTargets = 'medium'): number => {
    const baseSize = touchTargets[size];
    let adjustedSize = baseSize;
    
    if (deviceType.isTablet) {
      adjustedSize = Math.max(baseSize, touchTargets.medium);
    }
    
    // Ensure minimum 44px for accessibility
    return Math.max(44, adjustedSize);
  },
  
  // Get responsive padding/margin
  getPadding: (size: keyof typeof spacing): number => {
    return responsive.getSpacing(spacing[size]);
  },
  
  // Check if device supports advanced features
  supportsAdvancedFeatures: (): boolean => {
    return !deviceType.isSmallDevice;
  },
} as const;

// Touch target sizes (minimum 44px for accessibility)
export const touchTargets = {
  small: 32,
  medium: 44,
  large: 56,
  extraLarge: 72,
} as const;

// Animation durations with device-based adjustments
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  
  // Get animation duration based on device performance
  getDuration: (baseMs: number): number => {
    if (deviceType.isSmallDevice) {
      return Math.max(150, baseMs * 0.8);
    }
    if (deviceType.isTablet) {
      return baseMs * 1.1;
    }
    return baseMs;
  },
} as const;

// Layout utilities
export const layout = {
  // Container max widths for different breakpoints
  maxWidth: {
    sm: breakpoints.sm - 32,
    md: breakpoints.md - 64,
    lg: breakpoints.lg - 96,
    xl: breakpoints.xl - 128,
  },
  
  // Common layout patterns
  centerContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },
  
  spaceAround: {
    justifyContent: 'space-around' as const,
  },
  
  // Flex utilities
  flex: {
    row: { flexDirection: 'row' as const },
    column: { flexDirection: 'column' as const },
    wrap: { flexWrap: 'wrap' as const },
    nowrap: { flexWrap: 'nowrap' as const },
  },
} as const;

// Accessibility utilities
export const accessibility = {
  // Minimum touch target size (44px as per WCAG guidelines)
  minTouchTarget: 44,
  
  // High contrast ratios
  contrastRatios: {
    normal: 4.5,
    large: 3,
    enhanced: 7,
  },
  
  // Focus indicators
  focusIndicator: {
    width: 2,
    style: 'solid' as const,
    offset: 2,
  },
} as const;

// Complete theme object
export const theme = {
  colors: Colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  deviceType,
  responsive,
  touchTargets,
  animations,
  layout,
  accessibility,
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';