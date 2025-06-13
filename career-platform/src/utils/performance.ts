import { useEffect, useRef, useState } from 'react';

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Custom hook for lazy loading images with intersection observer
 */
export function useLazyLoadImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsInView(true);
            
            // Preload image
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(imageRef);

    return () => {
      observer.disconnect();
    };
  }, [imageRef, src, isLoaded]);

  return { imageSrc, setImageRef, isLoaded, isInView };
}

/**
 * Custom hook for prefetching data on hover
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const cacheRef = useRef<T | null>(null);

  const prefetch = async () => {
    if (cacheRef.current || isPrefetching) return;
    
    setIsPrefetching(true);
    try {
      const result = await fetchFn();
      cacheRef.current = result;
      setData(result);
    } catch (error) {
      console.error('Prefetch error:', error);
    } finally {
      setIsPrefetching(false);
    }
  };

  const getData = async () => {
    if (cacheRef.current) {
      return cacheRef.current;
    }
    return prefetch();
  };

  useEffect(() => {
    cacheRef.current = null;
  }, deps);

  return { prefetch, getData, data, isPrefetching };
}

/**
 * Memoized selector for complex calculations
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  let lastState: T;
  let lastResult: R;

  return (state: T): R => {
    if (state === lastState) {
      return lastResult;
    }

    const newResult = selector(state);
    
    if (equalityFn ? equalityFn(lastResult, newResult) : lastResult === newResult) {
      return lastResult;
    }

    lastState = state;
    lastResult = newResult;
    return newResult;
  };
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => {
        const start = Date.now();
        return setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          } as IdleDeadline);
        }, 1);
      };

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * Batch updates for better performance
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private isProcessing = false;
  private processor: (items: T[]) => void;
  private delay: number;
  private maxBatchSize: number;

  constructor(
    processor: (items: T[]) => void,
    delay = 100,
    maxBatchSize = 50
  ) {
    this.processor = processor;
    this.delay = delay;
    this.maxBatchSize = maxBatchSize;
  }

  add(item: T) {
    this.queue.push(item);
    
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.isProcessing) {
      this.scheduleProcess();
    }
  }

  private scheduleProcess() {
    this.isProcessing = true;
    
    requestIdleCallback(() => {
      this.flush();
    });
  }

  private flush() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    const items = this.queue.splice(0, this.maxBatchSize);
    this.processor(items);

    if (this.queue.length > 0) {
      setTimeout(() => this.scheduleProcess(), this.delay);
    } else {
      this.isProcessing = false;
    }
  }
}