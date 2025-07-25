import { InteractionManager } from 'react-native';

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();
  private static isEnabled = __DEV__ || process.env.ENABLE_PERFORMANCE_MONITORING === 'true';

  static startMeasurement(name: string): void {
    if (!this.isEnabled) return;
    this.measurements.set(name, Date.now());
  }

  static endMeasurement(name: string): number | null {
    if (!this.isEnabled) return null;
    
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`Performance measurement '${name}' was not started`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.measurements.delete(name);
    
    if (__DEV__) {
      console.log(`⏱️ Performance: ${name} took ${duration}ms`);
    }

    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startMeasurement(name);
    return fn().finally(() => {
      this.endMeasurement(name);
    });
  }

  static measureSync<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    this.startMeasurement(name);
    try {
      return fn();
    } finally {
      this.endMeasurement(name);
    }
  }

  static runAfterInteractions<T>(fn: () => T): Promise<T> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(fn());
      });
    });
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static getMemoryUsage(): {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory;
    }
    return {};
  }

  static logMemoryUsage(label: string = 'Memory Usage'): void {
    if (!this.isEnabled) return;

    const memory = this.getMemoryUsage();
    if (memory.usedJSHeapSize) {
      console.log(`📊 ${label}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }
}

// Bundle size optimization utilities
export const LazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(() => 
    PerformanceMonitor.measureAsync('LazyComponent', importFn)
  );
};

// Animation performance helpers
export const optimizeAnimation = {
  useNativeDriver: true,
  duration: 300,
  easing: 'ease-out' as const,
};

export const highPerformanceAnimationConfig = {
  useNativeDriver: true,
  duration: 200,
  tension: 100,
  friction: 8,
};