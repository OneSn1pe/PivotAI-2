'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserRole } from '@/types/user';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CANDIDATE);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      // Add additional fields based on role
      if (role === UserRole.RECRUITER) {
        Object.assign(userData, { company, position });
      }
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Set session cookie
      document.cookie = `session=${userCredential.user.uid}; path=/; max-age=86400`;
      
      // Redirect based on user role
      if (role === UserRole.CANDIDATE) {
        router.push('/candidate/dashboard');
      } else {
        router.push('/recruiter/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <div className="mt-1">
          <input
            id="display-name"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          I am a
        </label>
        <div className="mt-2 space-y-4">
          <div className="flex items-center">
            <input
              id="role-candidate"
              name="role"
              type="radio"
              checked={role === UserRole.CANDIDATE}
              onChange={() => setRole(UserRole.CANDIDATE)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="role-candidate" className="ml-3 block text-sm font-medium text-gray-700">
              Job Seeker / Candidate
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="role-recruiter"
              name="role"
              type="radio"
              checked={role === UserRole.RECRUITER}
              onChange={() => setRole(UserRole.RECRUITER)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="role-recruiter" className="ml-3 block text-sm font-medium text-gray-700">
              Recruiter / Employer
            </label>
          </div>
        </div>
      </div>
      
      {role === UserRole.RECRUITER && (
        <>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <div className="mt-1">
              <input
                id="company"
                name="company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
              Your Position
            </label>
            <div className="mt-1">
              <input
                id="position"
                name="position"
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  );
}