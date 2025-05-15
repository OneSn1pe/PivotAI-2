'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';
import dynamic from 'next/dynamic';

// Import client components with dynamic loading
const ClientLayout = dynamic(
  () => import('./layout/ClientLayout'),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GameProvider>
        {children}
      </GameProvider>
      <ClientLayout />
    </AuthProvider>
  );
} 