'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PreferencesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the profile page with the target-companies tab selected
    router.push('/protected/candidate/profile?tab=target-companies');
  }, [router]);
  
  // Show a loading state while redirecting
  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );
}