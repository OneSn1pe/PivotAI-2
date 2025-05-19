'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/contexts/GameContext';
import dynamic from 'next/dynamic';

// Import client components with dynamic loading
const ClientLayout = dynamic(
  () => import('./layout/ClientLayout'),
  { ssr: false }
);

// Error boundary component for catching and displaying errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // In production we would log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service if configured
      try {
        // Simple error reporting with basic details to avoid timeouts
        const errorData = {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Only first 5 lines
          componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n') || 'No component stack available',
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        // Fire and forget error reporting to avoid blocking
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
          // Using keepalive to ensure the request completes even if user navigates away
          keepalive: true
        }).catch(e => console.error('Failed to report error:', e));
      } catch (reportingError) {
        console.error('Error during error reporting:', reportingError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-slate-700 mb-4">The application encountered an error. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring component
function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    try {
      // Report Web Vitals once they become available
      if ('performance' in window && 'getEntriesByType' in performance) {
        const reportWebVitals = () => {
          const entries = performance.getEntriesByType('navigation');
          if (entries.length > 0) {
            const navigationEntry = entries[0] as PerformanceNavigationTiming;
            
            // Collect basic performance metrics
            const metrics = {
              // DNS lookup time
              dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
              // TCP connection time
              tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
              // Time to first byte
              ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
              // DOM processing time
              dom: navigationEntry.domComplete - navigationEntry.responseEnd,
              // Total page load time
              load: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
              // Page URL path
              path: window.location.pathname
            };
            
            // Send metrics to backend - fire and forget
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metrics),
              keepalive: true
            }).catch(e => console.error('Failed to report metrics:', e));
          }
        };
        
        // Wait for load event to ensure metrics are available
        if (document.readyState === 'complete') {
          reportWebVitals();
        } else {
          window.addEventListener('load', reportWebVitals);
          return () => window.removeEventListener('load', reportWebVitals);
        }
      }
    } catch (error) {
      console.error('Error in performance monitoring:', error);
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GameProvider>
          {/* Performance monitoring in production */}
          {process.env.NODE_ENV === 'production' && <PerformanceMonitor />}
          {children}
        </GameProvider>
        <ClientLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
} 