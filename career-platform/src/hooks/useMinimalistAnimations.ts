import { useState, useCallback, useRef, useEffect } from 'react';

// Hook for subtle hover animations
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (ref.current) {
      ref.current.style.transform = 'translateY(-2px)';
      ref.current.style.transition = 'transform 200ms ease-out';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (ref.current) {
      ref.current.style.transform = 'translateY(0)';
    }
  }, []);

  return {
    ref,
    isHovered,
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}

// Hook for click animations
export function useClickAnimation() {
  const ref = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'scale(0.98)';
      ref.current.style.transition = 'transform 100ms ease-out';
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'scale(1)';
    }
  }, []);

  return {
    ref,
    clickProps: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp, // Reset if mouse leaves while pressed
    },
  };
}

// Hook for fade-in animation on mount
export function useFadeIn(delay = 0) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return {
    ref,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 200ms ease-out, transform 200ms ease-out',
    },
  };
}

// Hook for intersection observer (lazy loading)
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isInView };
}

// Hook for smooth count animation
export function useCountAnimation(end: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  return count;
}

// Hook for debounced value (for search inputs)
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}