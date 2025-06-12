'use client';

import React from 'react';
import { DebugMenu } from '@/components/debug/DebugMenu';

export default function ClientLayout() {
  return (
    <>
      {/* Debug Menu - Only shows in development */}
      <DebugMenu />
    </>
  );
} 