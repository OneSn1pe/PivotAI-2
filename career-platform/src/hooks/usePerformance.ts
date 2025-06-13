import { useCallback, useRef, useEffect } from 'react';

// Throttle hook - limits function calls to once per specified delay
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      return fn(...args);
    } else {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        lastCall.current = Date.now();
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  }, [fn, delay]) as T;
}

// Debounce hook - delays function call until after specified delay of inactivity
export function useDebounceCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]) as T;
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const renderTime = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      renderTime.current = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] Render #${renderCount.current}: ${renderTime.current.toFixed(2)}ms`);
      }
    };
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: renderTime.current
  };
}

// Memory leak prevention hook
export function useUnmountCleanup() {
  const cleanupFns = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((fn: () => void) => {
    cleanupFns.current.push(fn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFns.current.forEach(fn => fn());
      cleanupFns.current = [];
    };
  }, []);

  return addCleanup;
}