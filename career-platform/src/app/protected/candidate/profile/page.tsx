'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeUpload from '@/components/candidate/ResumeUpload';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        displayName,
      });
      
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-green-700">Your profile has been updated successfully!</p>
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded py-2 px-3"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-300 rounded py-2 px-3 bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed.</p>
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
        
        <div>
          <ResumeUpload />
        </div>
      </div>
    </div>
  );
}