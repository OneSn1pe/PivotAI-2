'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/user';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userProfile) return null;

  const links = [
    { href: '/protected/candidate/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/protected/candidate/profile', label: 'Profile', icon: 'user' },
    { href: '/protected/candidate/roadmap', label: 'Career Roadmap', icon: 'map' },
    { href: '/protected/candidate/preferences', label: 'Job Preferences', icon: 'settings' },
  ];

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-500 to-sky-700 backdrop-filter backdrop-blur-lg shadow-lg shadow-sky-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative cloud elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="cloud-sm opacity-10 absolute top-2 left-1/4 animate-float-slow"></div>
          <div className="cloud-md opacity-10 absolute bottom-0 right-1/3 animate-float-medium"></div>
        </div>
        
        <div className="flex items-center justify-between h-20">
          {/* Logo and Navigation Links */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/protected/candidate/dashboard" className="text-white text-2xl font-bold flex items-center">
                <span className="cloud-icon mr-2">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 16C3.48 16 2 14.43 2 12.5C2 10.57 3.48 9 5.5 9L6 9.01C6.36 6.73 8.38 5 10.5 5C12.9 5 15 7.1 15 9.5V10C15.66 10 16.5 10.07 17.2 10.28C19.25 10.83 20 12.22 20 14C20 15.78 19.07 18 15.5 18H5.5Z" fill="currentColor"/>
                  </svg>
                </span>
                <span className="relative">
                  PivotAI
                  <span className="absolute h-1 w-full bottom-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transform translate-y-1"></span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-8">
                {links.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`${
                      pathname === link.href 
                        ? 'text-white border-b-2 border-white font-semibold' 
                        : 'text-sky-100 hover:text-white hover:border-b-2 hover:border-sky-300'
                    } px-3 py-2 text-sm transition-all duration-300 group`}
                  >
                    <span className="relative">
                      {link.label}
                      <span className={`absolute h-0.5 w-0 group-hover:w-full bottom-0 left-0 ${
                        pathname === link.href ? 'w-full bg-white' : 'bg-sky-200'
                      } transition-all duration-300 ease-in-out rounded-full -mb-1`}></span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* User Info and Logout */}
          <div className="hidden md:block">
            <div className="flex items-center">
              <div className="text-sky-100 mr-4 font-medium">
                {userProfile.displayName}
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-md shadow-amber-500/30 transition-all duration-300"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-sky-100 hover:text-white focus:outline-none transition-all duration-300 cloud-btn"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sky-800 bg-opacity-95 backdrop-filter backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href 
                    ? 'bg-sky-900 text-white' 
                    : 'text-sky-100 hover:bg-sky-700 hover:text-white'
                } block px-3 py-2 rounded-xl text-base font-medium transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-sky-700 pt-4 pb-3">
              <div className="flex items-center px-3">
                <div className="text-sky-100 text-sm font-medium">
                  {userProfile.displayName}
                </div>
              </div>
              <div className="mt-3 px-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-2 rounded-full text-sm font-medium shadow-md shadow-amber-500/30 transition-all duration-300"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}