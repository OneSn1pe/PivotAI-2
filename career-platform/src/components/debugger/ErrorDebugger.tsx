'use client';

import React, { useState, useEffect } from 'react';

interface ErrorLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  url?: string;
  method?: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  stack?: string;
}

// Global error logs storage
const errorLogs: ErrorLog[] = [];

// Original fetch to store for later restoration
let originalFetch: typeof fetch;

// Initialization function to be called at app start
export function initializeErrorDebugger() {
  if (typeof window === 'undefined') return; // Skip on server-side

  console.log('[ErrorDebugger] Initializing error debugger...');
  
  // Save original fetch
  originalFetch = window.fetch;

  // Override fetch to intercept and log requests/responses
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const startTime = Date.now();
    const requestHeaders = init?.headers ? Object.fromEntries(
      Object.entries(init.headers as Record<string, string>)
    ) : {};
    const requestBody = init?.body ? 
      (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : undefined;
    
    const errorLog: Partial<ErrorLog> = {
      id: `fetch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'fetch',
      url,
      method,
      requestHeaders,
      requestBody
    };
    
    try {
      // Make the actual fetch call
      const response = await originalFetch(input, init);
      
      // Clone the response so we can read the body
      const responseClone = response.clone();
      
      try {
        // Attempt to read response body
        const responseBody = await responseClone.text();
        
        errorLog.status = response.status;
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        errorLog.responseHeaders = responseHeaders;
        errorLog.responseBody = responseBody;
        errorLog.message = response.ok ? 'Success' : `HTTP Error ${response.status}`;
        
        // Only log actual errors
        if (!response.ok) {
          console.error(`[ErrorDebugger] Fetch error: ${url} returned ${response.status}`);
          errorLogs.push(errorLog as ErrorLog);
          triggerErrorEvent(errorLog as ErrorLog);
        }
      } catch (bodyError) {
        console.error('[ErrorDebugger] Failed to read response body', bodyError);
      }
      
      // Return the original response
      return response;
    } catch (error: any) {
      // Handle network errors
      errorLog.message = error.message || 'Network Error';
      errorLog.stack = error.stack;
      console.error(`[ErrorDebugger] Fetch error: ${errorLog.message}`, error);
      errorLogs.push(errorLog as ErrorLog);
      triggerErrorEvent(errorLog as ErrorLog);
      throw error;
    }
  };

  // Monitor for unhandled errors and rejections
  window.addEventListener('error', (event) => {
    const errorLog: ErrorLog = {
      id: `js-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'javascript',
      message: event.message || 'Unknown error',
      stack: event.error?.stack
    };
    console.error('[ErrorDebugger] JavaScript error:', errorLog);
    errorLogs.push(errorLog);
    triggerErrorEvent(errorLog);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorLog: ErrorLog = {
      id: `promise-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'promise',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack
    };
    console.error('[ErrorDebugger] Unhandled rejection:', errorLog);
    errorLogs.push(errorLog);
    triggerErrorEvent(errorLog);
  });

  console.log('[ErrorDebugger] Error debugger initialized');
}

// Custom event for real-time error notifications
function triggerErrorEvent(error: ErrorLog) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('error-debugger', { detail: error });
    window.dispatchEvent(event);
  }
}

// Component to display error logs
export default function ErrorDebugger() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  useEffect(() => {
    // Initialize on component mount
    initializeErrorDebugger();
    
    // Initial load of existing logs
    setLogs([...errorLogs]);
    
    // Update logs when new errors occur
    const handleNewError = (event: any) => {
      setLogs(prev => [...prev, event.detail]);
    };
    
    window.addEventListener('error-debugger', handleNewError);
    
    // Toggle visibility with keyboard shortcut (Alt+E)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'e') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('error-debugger', handleNewError);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter logs based on selection
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  // Function to clear logs
  const clearLogs = () => {
    errorLogs.length = 0;
    setLogs([]);
    setSelectedLog(null);
  };

  // Function to perform a diagnostic test
  const runDiagnosticTest = async () => {
    try {
      // Test basic fetch functionality
      console.log('[ErrorDebugger] Running diagnostic: Basic fetch test');
      await fetch('/api/test', { method: 'GET' });
      
      // Test OPTIONS request for CORS
      console.log('[ErrorDebugger] Running diagnostic: OPTIONS preflight test');
      await fetch('/api/analyze-resume', { 
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      // Test analyze-resume endpoint with minimal payload
      console.log('[ErrorDebugger] Running diagnostic: Resume analysis test');
      await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeText: 'Test resume content' })
      });
      
      console.log('[ErrorDebugger] Diagnostic tests completed');
    } catch (error) {
      console.error('[ErrorDebugger] Diagnostic test failed:', error);
    }
  };
  
  // Generate diagnostic report
  const generateDiagnosticReport = () => {
    const environment = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      apiBase: window.location.origin
    };
    
    const report = {
      environment,
      errors: logs,
      totalErrors: logs.length,
      fetchErrors: logs.filter(log => log.type === 'fetch').length,
      jsErrors: logs.filter(log => log.type === 'javascript').length,
      promiseErrors: logs.filter(log => log.type === 'promise').length
    };
    
    // Create downloadable report
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString()}.json`;
    a.click();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-3/4 lg:w-2/3 h-2/3 bg-gray-900 text-white z-50 flex flex-col shadow-lg rounded-t-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Error Debugger (Alt+E to toggle)</h2>
        <div className="flex space-x-2">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="bg-gray-700 text-sm rounded px-2 py-1"
          >
            <option value="all">All Errors</option>
            <option value="fetch">Fetch Errors</option>
            <option value="javascript">JavaScript Errors</option>
            <option value="promise">Promise Rejections</option>
          </select>
          <button 
            onClick={runDiagnosticTest}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2 py-1 rounded"
          >
            Run Diagnostics
          </button>
          <button 
            onClick={generateDiagnosticReport}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-2 py-1 rounded"
          >
            Export Report
          </button>
          <button 
            onClick={clearLogs}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-2 py-1 rounded"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Error list */}
        <div className="w-1/3 overflow-y-auto border-r border-gray-700">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-gray-400">No errors captured yet</div>
          ) : (
            <ul>
              {filteredLogs.map(log => (
                <li 
                  key={log.id} 
                  className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${selectedLog?.id === log.id ? 'bg-gray-800' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`
                      ${log.type === 'fetch' ? 'text-yellow-400' : ''}
                      ${log.type === 'javascript' ? 'text-red-400' : ''}
                      ${log.type === 'promise' ? 'text-purple-400' : ''}
                      font-medium
                    `}>
                      {log.type === 'fetch' ? '🌐' : log.type === 'javascript' ? '⚠️' : '🔄'} {log.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm truncate mt-1">{log.message}</div>
                  {log.url && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {log.method} {new URL(log.url).pathname}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Right panel: Error details */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedLog ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Error Details</h3>
              
              <div className="mb-4">
                <div className="text-gray-400 text-sm">Type</div>
                <div>{selectedLog.type}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-gray-400 text-sm">Time</div>
                <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-gray-400 text-sm">Message</div>
                <div className="bg-gray-800 p-2 rounded">{selectedLog.message}</div>
              </div>
              
              {selectedLog.url && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">URL</div>
                  <div className="bg-gray-800 p-2 rounded break-all">{selectedLog.url}</div>
                </div>
              )}
              
              {selectedLog.method && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Method</div>
                  <div>{selectedLog.method}</div>
                </div>
              )}
              
              {selectedLog.status !== undefined && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Status</div>
                  <div className={`
                    ${selectedLog.status < 300 ? 'text-green-400' : ''}
                    ${selectedLog.status >= 300 && selectedLog.status < 400 ? 'text-yellow-400' : ''}
                    ${selectedLog.status >= 400 ? 'text-red-400' : ''}
                  `}>
                    {selectedLog.status}
                  </div>
                </div>
              )}
              
              {selectedLog.requestHeaders && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Request Headers</div>
                  <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.requestBody && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Request Body</div>
                  <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                    {selectedLog.requestBody}
                  </pre>
                </div>
              )}
              
              {selectedLog.responseHeaders && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Response Headers</div>
                  <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.responseHeaders, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.responseBody && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Response Body</div>
                  <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32">
                    {selectedLog.responseBody}
                  </pre>
                </div>
              )}
              
              {selectedLog.stack && (
                <div className="mb-4">
                  <div className="text-gray-400 text-sm">Stack Trace</div>
                  <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Select an error from the list to view details</p>
                <button 
                  onClick={runDiagnosticTest}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Run Diagnostic Tests
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 