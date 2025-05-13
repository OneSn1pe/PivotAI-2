'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Skip if already redirected or still loading
    if (redirected || loading || !userProfile) return;
    
    // Get the referrer to see where we came from - only check once
    const referrer = typeof window !== 'undefined' ? document.referrer : '';
    
    // Check if we're coming from a candidate profile view
    const isFromCandidateProfile = referrer.includes('/recruiter/candidate/');
    
    if (isFromCandidateProfile) {
      console.log('[DashboardRedirect] Coming from candidate profile, not redirecting');
      // If we're coming from a candidate profile, don't redirect
      return;
    }
    
    // Standard redirection logic - only execute once
    if (userProfile.role === UserRole.CANDIDATE) {
      console.log('[DashboardRedirect] Redirecting to candidate dashboard');
      router.push('/protected/candidate/dashboard');
      setRedirected(true);
    } else if (userProfile.role === UserRole.RECRUITER) {
      console.log('[DashboardRedirect] Redirecting to recruiter dashboard');
      router.push('/protected/recruiter/dashboard');
      setRedirected(true);
    }
  }, [userProfile, loading, router, pathname, redirected]);

  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}