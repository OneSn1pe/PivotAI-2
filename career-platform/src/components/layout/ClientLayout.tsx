'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Determine if we're in development mode
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// Safer dynamic import with explicit error handling
const safeImport = (path: string) => {
  return dynamic(
    () => import(path)
      .then(mod => mod.default || (() => null))
      .catch(err => {
        console.error(`Error loading component ${path}:`, err);
        return () => null;
      }),
    { 
      ssr: false, 
      loading: () => null 
    }
  );
};

// Only import debug components in development mode
const ApiDebugger = isDev ? safeImport('@/components/debugger/ApiDebugger') : () => null;
const ErrorDebugger = isDev ? safeImport('@/components/debugger/ErrorDebugger') : () => null;
const ApiTester = isDev ? safeImport('@/components/debugger/ApiTester') : () => null;
const DiagnosticTools = isDev ? safeImport('@/components/debugger/DiagnosticTools') : () => null;

// Debug Panel Component - only rendered in development
function DebugPanel({ visible }: { visible: boolean }) {
  // Skip all processing if not visible or not in development
  if (!visible || !isDev || typeof window === 'undefined') return null;

  const [networkStatus, setNetworkStatus] = useState<{ online: boolean; latency: number | null }>({
    online: typeof navigator !== 'undefined' ? navigator?.onLine ?? true : true,
    latency: null
  });
  const [apiStatus, setApiStatus] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    
    // Monitor online status
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ping server for latency test every 30 seconds - but only when expanded
    const checkLatency = async () => {
      if (!expanded) return;
      
      try {
        const start = performance.now();
        await fetch('/api/debug-test');
        const end = performance.now();
        setNetworkStatus(prev => ({ ...prev, latency: Math.round(end - start) }));
      } catch (e) {
        console.error('Latency check failed:', e);
        setNetworkStatus(prev => ({ ...prev, latency: null }));
      }
    };

    // Check API statuses - but only when expanded
    const checkApiStatus = async () => {
      if (!expanded) return;
      
      try {
        const response = await fetch('/api/debug-info');
        const data = await response.json();
        setApiStatus(data);
      } catch (e) {
        console.error('API status check failed:', e);
      }
    };

    // Initial checks - only if expanded
    if (expanded) {
      checkLatency();
      checkApiStatus();
    }

    // Set up intervals
    const latencyInterval = setInterval(checkLatency, 30000);
    const apiStatusInterval = setInterval(checkApiStatus, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(latencyInterval);
      clearInterval(apiStatusInterval);
    };
  }, [visible, expanded]);

  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-2 text-xs z-50 shadow-lg">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">Debug Mode</span>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          {expanded ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-1 ${networkStatus.online ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{networkStatus.online ? 'Online' : 'Offline'}</span>
        </div>
        
        {networkStatus.latency !== null && (
          <div>
            <span className="text-gray-400 mr-1">Latency:</span>
            <span className={networkStatus.latency > 200 ? 'text-red-400' : 'text-green-400'}>
              {networkStatus.latency}ms
            </span>
          </div>
        )}
        
        <div>
          <a href="/debug" className="text-blue-400 hover:underline">Debug Tools</a>
        </div>
      </div>
      
      {expanded && apiStatus.data && (
        <div className="mt-2 max-h-40 overflow-auto">
          <div className="font-bold mb-1">API Routes:</div>
          <div className="grid gap-1">
            {apiStatus.data.routes && apiStatus.data.routes.apiRoutes && apiStatus.data.routes.apiRoutes.map((route: string) => {
              const fileCheck = apiStatus.data.routeFiles && apiStatus.data.routeFiles.find((f: any) => f.route === route);
              return (
                <div key={route} className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1 ${fileCheck?.fileExists ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>{route}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientLayout() {
  // Skip rendering all debug components in production
  if (!isDev) {
    return null;
  }
  
  // Use error boundary pattern to prevent rendering errors
  try {
    return (
      <>
        {/* Safety wrapper for each debugger component */}
        <div className="debug-wrapper">
          <React.Suspense fallback={null}>
            <ApiDebugger />
          </React.Suspense>
        </div>
        
        <div className="debug-wrapper">
          <React.Suspense fallback={null}>
            <ErrorDebugger />
          </React.Suspense>
        </div>
        
        <div className="debug-wrapper">
          <React.Suspense fallback={null}>
            <ApiTester />
          </React.Suspense>
        </div>
        
        <div className="debug-wrapper">
          <React.Suspense fallback={null}>
            <DiagnosticTools />
          </React.Suspense>
        </div>
          
        <div className="debug-wrapper">
          <React.Suspense fallback={null}>
            <DebugPanel visible={isDev} />
          </React.Suspense>
        </div>
      </>
    );
  } catch (err) {
    console.error("Error rendering ClientLayout:", err);
    return null;
  }
} 