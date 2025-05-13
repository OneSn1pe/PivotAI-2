'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCookie } from '@/utils/environment';

export default function TokenValidationPage() {
  const { currentUser, userProfile } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [sessionCookieInfo, setSessionCookieInfo] = useState<any>(null);
  const [apiValidationResult, setApiValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to decode JWT without validation
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Error decoding JWT:', err);
      return null;
    }
  };

  // Function to check token expiration
  const isTokenExpired = (decodedToken: any) => {
    if (!decodedToken || !decodedToken.exp) return true;
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  };

  // Function to format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Function to check the session cookie
  const checkSessionCookie = () => {
    const sessionCookie = getCookie('session');
    
    if (sessionCookie) {
      const decodedCookie = decodeJwt(sessionCookie);
      
      setSessionCookieInfo({
        present: true,
        length: sessionCookie.length,
        decoded: decodedCookie,
        isExpired: isTokenExpired(decodedCookie),
        expiresAt: decodedCookie?.exp ? formatDate(decodedCookie.exp) : 'N/A',
        issuedAt: decodedCookie?.iat ? formatDate(decodedCookie.iat) : 'N/A',
        raw: sessionCookie
      });
    } else {
      setSessionCookieInfo({
        present: false
      });
    }
  };

  // Function to validate token with API
  const validateTokenWithApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify-token');
      const data = await response.json();
      setApiValidationResult(data);
    } catch (err) {
      setError(`API validation error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh the token
  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!currentUser) {
        setError('No user logged in');
        return;
      }
      
      // Force token refresh
      await currentUser.getIdToken(true);
      
      // Get the new token
      const newToken = await currentUser.getIdToken();
      const newDecodedToken = await currentUser.getIdTokenResult();
      
      setTokenInfo({
        token: newToken,
        decoded: newDecodedToken.claims,
        expirationTime: newDecodedToken.expirationTime,
        issuedAtTime: newDecodedToken.issuedAtTime,
        signInProvider: newDecodedToken.signInProvider,
        isExpired: false
      });
      
      // Check if session cookie was updated
      checkSessionCookie();
      
    } catch (err) {
      setError(`Token refresh error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to set a new session cookie
  const setNewSessionCookie = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!currentUser) {
        setError('No user logged in');
        return;
      }
      
      // Get a fresh token
      const idToken = await currentUser.getIdToken(true);
      
      // Call the API to set a new session cookie
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Check the new session cookie
        checkSessionCookie();
      } else {
        setError(`Failed to set session cookie: ${data.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      setError(`Session cookie error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Get token info on component mount
  useEffect(() => {
    const getTokenInfo = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const decodedToken = await currentUser.getIdTokenResult();
          
          setTokenInfo({
            token,
            decoded: decodedToken.claims,
            expirationTime: decodedToken.expirationTime,
            issuedAtTime: decodedToken.issuedAtTime,
            signInProvider: decodedToken.signInProvider,
            isExpired: new Date() >= new Date(decodedToken.expirationTime)
          });
        } catch (err) {
          console.error('Error getting token:', err);
          setError(`Error getting token: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    
    getTokenInfo();
    checkSessionCookie();
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Token Validation Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Current User</h2>
          {currentUser ? (
            <div>
              <p><strong>UID:</strong> {currentUser.uid}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
              <p><strong>Email Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Role:</strong> {userProfile?.role || 'Not set'}</p>
            </div>
          ) : (
            <p className="text-red-500">No user logged in</p>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshToken}
              disabled={loading || !currentUser}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Refresh Token
            </button>
            
            <button
              onClick={validateTokenWithApi}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Validate with API
            </button>
            
            <button
              onClick={setNewSessionCookie}
              disabled={loading || !currentUser}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Set New Session Cookie
            </button>
          </div>
          
          {loading && <p className="mt-2 text-blue-500">Loading...</p>}
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ID Token Section */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <h2 className="font-bold">Firebase ID Token</h2>
          </div>
          <div className="p-4">
            {tokenInfo ? (
              <div>
                <div className="mb-4">
                  <div className={`inline-block px-2 py-1 rounded text-white ${tokenInfo.isExpired ? 'bg-red-500' : 'bg-green-500'}`}>
                    {tokenInfo.isExpired ? 'Expired' : 'Valid'}
                  </div>
                </div>
                
                <div className="mb-2">
                  <p><strong>Issued:</strong> {new Date(tokenInfo.issuedAtTime).toLocaleString()}</p>
                  <p><strong>Expires:</strong> {new Date(tokenInfo.expirationTime).toLocaleString()}</p>
                  <p><strong>Provider:</strong> {tokenInfo.signInProvider}</p>
                </div>
                
                <div className="mb-2">
                  <h3 className="font-bold text-sm">Claims:</h3>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <pre>{JSON.stringify(tokenInfo.decoded, null, 2)}</pre>
                  </div>
                </div>
                
                <details>
                  <summary className="cursor-pointer text-blue-500 text-sm">Show Raw Token</summary>
                  <div className="mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                    <pre className="text-xs break-all whitespace-pre-wrap">{tokenInfo.token}</pre>
                  </div>
                </details>
              </div>
            ) : (
              <p className="text-gray-500">No token information available</p>
            )}
          </div>
        </div>
        
        {/* Session Cookie Section */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <h2 className="font-bold">Session Cookie</h2>
          </div>
          <div className="p-4">
            {sessionCookieInfo ? (
              sessionCookieInfo.present ? (
                <div>
                  <div className="mb-4">
                    <div className={`inline-block px-2 py-1 rounded text-white ${sessionCookieInfo.isExpired ? 'bg-red-500' : 'bg-green-500'}`}>
                      {sessionCookieInfo.isExpired ? 'Expired' : 'Valid'}
                    </div>
                    <span className="ml-2 text-gray-500">Length: {sessionCookieInfo.length} chars</span>
                  </div>
                  
                  <div className="mb-2">
                    <p><strong>Issued:</strong> {sessionCookieInfo.issuedAt}</p>
                    <p><strong>Expires:</strong> {sessionCookieInfo.expiresAt}</p>
                  </div>
                  
                  {sessionCookieInfo.decoded && (
                    <div className="mb-2">
                      <h3 className="font-bold text-sm">Payload:</h3>
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <pre>{JSON.stringify(sessionCookieInfo.decoded, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  <details>
                    <summary className="cursor-pointer text-blue-500 text-sm">Show Raw Cookie</summary>
                    <div className="mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                      <pre className="text-xs break-all whitespace-pre-wrap">{sessionCookieInfo.raw}</pre>
                    </div>
                  </details>
                </div>
              ) : (
                <p className="text-red-500">No session cookie found</p>
              )
            ) : (
              <p className="text-gray-500">Checking session cookie...</p>
            )}
          </div>
        </div>
        
        {/* API Validation Section */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <h2 className="font-bold">API Validation Result</h2>
          </div>
          <div className="p-4">
            {apiValidationResult ? (
              <div>
                <div className="mb-4">
                  <div className={`inline-block px-2 py-1 rounded text-white ${apiValidationResult.validationSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
                    {apiValidationResult.validationSuccess ? 'Valid' : 'Invalid'}
                  </div>
                  <span className="ml-2 text-gray-500">Method: {apiValidationResult.validationMethod}</span>
                </div>
                
                <div className="mb-2">
                  <p><strong>Token Present:</strong> {apiValidationResult.tokenPresent ? 'Yes' : 'No'}</p>
                  <p><strong>Token Length:</strong> {apiValidationResult.tokenLength} chars</p>
                  <p><strong>Validation Time:</strong> {apiValidationResult.validationTime}ms</p>
                </div>
                
                {apiValidationResult.error && (
                  <div className="mb-2">
                    <h3 className="font-bold text-sm text-red-500">Error:</h3>
                    <p className="text-red-500">{apiValidationResult.error}</p>
                  </div>
                )}
                
                {apiValidationResult.decodedToken && (
                  <div className="mb-2">
                    <h3 className="font-bold text-sm">Decoded Token:</h3>
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <pre>{JSON.stringify(apiValidationResult.decodedToken, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                <details>
                  <summary className="cursor-pointer text-blue-500 text-sm">Show Full Response</summary>
                  <div className="mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">
                    <pre className="text-xs">{JSON.stringify(apiValidationResult, null, 2)}</pre>
                  </div>
                </details>
              </div>
            ) : (
              <p className="text-gray-500">No validation results. Click "Validate with API" to test.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>If the token is <strong>expired</strong>, click "Refresh Token" to get a new one.</li>
          <li>If the session cookie is <strong>missing or expired</strong>, click "Set New Session Cookie".</li>
          <li>If the token has no <strong>role claim</strong>, try logging out and back in, or contact an administrator.</li>
          <li>Check that the <strong>same Firebase project</strong> is being used in both development and production.</li>
          <li>Verify that <strong>custom claims</strong> are being set correctly when the user logs in.</li>
        </ul>
      </div>
    </div>
  );
} 