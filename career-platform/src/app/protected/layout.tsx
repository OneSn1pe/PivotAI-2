'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on the roadmap generator page
  const isRoadmapGeneratorPage = pathname.includes('/roadmap/generator');
  
  // Handle redirects 
  useEffect(() => {
    // Skip all checks if still loading
    if (loading) return;
    
    // If no user, redirect to login
    if (!userProfile) {
      console.log('[ProtectedLayout] No user profile, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    // For dashboard path, redirect to candidate dashboard
    if (pathname === '/protected/dashboard') {
      router.push('/protected/candidate/dashboard');
    }
  }, [userProfile, loading, pathname, router]);

  // Show loading state if we're loading auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if we don't have a user (we're redirecting)
  if (!userProfile) {
    return null;
  }

  // For the roadmap generator page, just render the children without the navbar
  if (isRoadmapGeneratorPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // For all other protected pages, include the navbar
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 p-8 pt-20 overflow-auto page-content">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}