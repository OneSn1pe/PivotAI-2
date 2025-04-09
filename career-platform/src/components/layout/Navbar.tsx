'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    
    // Clear session cookie
    document.cookie = 'session=; path=/; max-age=0';
    
    router.push('/auth/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Career Platform</h1>
        
        <div className="flex items-center">
          {userProfile && (
            <div className="flex items-center">
              <span className="mr-4 text-gray-700">{userProfile.displayName}</span>
              
              <div className="relative">
                <button
                  className="flex items-center focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {userProfile.displayName.charAt(0)}
                  </div>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="ml-4 text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}