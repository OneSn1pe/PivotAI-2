'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';
import ClientLayout from './layout/ClientLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure hydration happens after CSS is loaded
    const checkHydration = () => {
      // Check if CSS is loaded by verifying a known class
      const testEl = document.createElement('div');
      testEl.className = 'bg-gray-50';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const hasStyles = computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                       computed.backgroundColor !== 'transparent';
      document.body.removeChild(testEl);

      if (hasStyles) {
        setIsHydrated(true);
      } else {
        // Retry after a short delay
        setTimeout(checkHydration, 50);
      }
    };

    checkHydration();
  }, []);

  // Prevent hydration mismatch by ensuring consistent rendering
  if (!isHydrated) {
    return (
      <div style={{ opacity: 0, visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <AuthProvider>
      <GameProvider>
        {children}
        <ClientLayout />
      </GameProvider>
    </AuthProvider>
  );
}