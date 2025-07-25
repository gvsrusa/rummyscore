/**
 * Keyboard Navigation View
 * Provides keyboard navigation support for accessibility
 */

import React, { useRef, useEffect, ReactNode } from 'react';
import {
  View,
  ViewProps,
  Platform,
  findNodeHandle,
  AccessibilityInfo,
} from 'react-native';
import { useAccessibility } from '@/src/services/AccessibilityService';

export interface KeyboardNavigationViewProps extends ViewProps {
  children: ReactNode;
  focusable?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  navigationOrder?: number;
}

export function KeyboardNavigationView({
  children,
  focusable = true,
  autoFocus = false,
  onFocus,
  onBlur,
  navigationOrder,
  ...viewProps
}: KeyboardNavigationViewProps) {
  const viewRef = useRef<View>(null);
  const { isScreenReaderEnabled } = useAccessibility();

  // Auto focus when component mounts if requested
  useEffect(() => {
    if (autoFocus && focusable && isScreenReaderEnabled) {
      const timer = setTimeout(() => {
        setFocus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, focusable, isScreenReaderEnabled]);

  const setFocus = () => {
    if (viewRef.current && isScreenReaderEnabled) {
      const reactTag = findNodeHandle(viewRef.current);
      if (reactTag) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
        onFocus?.();
      }
    }
  };

  const handleFocus = () => {
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <View
      ref={viewRef}
      {...viewProps}
      accessible={focusable}
      accessibilityElementsHidden={!focusable}
      importantForAccessibility={focusable ? 'yes' : 'no-hide-descendants'}
      onAccessibilityTap={handleFocus}
      onAccessibilityEscape={handleBlur}
      // Enhanced keyboard navigation support
      {...(Platform.OS === 'web' && {
        tabIndex: focusable ? (navigationOrder || 0) : -1,
        onFocus: handleFocus,
        onBlur: handleBlur,
      })}
    >
      {children}
    </View>
  );
}

/**
 * Hook for managing keyboard navigation within a container
 */
export function useKeyboardNavigation(items: Array<{ id: string; ref: React.RefObject<any> }>) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { isScreenReaderEnabled } = useAccessibility();

  const focusItem = (index: number) => {
    if (index >= 0 && index < items.length && isScreenReaderEnabled) {
      const item = items[index];
      if (item.ref.current) {
        const reactTag = findNodeHandle(item.ref.current);
        if (reactTag) {
          AccessibilityInfo.setAccessibilityFocus(reactTag);
          setCurrentIndex(index);
        }
      }
    }
  };

  const focusNext = () => {
    const nextIndex = (currentIndex + 1) % items.length;
    focusItem(nextIndex);
  };

  const focusPrevious = () => {
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    focusItem(prevIndex);
  };

  const focusFirst = () => {
    focusItem(0);
  };

  const focusLast = () => {
    focusItem(items.length - 1);
  };

  return {
    currentIndex,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}