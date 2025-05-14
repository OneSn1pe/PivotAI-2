import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
        
        {/* Cloud wisps animation */}
        <div className="absolute -top-4 -left-4 cloud-sm opacity-30 animate-float-fast"></div>
        <div className="absolute -bottom-2 -right-4 cloud-sm opacity-20 animate-float-medium"></div>
      </div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  );
} 