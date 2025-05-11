'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TokenClaimsDebugPage() {
  const { userProfile, currentUser } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const refreshToken = async () => {
    if (!currentUser) {
      setError('You must be logged in to refresh your token');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Force token refresh
      const token = await currentUser.getIdToken(true);
      const tokenResult = await currentUser.getIdTokenResult();
      
      setTokenInfo({
        token: token.substring(0, 20) + '...' + token.substring(token.length - 20),
        claims: tokenResult.claims,
        issuedAt: new Date(tokenResult.issuedAtTime).toLocaleString(),
        expiresAt: new Date(tokenResult.expirationTime).toLocaleString(),
        signInProvider: tokenResult.signInProvider,
      });
      
      setSuccess('Token refreshed successfully');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const updateRoleClaim = async () => {
    if (!currentUser || !userProfile) {
      setError('You must be logged in to update your role claim');
      return;
    }
    
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Call our API to set the role claim
      const response = await fetch('/api/auth/set-role-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role claim');
      }
      
      setSuccess(`Role claim updated: ${data.message}`);
      
      // Refresh the token to get the updated claims
      await refreshToken();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };
  
  // Automatically refresh token on page load
  useEffect(() => {
    if (currentUser) {
      refreshToken();
    }
  }, [currentUser]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Token Claims Debug</h1>
      <p className="text-gray-600 mb-6">
        This tool helps debug Firebase authentication token claims.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">User Information</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">UID:</span> {userProfile.uid}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Role in Firestore:</span> {userProfile.role}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={refreshToken}
          disabled={loading || !currentUser}
          className={`px-4 py-2 rounded ${
            loading || !currentUser 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Refreshing...' : 'Refresh Token'}
        </button>
        
        <button
          onClick={updateRoleClaim}
          disabled={updating || !currentUser}
          className={`px-4 py-2 rounded ${
            updating || !currentUser 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {updating ? 'Updating...' : 'Update Role Claim'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}
      
      {tokenInfo && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Token Information:</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><span className="font-semibold">Token:</span> {tokenInfo.token}</p>
            <p><span className="font-semibold">Issued At:</span> {tokenInfo.issuedAt}</p>
            <p><span className="font-semibold">Expires At:</span> {tokenInfo.expiresAt}</p>
            <p><span className="font-semibold">Sign-in Provider:</span> {tokenInfo.signInProvider}</p>
            
            <div className="mt-4">
              <h4 className="font-semibold">Claims:</h4>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(tokenInfo.claims, null, 2)}
              </pre>
              
              {tokenInfo.claims.role ? (
                <div className="mt-2 p-2 bg-green-50 text-green-700 rounded">
                  ✅ Role claim found: {tokenInfo.claims.role}
                </div>
              ) : (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
                  ❌ No role claim found in token!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">How to Fix Missing Claims:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Use the "Update Role Claim" button above to add your role to your token</li>
          <li>Log out and log back in to refresh your token</li>
          <li>To update all users in the system, use the admin update endpoint</li>
        </ol>
      </div>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Admin Actions:</h3>
        <p className="text-sm text-gray-600 mb-4">
          These actions should only be performed by administrators.
        </p>
        
        <button
          onClick={async () => {
            try {
              setUpdating(true);
              const response = await fetch('/api/auth/update-all-role-claims', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to update all role claims');
              }
              
              setSuccess(`All role claims updated: ${data.message}`);
            } catch (err: any) {
              setError(err.message || 'An error occurred');
            } finally {
              setUpdating(false);
            }
          }}
          disabled={updating}
          className={`px-4 py-2 rounded ${
            updating ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          Update All Users' Role Claims
        </button>
      </div>
    </div>
  );
} 