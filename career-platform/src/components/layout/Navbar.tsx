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
    { href: '/protected/candidate/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/protected/candidate/profile', label: 'Resume and Companies', icon: '👤' },
    { href: '/protected/candidate/roadmap', label: 'Career Path', icon: '🛣️' },
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
    <nav className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-teal-900 to-teal-700 shadow-md shadow-teal-700/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle header accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        </div>
        
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/protected/candidate/dashboard" className="text-white text-xl font-inter font-bold flex items-center">
                <span className="relative">
                  PivotAI
                  <span className="absolute h-0.5 w-full bottom-0 left-0 bg-teal-200 rounded-full transform translate-y-1"></span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-6">
                {links.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`${
                      pathname === link.href 
                        ? 'text-white font-medium' 
                        : 'text-teal-100 hover:text-white'
                    } px-3 py-2 text-sm transition-all duration-300 group whitespace-nowrap`}
                  >
                    <span className="relative flex items-center">
                      <span className="mr-2">{link.icon}</span>
                      {link.label}
                      <span className={`absolute h-0.5 w-0 group-hover:w-full bottom-0 left-0 ${
                        pathname === link.href ? 'w-full bg-teal-200' : 'bg-teal-200/50'
                      } transition-all duration-300 ease-in-out rounded-full -mb-1`}></span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* User Info and Logout */}
          <div className="hidden md:flex items-center">
            <div className="text-teal-100 mr-4 font-medium font-inter">
              {userProfile.displayName}
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-teal-600 hover:bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-teal-100 hover:text-white focus:outline-none transition-all duration-300"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-teal-900 bg-opacity-95 backdrop-filter backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href 
                    ? 'bg-teal-800 text-white' 
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                } flex items-center px-3 py-2 rounded-md text-base font-medium transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Mobile user info */}
            <div className="border-t border-teal-800 pt-4 pb-3">
              <div className="flex items-center px-3">
                <div className="text-teal-100 text-sm font-medium">
                  {userProfile.displayName}
                </div>
              </div>
              <div className="mt-3 px-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex justify-center bg-teal-600 hover:bg-teal-800 text-white px-3 py-2 rounded text-sm font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
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