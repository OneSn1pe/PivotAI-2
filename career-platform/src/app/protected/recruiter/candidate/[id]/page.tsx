'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LegacyRecruiterCandidateRedirect() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;
  
  // Log for debugging
  console.log('[LegacyRecruiterCandidateRedirect] Redirecting to new route', {
    candidateId,
    userProfile: userProfile ? {
      uid: userProfile.uid,
      role: userProfile.role
    } : 'null'
  });
  
  useEffect(() => {
    if (candidateId) {
      // Redirect to the new unified route
      router.replace(`/protected/recruiter/candidate/${candidateId}`);
    }
  }, [candidateId, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Redirecting to updated candidate view...</p>
    </div>
  );
} 