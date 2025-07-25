/**
 * Responsive Design Hook
 * Provides responsive utilities and device information
 */

import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface ResponsiveInfo {
  width: number;
  height: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  deviceType: 'phone-small' | 'phone' | 'tablet' | 'desktop';
}

export function useResponsive() {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const getDeviceType = (): ResponsiveInfo['deviceType'] => {
    if (dimensions.width < theme.breakpoints.sm) {
      return 'phone-small';
    } else if (dimensions.width < theme.breakpoints.md) {
      return 'phone';
    } else if (dimensions.width < theme.breakpoints.lg) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  };

  const deviceType = getDeviceType();
  const isLandscape = dimensions.width > dimensions.height;

  const responsiveInfo: ResponsiveInfo = {
    width: dimensions.width,
    height: dimensions.height,
    isSmallDevice: deviceType === 'phone-small',
    isMediumDevice: deviceType === 'phone',
    isLargeDevice: deviceType === 'tablet' || deviceType === 'desktop',
    isTablet: deviceType === 'tablet' || deviceType === 'desktop',
    isPhone: deviceType === 'phone-small' || deviceType === 'phone',
    isLandscape,
    deviceType,
  };

  // Get responsive value based on current device
  const getValue = <T>(values: {
    phoneSmall?: T;
    phone?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }): T => {
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

  // Get responsive font size
  const getFontSize = (baseSize: number): number => {
    return theme.responsive.getFontSize(baseSize);
  };

  // Get responsive spacing
  const getSpacing = (baseSpacing: number): number => {
    return theme.responsive.getSpacing(baseSpacing);
  };

  // Get responsive touch target
  const getTouchTarget = (size: 'small' | 'medium' | 'large' = 'medium'): number => {
    return theme.responsive.getTouchTarget(size);
  };

  // Create responsive styles
  const createStyles = <T extends Record<string, any>>(
    styleCreator: (info: ResponsiveInfo) => T
  ): T => {
    return styleCreator(responsiveInfo);
  };

  return {
    ...responsiveInfo,
    getValue,
    getFontSize,
    getSpacing,
    getTouchTarget,
    createStyles,
    breakpoints: theme.breakpoints,
  };
}

// Hook for getting responsive values without full responsive info
export function useResponsiveValue<T>(values: {
  phoneSmall?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { getValue } = useResponsive();
  return getValue(values);
}

// Hook for getting responsive spacing
export function useResponsiveSpacing(baseSpacing: number): number {
  const { getSpacing } = useResponsive();
  return getSpacing(baseSpacing);
}

// Hook for getting responsive font size
export function useResponsiveFontSize(baseSize: number): number {
  const { getFontSize } = useResponsive();
  return getFontSize(baseSize);
}