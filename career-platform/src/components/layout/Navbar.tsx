'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserRole, UserProgress } from '@/types/user';
import { ProgressTrackingService } from '@/services/progressTracking';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (userProfile) {
      loadUserProgress();
    }
  }, [userProfile]);

  const loadUserProgress = async () => {
    if (!userProfile) return;
    
    try {
      const progress = await ProgressTrackingService.getUserProgress(userProfile.uid);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user progress in navbar:', error);
    }
  };

  if (!userProfile) return null;

  const links = [
    { href: '/protected/candidate/dashboard', label: 'Dashboard' },
    { href: '/protected/candidate/profile', label: 'Profile' },
    { href: '/protected/candidate/roadmap', label: 'Roadmap' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await logout();
      
      document.cookie = 'session=; path=/; max-age=0';
      
      setTimeout(() => {
        if (document.location.pathname.includes('/protected')) {
          console.warn('Logout navigation appears stuck, forcing redirect');
          window.location.href = '/auth/login';
        }
      }, 3000);
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/auth/login';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/protected/candidate/dashboard" className="text-gray-900 text-base sm:text-lg font-semibold tracking-tight">
                Crackd
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-8 lg:ml-12">
              <div className="flex items-center space-x-6 lg:space-x-8">
                {links.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`${
                      pathname === link.href 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                    } text-sm transition-colors duration-200 relative group`}
                  >
                    <span className="relative">
                      {link.label}
                      <span className={`absolute -bottom-0.5 left-0 h-px bg-gray-900 transition-all duration-200 ${
                        pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}></span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* User Info and Logout */}
          <div className="hidden md:flex items-center space-x-6">
            {userProgress && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Level {userProgress.levelsUnlocked}</span>
              </div>
            )}
            <span className="text-gray-600 text-sm">
              {userProfile.displayName}
            </span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-1">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-600'
                } block py-2 text-sm transition-colors duration-200`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile user info */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600 text-sm">
                  {userProfile.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
              {userProgress && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Level {userProgress.levelsUnlocked}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}