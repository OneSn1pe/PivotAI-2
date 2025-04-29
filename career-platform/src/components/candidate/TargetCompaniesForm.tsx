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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadCompanies = async () => {
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
      setIsRefreshing(false);
    }
  };
  
  // Load companies on initial mount and when userProfile changes
  useEffect(() => {
    loadCompanies();
  }, [userProfile]);
  
  // Refresh list when companies state changes
  useEffect(() => {
    if (isRefreshing) {
      loadCompanies();
    }
  }, [isRefreshing]);
  
  const handleAddCompany = async () => {
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
    
    // Save to Firebase immediately so it's persistent
    if (userProfile) {
      try {
        const updatedCompanies = [...companies, newTargetCompany];
        await updateDoc(doc(db, 'users', userProfile.uid), {
          targetCompanies: updatedCompanies,
          updatedAt: new Date()
        });
        
        // Show brief success message for adding
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
        
        // No need to refresh as we're already updating the local state
      } catch (error) {
        console.error('Error adding target company:', error);
        setError('Failed to add company. Please try again.');
      }
    }
  };
  
  const handleRemoveCompany = async (index: number) => {
    const updatedCompanies = companies.filter((_, i) => i !== index);
    setCompanies(updatedCompanies);
    
    // Update Firebase when removing companies
    if (userProfile) {
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          targetCompanies: updatedCompanies,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error removing target company:', error);
        setError('Failed to remove company. Please try again.');
        setIsRefreshing(true); // Refresh to get the latest state
      }
    }
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
      // But make sure we have proper error handling and can't get stuck
      const navigationTimeout = setTimeout(() => {
        setRedirecting(true);
        // Try to navigate, with a failsafe
        try {
          router.refresh(); // Refresh current route data
          router.push('/protected/candidate/dashboard');
        } catch (error) {
          console.error('Navigation error:', error);
          // Force navigation if router fails
          window.location.href = '/protected/candidate/dashboard';
        }
      }, 1500);
      
      // Add a safety timeout in case navigation gets stuck
      const safetyTimeout = setTimeout(() => {
        // Force redirect if stuck for more than 5 seconds
        window.location.href = '/protected/candidate/dashboard';
      }, 5000);
      
      // Clean up timeouts if component unmounts
      return () => {
        clearTimeout(navigationTimeout);
        clearTimeout(safetyTimeout);
      };
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
  
  const handleRefresh = () => {
    setIsRefreshing(true);
  };
  
  // Add a safety mechanism for the back button
  const handleBackToDashboard = () => {
    try {
      router.push('/protected/candidate/dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback direct navigation if router fails
      window.location.href = '/protected/candidate/dashboard';
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Target Companies</h2>
        <button 
          onClick={handleRefresh}
          className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
          disabled={isRefreshing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
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
                  ? `Your ${companies.length} target ${companies.length === 1 ? 'company has' : 'companies have'} been saved! Redirecting to dashboard...` 
                  : `Your ${companies.length} target ${companies.length === 1 ? 'company has' : 'companies have'} been saved successfully!`}
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
      
      {/* List of added companies */}
      <div className="space-y-4 my-6">
        <h3 className="text-lg font-medium text-gray-800">Your Target Companies</h3>
        
        {companies.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies added</h3>
            <p className="mt-1 text-sm text-gray-500">Use the form above to add companies you're targeting in your job search.</p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => document.getElementById('companyName')?.focus()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add your first company
              </button>
            </div>
          </div>
        ) : (
          companies.map((company, index) => (
            <div key={index} className="bg-white shadow overflow-hidden sm:rounded-md p-4 border border-gray-200">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-md font-medium text-gray-800">{company.name}</h4>
                  <div className="mt-2">
                    <label htmlFor={`position-${index}`} className="block text-sm font-medium text-gray-700">
                      Desired Position
                    </label>
                    <input
                      type="text"
                      id={`position-${index}`}
                      value={company.position}
                      onChange={(e) => handleUpdatePosition(index, e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Specify your desired role"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCompany(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button
        type="button"
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
            Save {companies.length > 0 ? (
              <span className="flex items-center">
                <span className="mx-1">{companies.length}</span>
                <span>{companies.length === 1 ? 'Company' : 'Companies'}</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {companies.length}
                </span>
              </span>
            ) : 'Target Companies'}
          </>
        )}
      </button>
      
      {/* Add back button as a safety mechanism */}
      <div className="mt-4 text-center">
        <button
          onClick={handleBackToDashboard}
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}