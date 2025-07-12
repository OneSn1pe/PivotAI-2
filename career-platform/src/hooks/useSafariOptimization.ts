'use client';

import { useEffect, useState } from 'react';

export const useSafariOptimization = () => {
  const [isSafari, setIsSafari] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Detect Safari
    const safariDetected = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(safariDetected);

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleMotionPreference = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionPreference);

    // Simple performance check
    const checkPerformance = () => {
      // Check if device has low memory (Safari specific)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory && memory < 4) {
          setIsLowPerformance(true);
        }
      }

      // Check connection speed
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
          setIsLowPerformance(true);
        }
      }
    };

    checkPerformance();

    return () => {
      mediaQuery.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  return {
    isSafari,
    reduceMotion,
    isLowPerformance,
    shouldReduceAnimations: isSafari || reduceMotion || isLowPerformance
  };
};