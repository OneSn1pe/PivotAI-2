'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function Sidebar() {
  const { userProfile } = useAuth();
  const pathname = usePathname();

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

  return (
    <aside className="bg-blue-700 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-6">
        <Link href={isCandidate ? '/protected/candidate/dashboard' : '/protected/recruiter/dashboard'} className="text-xl font-bold">
          Career Platform
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
      </nav>
    </aside>
  );
}