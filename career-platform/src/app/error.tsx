'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong!</h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. The development team has been notified.
        </p>
        <div className="bg-gray-100 p-3 rounded-lg mb-6 text-left">
          <p className="text-sm font-mono text-gray-700 break-words">{error.message}</p>
          {error.digest && (
            <p className="text-xs font-mono text-gray-500 mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 