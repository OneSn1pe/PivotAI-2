'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function DashboardRedirect() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === UserRole.CANDIDATE) {
        router.push('/protected/candidate/dashboard');
      } else if (userProfile.role === UserRole.RECRUITER) {
        router.push('/recruiter/dashboard');
      }
    }
  }, [userProfile, loading, router]);

  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}