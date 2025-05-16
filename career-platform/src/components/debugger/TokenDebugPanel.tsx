'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCookie } from '@/utils/environment';

interface TokenDebugPanelProps {
  candidateId?: string;
}

export default function TokenDebugPanel({ candidateId }: TokenDebugPanelProps) {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Show/hide with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 't') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Get token info
  const analyzeToken = async () => {
    setLoading(true);
    
    try {
      // Get token info
      const sessionCookie = getCookie('session');
      let firebaseToken = null;
      
      if (currentUser) {
        try {
          firebaseToken = await currentUser.getIdToken(false);
        } catch (err) {
          console.error('Error getting Firebase token:', err);
        }
      }
      
      // Basic token analysis
      const tokenData: any = {
        sessionCookie: {
          present: !!sessionCookie,
          length: sessionCookie?.length || 0
        },
        firebaseToken: {
          present: !!firebaseToken,
          length: firebaseToken?.length || 0
        },
        user: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          isAnonymous: currentUser.isAnonymous,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime
          }
        } : null
      };
      
      // Try to decode session cookie
      if (sessionCookie) {
        try {
          const parts = sessionCookie.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            tokenData.sessionCookie.decoded = payload;
            
            // Check expiration
            if (payload.exp) {
              const now = Math.floor(Date.now() / 1000);
              const expiresIn = payload.exp - now;
              tokenData.sessionCookie.expiresIn = `${expiresIn} seconds (${Math.floor(expiresIn / 60)} minutes)`;
              tokenData.sessionCookie.expired = expiresIn <= 0;
            }
          }
        } catch (err) {
          tokenData.sessionCookie.decodeError = String(err);
        }
      }
      
      // Try to decode Firebase token
      if (firebaseToken) {
        try {
          const parts = firebaseToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            tokenData.firebaseToken.decoded = payload;
            
            // Check expiration
            if (payload.exp) {
              const now = Math.floor(Date.now() / 1000);
              const expiresIn = payload.exp - now;
              tokenData.firebaseToken.expiresIn = `${expiresIn} seconds (${Math.floor(expiresIn / 60)} minutes)`;
              tokenData.firebaseToken.expired = expiresIn <= 0;
            }
          }
        } catch (err) {
          tokenData.firebaseToken.decodeError = String(err);
        }
      }
      
      setTokenInfo(tokenData);
    } catch (err) {
      console.error('Error analyzing token:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Test API access
  const testRoadmapAccess = async () => {
    if (!candidateId) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/roadmaps/${candidateId}`);
      const data = await response.json();
      
      setApiResponse({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: {
          contentType: response.headers.get('content-type')
        }
      });
    } catch (err) {
      console.error('Error testing API access:', err);
      setApiResponse({
        error: String(err)
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 z-50 max-h-1/2 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Token Debug (Alt+T to toggle)</h2>
        <div className="flex gap-2">
          <button
            onClick={analyzeToken}
            disabled={loading}
            className="bg-blue-600 px-2 py-1 rounded text-sm"
          >
            {loading ? 'Loading...' : 'Analyze Token'}
          </button>
          {candidateId && (
            <button
              onClick={testRoadmapAccess}
              disabled={loading}
              className="bg-green-600 px-2 py-1 rounded text-sm"
            >
              Test Roadmap API
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="bg-red-600 px-2 py-1 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-md font-semibold mb-2">Token Information</h3>
          {tokenInfo ? (
            <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">Click "Analyze Token" to see token details</p>
          )}
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-2">API Response</h3>
          {apiResponse ? (
            <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">Click "Test Roadmap API" to test API access</p>
          )}
        </div>
      </div>
    </div>
  );
} 