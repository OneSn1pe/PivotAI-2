'use client';

import { useEffect } from 'react';

export function CSSLoadHandler() {
  useEffect(() => {
    // Mark body as loaded once React hydrates
    document.body.classList.add('loaded');
    
    // Also handle font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }
  }, []);

  return null;
}