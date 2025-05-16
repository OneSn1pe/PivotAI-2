import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative">
        {/* Main spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-4 border-t-purple-700 mb-4"></div>
        
        {/* Fantasy decoration elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 text-purple-700 animate-pulse">⚡</div>
        </div>
        
        {/* Orbiting stars */}
        <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-amber-500 text-xs">✦</div>
        </div>
        <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
          <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-amber-500 text-xs">✦</div>
        </div>
        <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '3.5s' }}>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-amber-500 text-xs">✦</div>
        </div>
        <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}>
          <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-amber-500 text-xs">✦</div>
        </div>
      </div>
      <p className="text-slate-600 font-medium text-center">
        {message}
        <span className="inline-block animate-bounce ml-1">.</span>
        <span className="inline-block animate-bounce ml-0.5" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="inline-block animate-bounce ml-0.5" style={{ animationDelay: '0.4s' }}>.</span>
      </p>
    </div>
  );
} 