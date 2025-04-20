'use client';

import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  details?: any;
}

export default function ApiDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Override console methods to capture logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Create a timestamp
    const getTimestamp = () => {
      const now = new Date();
      return now.toISOString();
    };

    // Custom console methods
    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, {
        timestamp: getTimestamp(),
        level: 'info',
        message,
        details: args.length > 1 ? args : args[0]
      }]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, {
        timestamp: getTimestamp(),
        level: 'error',
        message,
        details: args.length > 1 ? args : args[0]
      }]);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, {
        timestamp: getTimestamp(),
        level: 'warn',
        message,
        details: args.length > 1 ? args : args[0]
      }]);
    };

    // Track API calls using fetch
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Extract URL from input parameter regardless of its type
      const url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;
      
      console.log(`[API:REQUEST] ${init?.method || 'GET'} ${url}`);
      
      try {
        const response = await originalFetch(input, init);
        
        // Create a clone to read the body without consuming it
        const clonedResponse = response.clone();
        
        // Add response info to logs
        console.log(`[API:RESPONSE] ${response.status} ${url}`);
        
        try {
          // Try to read response as JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await clonedResponse.json();
            console.log(`[API:RESPONSE:BODY] ${url}`, json);
          }
        } catch (err) {
          console.warn(`[API:RESPONSE:PARSE_ERROR] ${url}`, err);
        }
        
        return response;
      } catch (error) {
        console.error(`[API:ERROR] ${url}`, error);
        throw error;
      }
    };

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.fetch = originalFetch;
    };
  }, []);

  // Show/hide debugger with keyboard shortcut (Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'api') return log.message.includes('[API:');
    return log.level === filter;
  });

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-1/2 h-1/3 bg-gray-900 text-white shadow-lg z-50 flex flex-col">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-2">
        <h2 className="text-lg font-semibold">API Debugger (Alt+D to toggle)</h2>
        <div className="flex items-center space-x-2">
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded px-2 py-1"
          >
            <option value="all">All Logs</option>
            <option value="api">API Only</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>
          <button 
            onClick={() => setLogs([])}
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
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {filteredLogs.map((log, index) => (
          <div 
            key={index} 
            className={`py-1 border-b border-gray-700 ${
              log.level === 'error' ? 'text-red-400' : 
              log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            <div className="flex">
              <span className="text-gray-500 mr-2">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span>{log.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 