'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TargetCompany } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function TargetCompaniesForm() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load existing target companies if available
    async function loadCompanies() {
      if (!userProfile) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userProfile.uid));
        if (userDoc.exists()) {
          // Handle both old and new format of target companies
          if (userDoc.data().targetCompanies) {
            const targetCompanies = userDoc.data().targetCompanies;
            
            // Check if targetCompanies is an array of strings (old format) or objects (new format)
            if (targetCompanies.length > 0 && typeof targetCompanies[0] === 'string') {
              // Convert old format to new format
              const convertedCompanies = targetCompanies.map((name: string) => ({
                name,
                position: '',
              }));
              setCompanies(convertedCompanies);
            } else {
              // New format
              setCompanies(targetCompanies);
            }
          }
        }
      } catch (error) {
        console.error('Error loading target companies:', error);
        setError('Failed to load your target companies. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }
    
    loadCompanies();
  }, [userProfile]);
  
  const handleAddCompany = () => {
    if (!newCompany.trim()) {
      return;
    }
    
    if (companies.some(company => company.name.toLowerCase() === newCompany.toLowerCase())) {
      setError('This company is already in your list. Try adding a different one.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const newTargetCompany: TargetCompany = {
      name: newCompany.trim(),
      position: newPosition.trim(),
    };
    
    setCompanies([...companies, newTargetCompany]);
    setNewCompany('');
    setNewPosition('');
    setError(null);
  };
  
  const handleRemoveCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };
  
  const handleUpdatePosition = (index: number, position: string) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index].position = position;
    setCompanies(updatedCompanies);
  };
  
  const handleSave = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        targetCompanies: companies,
        updatedAt: new Date()
      });
      
      setSuccess(true);
      
      // Set a timeout to navigate back to dashboard after showing success message
      setTimeout(() => {
        setRedirecting(true);
        router.refresh(); // Refresh current route data
        router.push('/protected/candidate/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving target companies:', error);
      setError('Failed to save your target companies. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCompany();
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading your target companies...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Target Companies</h2>
      <p className="text-gray-600 mb-6">
        Add companies you're interested in working for and your desired positions. We'll help you prepare specifically for these opportunities.
      </p>
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-green-700 font-medium">
                {redirecting 
                  ? 'Your target companies have been saved! Redirecting to dashboard...' 
                  : 'Your target companies have been saved successfully!'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 space-y-3">
        <div className="flex flex-col space-y-2">
          <div className="relative">
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Company name"
              className="border border-gray-300 rounded py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.035-.691-.1-1.021A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Desired position"
              className="border border-gray-300 rounded py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button
            onClick={handleAddCompany}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Add Target Company
          </button>
        </div>
      </div>
      
      {companies.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <span>Your Target Companies</span>
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{companies.length}</span>
          </h3>
          <ul className="space-y-3">
            {companies.map((company, index) => (
              <li 
                key={index}
                className="bg-gray-50 p-4 rounded border border-gray-200 hover:shadow-md transition duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg">{company.name}</h4>
                  <button
                    onClick={() => handleRemoveCompany(index)}
                    className="text-red-600 hover:text-red-800 transition duration-200 p-1 rounded-full hover:bg-red-50"
                    aria-label="Remove company"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={company.position}
                    onChange={(e) => handleUpdatePosition(index, e.target.value)}
                    placeholder="Desired position"
                    className="border border-gray-300 rounded py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-lg border border-gray-200 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 text-center">You haven't added any target companies yet.</p>
          <p className="text-gray-500 text-center text-sm mt-1">Add companies you're interested in to get personalized recommendations.</p>
        </div>
      )}
      
      <button
        onClick={handleSave}
        disabled={saving || companies.length === 0}
        className={`font-bold py-3 px-4 rounded w-full flex justify-center items-center transition duration-200 
          ${companies.length === 0 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        {saving ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          <>
            Save Target Companies
            {companies.length > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </>
        )}
      </button>
    </div>
  );
}