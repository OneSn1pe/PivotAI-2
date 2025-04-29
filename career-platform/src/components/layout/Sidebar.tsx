'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function Sidebar() {
  const { userProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!userProfile) return null;

  const isCandidate = userProfile.role === UserRole.CANDIDATE;
  const isRecruiter = userProfile.role === UserRole.RECRUITER;

  const candidateLinks = [
    { href: '/protected/candidate/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/protected/candidate/profile', label: 'Profile', icon: 'user' },
    { href: '/protected/candidate/roadmap', label: 'Career Roadmap', icon: 'map' },
    { href: '/protected/candidate/preferences', label: 'Job Preferences', icon: 'settings' },
  ];

  const recruiterLinks = [
    { href: '/protected/recruiter/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/protected/recruiter/search', label: 'Search Candidates', icon: 'search' },
    { href: '/protected/recruiter/bookmarks', label: 'Bookmarked Candidates', icon: 'bookmark' },
  ];

  const links = isCandidate ? candidateLinks : isRecruiter ? recruiterLinks : [];

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    
    try {
      await logout();
      
      // Clear session cookie (belt and suspenders approach)
      document.cookie = 'session=; path=/; max-age=0';
      
      // Navigation is handled in logout(), but add a backup just in case
      setTimeout(() => {
        if (document.location.pathname.includes('/protected')) {
          console.warn('Logout navigation appears stuck, forcing redirect');
          window.location.href = '/auth/login';
        }
      }, 3000);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      window.location.href = '/auth/login';
    }
  };

  return (
    <aside className="bg-blue-700 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-6">
        <Link href={isCandidate ? '/protected/candidate/dashboard' : '/protected/recruiter/dashboard'} className="text-xl font-bold">
          PivotAI
        </Link>
      </div>
      
      <nav className="mt-6">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href}
                className={`flex items-center px-6 py-3 hover:bg-blue-800 ${
                  pathname === link.href ? 'bg-blue-800' : ''
                }`}
              >
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-8 border-t border-blue-600 pt-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md mx-4 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 8a1 1 0 01-2 0V6.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L10 6.414V11z" clipRule="evenodd" />
            </svg>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </nav>
    </aside>
  );
}