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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if we don't have a user (we're redirecting)
  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100">
      <Navbar />
      <main className="flex-1 p-8 overflow-auto page-content">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}