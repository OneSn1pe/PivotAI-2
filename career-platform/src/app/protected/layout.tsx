'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { UserRole } from '@/types/user';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Clear any existing timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  useEffect(() => {
    // If we're not loading and there's no user, redirect to login
    if (!loading && !userProfile) {
      router.push('/auth/login');
    }
    
    // Detect correct route for user role
    if (!loading && userProfile) {
      const userRole = userProfile.role;
      const isInCorrectSection = 
        (userRole === UserRole.CANDIDATE && pathname?.includes('/candidate')) ||
        (userRole === UserRole.RECRUITER && pathname?.includes('/recruiter'));
      
      if (!isInCorrectSection && pathname !== '/protected/dashboard') {
        const correctPath = userRole === UserRole.CANDIDATE 
          ? '/protected/candidate/dashboard' 
          : '/protected/recruiter/dashboard';
        
        // Set a timeout to avoid immediate redirects which can cause race conditions
        const id = setTimeout(() => {
          router.push(correctPath);
        }, 300);
        
        setTimeoutId(id);
      }
    }
  }, [userProfile, loading, router, pathname]);

  // Show loading state if we're loading auth or transitioning between pages
  if (loading || isTransitioning) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if we don't have a user (we're redirecting)
  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}