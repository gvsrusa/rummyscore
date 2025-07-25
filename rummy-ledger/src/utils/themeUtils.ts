/**
 * Theme Utilities
 * Helper functions for working with themes and responsive design
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';
import { theme } from '@/constants/Theme';

// Get current device dimensions
export const getDeviceDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Get screen dimensions including safe areas
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('screen');
  return { width, height };
};

// Check if device is in landscape mode
export const isLandscape = () => {
  const { width, height } = getDeviceDimensions();
  return width > height;
};

// Get device type based on screen size
export const getDeviceType = () => {
  const { width } = getDeviceDimensions();
  
  if (width < theme.breakpoints.sm) {
    return 'phone-small';
  } else if (width < theme.breakpoints.md) {
    return 'phone';
  } else if (width < theme.breakpoints.lg) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Get responsive value based on device type
export const getResponsiveValue = <T>(values: {
  phoneSmall?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'phone-small':
      return values.phoneSmall ?? values.phone ?? values.default;
    case 'phone':
      return values.phone ?? values.default;
    case 'tablet':
      return values.tablet ?? values.default;
    case 'desktop':
      return values.desktop ?? values.tablet ?? values.default;
    default:
      return values.default;
  }
};

// Get responsive font size with accessibility considerations
export const getResponsiveFontSize = (baseFontSize: number): number => {
  const fontScale = PixelRatio.getFontScale();
  const deviceType = getDeviceType();
  
  let scaleFactor = 1;
  
  // Adjust for device type
  switch (deviceType) {
    case 'phone-small':
      scaleFactor = 0.9;
      break;
    case 'phone':
      scaleFactor = 1;
      break;
    case 'tablet':
      scaleFactor = 1.1;
      break;
    case 'desktop':
      scaleFactor = 1.2;
      break;
  }
  
  // Apply font scale from system accessibility settings
  const scaledSize = baseFontSize * scaleFactor * fontScale;
  
  // Ensure minimum readable size
  const minSize = deviceType === 'phone-small' ? 12 : 14;
  const maxSize = baseFontSize * 1.5; // Prevent excessive scaling
  
  return Math.max(minSize, Math.min(maxSize, scaledSize));
};

// Get responsive spacing with device considerations
export const getResponsiveSpacing = (baseSpacing: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'phone-small':
      return Math.max(4, baseSpacing * 0.8);
    case 'phone':
      return baseSpacing;
    case 'tablet':
      return baseSpacing * 1.2;
    case 'desktop':
      return baseSpacing * 1.4;
    default:
      return baseSpacing;
  }
};

// Get touch target size based on device and accessibility
export const getTouchTargetSize = (size: 'small' | 'medium' | 'large' = 'medium'): number => {
  const deviceType = getDeviceType();
  const baseSizes = {
    small: theme.touchTargets.small,
    medium: theme.touchTargets.medium,
    large: theme.touchTargets.large,
  };
  
  let baseSize = baseSizes[size];
  
  // Adjust for device type
  if (deviceType === 'tablet' || deviceType === 'desktop') {
    baseSize = Math.max(baseSize, theme.touchTargets.medium);
  }
  
  // Ensure minimum accessibility requirements (44px)
  return Math.max(44, baseSize);
};

// Get platform-specific styles
export const getPlatformStyles = () => {
  return {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    
    // Platform-specific shadow styles
    shadow: Platform.select({
      ios: theme.shadows.md,
      android: { elevation: theme.shadows.md.elevation },
      default: theme.shadows.md,
    }),
    
    // Platform-specific border radius
    borderRadius: Platform.select({
      ios: theme.borderRadius.md,
      android: theme.borderRadius.sm,
      default: theme.borderRadius.md,
    }),
  };
};

// Create responsive style object
export const createResponsiveStyle = <T extends Record<string, any>>(
  styles: {
    phoneSmall?: T;
    phone?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }
): T => {
  return getResponsiveValue(styles);
};

// Get safe area padding for different edges
export const getSafeAreaPadding = (edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom']) => {
  // This would typically use react-native-safe-area-context
  // For now, return estimated values based on device type
  const deviceType = getDeviceType();
  const isIOS = Platform.OS === 'ios';
  
  const padding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  
  if (isIOS) {
    if (edges.includes('top')) {
      padding.top = deviceType === 'phone' ? 44 : 24;
    }
    if (edges.includes('bottom')) {
      padding.bottom = deviceType === 'phone' ? 34 : 0;
    }
  }
  
  return padding;
};

// Utility to create theme-aware styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: typeof theme, colors: typeof theme.colors.light) => T,
  colorScheme: 'light' | 'dark' = 'light'
): T => {
  const colors = theme.colors[colorScheme];
  return styleCreator(theme, colors);
};

// Animation duration based on device performance
export const getAnimationDuration = (baseMs: number): number => {
  const deviceType = getDeviceType();
  
  // Reduce animation duration on smaller devices for better performance
  switch (deviceType) {
    case 'phone-small':
      return Math.max(150, baseMs * 0.8);
    case 'phone':
      return baseMs;
    case 'tablet':
    case 'desktop':
      return baseMs * 1.1;
    default:
      return baseMs;
  }
};

// Check if device supports haptic feedback
export const supportsHaptics = (): boolean => {
  return Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 23);
};

// Get optimal image size for device
export const getOptimalImageSize = (baseSize: number): number => {
  const pixelRatio = PixelRatio.get();
  const deviceType = getDeviceType();
  
  let scaleFactor = pixelRatio;
  
  // Adjust for device type to prevent excessive memory usage
  if (deviceType === 'phone-small') {
    scaleFactor = Math.min(pixelRatio, 2);
  } else if (deviceType === 'tablet' || deviceType === 'desktop') {
    scaleFactor = Math.min(pixelRatio, 3);
  }
  
  return baseSize * scaleFactor;
};