'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-xl w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-gray-700 mb-4">Something went wrong loading the application.</p>
          <p className="text-gray-500 text-sm font-mono bg-gray-100 p-2 rounded">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  try {
    return <AuthProvider>{children}</AuthProvider>;
  } catch (e) {
    if (e instanceof Error) {
      setError(e);
    } else {
      setError(new Error('Unknown error occurred'));
    }
    return null;
  }
}
