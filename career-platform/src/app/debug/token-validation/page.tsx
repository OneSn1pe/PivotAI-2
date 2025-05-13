'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDevelopmentMode, getCookie } from '@/utils/environment';

export default function TokenValidationDebugPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [middlewareResult, setMiddlewareResult] = useState<any>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get token on page load
  useEffect(() => {
    async function getToken() {
      try {
        if (currentUser) {
          const idToken = await currentUser.getIdToken(false);
          setToken(idToken);
        }
        
        // Also check for session cookie
        const sessionCookie = getCookie('session');
        if (sessionCookie) {
          console.log('Session cookie found, length:', sessionCookie.length);
        } else {
          console.log('No session cookie found');
        }
      } catch (err) {
        console.error('Error getting token:', err);
        setError('Failed to get token: ' + String(err));
      }
    }
    
    getToken();
  }, [currentUser]);
  
  // Test middleware token validation
  const testMiddleware = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/debug/middleware-token');
      const data = await response.json();
      setMiddlewareResult(data);
    } catch (err) {
      console.error('Error testing middleware:', err);
      setError('Middleware test failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Test API token validation
  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to access a protected API endpoint
      const response = await fetch('/api/auth/verify-token');
      const data = await response.json();
      setApiResult(data);
    } catch (err) {
      console.error('Error testing API:', err);
      setError('API test failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Force token refresh
  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (currentUser) {
        const newToken = await currentUser.getIdToken(true);
        setToken(newToken);
        
        // Set as session cookie
        document.cookie = `session=${newToken}; path=/; ${!isDevelopmentMode() ? 'secure; samesite=strict;' : ''} max-age=3600`;
        console.log('Token refreshed and cookie set');
      } else {
        setError('No user logged in');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError('Token refresh failed: ' + String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Token Validation Debug</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold text-lg mb-2">Current Token Status</h2>
        <p><strong>User logged in:</strong> {currentUser ? 'Yes' : 'No'}</p>
        {currentUser && (
          <p><strong>User ID:</strong> {currentUser.uid}</p>
        )}
        <p><strong>Token available:</strong> {token ? 'Yes' : 'No'}</p>
        {token && (
          <p><strong>Token length:</strong> {token.length} characters</p>
        )}
        <p><strong>Session cookie:</strong> {getCookie('session') ? 'Present' : 'Missing'}</p>
        {getCookie('session') && (
          <p><strong>Cookie length:</strong> {getCookie('session')?.length} characters</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-bold text-lg mb-2">Middleware Validation</h2>
          <button 
            onClick={testMiddleware}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Middleware Validation'}
          </button>
          
          {middlewareResult && (
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-80">
              <pre className="text-xs">{JSON.stringify(middlewareResult, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="font-bold text-lg mb-2">API Validation</h2>
          <button 
            onClick={testApi}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Validation'}
          </button>
          
          {apiResult && (
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-80">
              <pre className="text-xs">{JSON.stringify(apiResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">Token Management</h2>
        <button 
          onClick={refreshToken}
          disabled={loading || !currentUser}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Force Token Refresh & Set Cookie'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Token Details</h2>
        {token ? (
          <div>
            <p className="mb-2"><strong>Token parts:</strong></p>
            <div className="grid grid-cols-3 gap-2">
              {token.split('.').map((part, index) => (
                <div key={index} className="bg-white p-2 rounded border text-xs overflow-auto">
                  <p className="font-bold mb-1">Part {index + 1}</p>
                  <p className="break-all">{part}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <p className="font-bold mb-1">Decoded payload:</p>
              <div className="bg-white p-2 rounded border text-xs overflow-auto">
                <pre>
                  {(() => {
                    try {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      return JSON.stringify(payload, null, 2);
                    } catch (err) {
                      return 'Error decoding token: ' + String(err);
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <p>No token available</p>
        )}
      </div>
    </div>
  );
} 