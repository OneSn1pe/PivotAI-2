'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db, isDevelopment } from '@/config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { UserRole } from '@/types/user';

export default function AuthDebugPage() {
  const { userProfile, currentUser } = useAuth();
  const [cookieValue, setCookieValue] = useState<string | null>(null);
  const [testQueryResult, setTestQueryResult] = useState<string | null>(null);
  const [testQueryError, setTestQueryError] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the session cookie
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('session='));
      if (sessionCookie) {
        const value = sessionCookie.split('=')[1];
        setCookieValue(value ? `${value.substring(0, 10)}...` : null);
      } else {
        setCookieValue(null);
      }
      
      // Test Firestore query
      const testFirestore = async () => {
        try {
          const usersQuery = query(collection(db, 'users'), limit(1));
          const snapshot = await getDocs(usersQuery);
          
          if (snapshot.empty) {
            setTestQueryResult('Query successful but no users found');
          } else {
            const userData = snapshot.docs[0].data();
            setTestQueryResult(`Query successful! Found user: ${userData.displayName || userData.email}`);
          }
        } catch (error: any) {
          setTestQueryError(`Error: ${error.message}`);
        }
      };
      
      testFirestore();
    }
  }, []);
  
  // Function to create a development recruiter profile
  const createDevRecruiterProfile = async () => {
    if (!isDevelopment) {
      alert('This function is only available in development mode');
      return;
    }
    
    try {
      // First, sign out if we're already signed in
      await auth.signOut();
      
      // You would implement the creation of a development user here
      alert('Please implement the development profile creation logic');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Environment</h2>
        <p><span className="font-semibold">Development Mode:</span> {isDevelopment ? 'YES' : 'NO'}</p>
        <p><span className="font-semibold">Hostname:</span> {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">User Profile</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">Display Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            <p><span className="font-semibold">Is Recruiter:</span> {userProfile.role === UserRole.RECRUITER ? 'YES' : 'NO'}</p>
          </div>
        ) : (
          <p>No user profile found</p>
        )}
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Firebase User</h2>
        {currentUser ? (
          <div>
            <p><span className="font-semibold">UID:</span> {currentUser.uid}</p>
            <p><span className="font-semibold">Email:</span> {currentUser.email}</p>
            <p><span className="font-semibold">Email Verified:</span> {currentUser.emailVerified ? 'YES' : 'NO'}</p>
          </div>
        ) : (
          <p>No Firebase user found</p>
        )}
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Cookies</h2>
        <p><span className="font-semibold">Session Cookie:</span> {cookieValue || 'Not found'}</p>
      </div>
      
      <div className="bg-pink-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Firestore Test</h2>
        {testQueryResult ? (
          <p className="text-green-600">{testQueryResult}</p>
        ) : testQueryError ? (
          <p className="text-red-600">{testQueryError}</p>
        ) : (
          <p>Testing firestore connection...</p>
        )}
      </div>
      
      {isDevelopment && (
        <div className="mt-8">
          <button 
            onClick={createDevRecruiterProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Development Recruiter Profile
          </button>
        </div>
      )}
    </div>
  );
} 