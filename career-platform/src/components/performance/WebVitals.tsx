'use client';

import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Log Web Vitals to console in development
    if (process.env.NODE_ENV === 'development') {
      onCLS(console.log);
      onFID(console.log);
      onFCP(console.log);
      onLCP(console.log);
      onTTFB(console.log);
      onINP(console.log);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      const sendToAnalytics = (metric: any) => {
        // Replace with your analytics endpoint
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
          });
        }
      };

      onCLS(sendToAnalytics);
      onFID(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics);
    }
  }, []);

  return null;
}