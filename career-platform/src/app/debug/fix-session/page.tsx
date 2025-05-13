'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCookie, setCookie } from '@/utils/environment';

export default function FixSessionPage() {
  const { currentUser } = useAuth();
  const [sessionCookie, setSessionCookie] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check current session cookie
    const cookie = getCookie('session');
    setSessionCookie(cookie || null);
    
    if (cookie) {
      try {
        // Try to decode the payload
        const parts = cookie.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenInfo({
            uid: payload.user_id || payload.uid,
            role: payload.role,
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
            iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Unknown',
            length: cookie.length
          });
        } else {
          setTokenInfo({ error: 'Not a valid JWT token format', length: cookie.length });
        }
      } catch (err) {
        setTokenInfo({ error: 'Failed to decode token', length: cookie.length });
      }
    }
  }, []);

  const fixSession = async () => {
    if (!currentUser) {
      setError('You must be logged in to fix your session');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Force refresh the token
      const token = await currentUser.getIdToken(true);
      
      // Set as session cookie with proper parameters
      setCookie('session', token, 3600); // 1 hour expiration
      
      // Verify the cookie was set
      const newCookie = getCookie('session');
      if (newCookie && newCookie === token) {
        setSuccess(true);
        setSessionCookie(newCookie);
        
        // Update token info
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenInfo({
            uid: payload.user_id || payload.uid,
            role: payload.role,
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
            iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Unknown',
            length: token.length
          });
        }
      } else {
        throw new Error('Failed to set session cookie');
      }
    } catch (err) {
      console.error('Error fixing session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Fix Session Cookie</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current Session Status</h2>
        <p><strong>User logged in:</strong> {currentUser ? 'Yes' : 'No'}</p>
        {currentUser && (
          <p><strong>User ID:</strong> {currentUser.uid}</p>
        )}
        <p><strong>Session cookie:</strong> {sessionCookie ? 'Present' : 'Missing'}</p>
        {sessionCookie && (
          <>
            <p><strong>Cookie length:</strong> {sessionCookie.length} characters</p>
            <p><strong>Cookie status:</strong> {sessionCookie.length < 100 ? '❌ Too short (invalid)' : '✅ Proper length'}</p>
          </>
        )}
      </div>
      
      {tokenInfo && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">Token Information</h2>
          {tokenInfo.error ? (
            <p className="text-red-500">{tokenInfo.error}</p>
          ) : (
            <div>
              <p><strong>User ID:</strong> {tokenInfo.uid || 'Not found'}</p>
              <p><strong>Role:</strong> {tokenInfo.role || 'Not found'}</p>
              <p><strong>Issued at:</strong> {tokenInfo.iat}</p>
              <p><strong>Expires at:</strong> {tokenInfo.exp}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={fixSession}
          disabled={loading || !currentUser}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Fixing...' : 'Fix My Session Cookie'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Success!</strong> Your session cookie has been fixed. Try accessing the roadmap again.
        </div>
      )}
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click the "Fix My Session Cookie" button above to refresh your token and set it properly</li>
          <li>After fixing, go back to the <a href="/protected/recruiter/dashboard" className="text-blue-500 underline">dashboard</a> and try viewing candidate roadmaps again</li>
          <li>If you still have issues, try logging out and logging back in</li>
          <li>For persistent issues, check if your role claim is set properly at <a href="/debug/token-claims" className="text-blue-500 underline">Token Claims Debug</a></li>
        </ol>
      </div>
    </div>
  );
} 