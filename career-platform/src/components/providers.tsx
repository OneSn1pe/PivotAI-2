'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';
import ClientLayout from './layout/ClientLayout';
import { CSSLoadHandler } from './CSSLoadHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GameProvider>
        <CSSLoadHandler />
        {children}
        <ClientLayout />
      </GameProvider>
    </AuthProvider>
  );
} 