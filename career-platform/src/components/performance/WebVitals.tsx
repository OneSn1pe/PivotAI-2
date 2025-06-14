'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const logMetric = (metric: Metric) => {
      // Log Web Vitals to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(metric);
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        });

        // Use sendBeacon if available, fallback to fetch
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/web-vitals', body);
        } else {
          fetch('/api/analytics/web-vitals', {
            body,
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {
            // Silently fail - analytics shouldn't break the app
          });
        }
      }
    };

    // Register web vitals
    onCLS(logMetric);
    onFCP(logMetric);
    onLCP(logMetric);
    onTTFB(logMetric);
    onINP(logMetric);
  }, []);

  return null;
}