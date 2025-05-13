'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  // Memoize path checking to avoid recalculations
  const pathInfo = useMemo(() => {
    if (!pathname) return { isDashboard: false, isRecruiterViewingCandidate: false };
    
    return {
      isDashboard: pathname === '/protected/dashboard',
      isRecruiterViewingCandidate: pathname?.includes('/recruiter/candidate/'),
      isInCandidateSection: pathname?.includes('/candidate'),
      isInRecruiterSection: pathname?.includes('/recruiter'),
    };
  }, [pathname]);

  // Handle redirects in a single effect to avoid race conditions
  useEffect(() => {
    // Skip all checks if still loading
    if (loading) return;
    
    // If no user, redirect to login once
    if (!userProfile) {
      router.push('/auth/login');
      return;
    }
    
    // Get user role
    const userRole = userProfile.role;
    
    // Special case: Allow recruiters to view candidate profiles
    if (userRole === UserRole.RECRUITER && pathInfo.isRecruiterViewingCandidate) {
      console.log('[ProtectedLayout] Recruiter viewing candidate profile - allowing access');
      return; // Exit early, don't redirect
    }
    
    // For dashboard path, redirect to role-specific dashboard
    if (pathInfo.isDashboard) {
      const roleDashboard = userRole === UserRole.CANDIDATE 
        ? '/protected/candidate/dashboard' 
        : '/protected/recruiter/dashboard';
      
      setRedirectPath(roleDashboard);
      return;
    }
    
    // Check if user is in the correct section
    const isInCorrectSection = userRole === UserRole.CANDIDATE 
      ? pathInfo.isInCandidateSection
      : pathInfo.isInRecruiterSection;
    
    // Only redirect if user is in the wrong section
    if (!isInCorrectSection) {
      const correctPath = userRole === UserRole.CANDIDATE 
        ? '/protected/candidate/dashboard' 
        : '/protected/recruiter/dashboard';
      
      setRedirectPath(correctPath);
    }
  }, [userProfile, loading, pathInfo]);
  
  // Handle redirect in a separate effect to avoid render loops
  useEffect(() => {
    if (redirectPath) {
      console.log(`[ProtectedLayout] Redirecting to ${redirectPath}`);
      router.push(redirectPath);
      // Clear the redirect path to prevent multiple redirects
      setRedirectPath(null);
    }
  }, [redirectPath, router]);

  // Show loading state if we're loading auth
  if (loading) {
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