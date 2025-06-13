'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeManager from '@/components/candidate/ResumeManager';
import LinkedInProfileImport from '@/components/candidate/LinkedInProfileImport';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CandidateProfile, TargetCompany } from '@/types/user';

interface TabConfig {
  id: 'resume' | 'target-companies';
  title: string;
}

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateProfile = userProfile as CandidateProfile | null;
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'resume' | 'target-companies'>(
    tabParam === 'target-companies' ? 'target-companies' : 'resume'
  );
  const [targetCompanies, setTargetCompanies] = useState<TargetCompany[]>([{ name: '', position: '' }]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Define maximum number of allowed companies
  const MAX_COMPANIES = 3;

  React.useEffect(() => {
    // Update active tab when URL param changes
    if (tabParam === 'target-companies') {
      setActiveTab('target-companies');
    } else if (tabParam === 'resume') {
      setActiveTab('resume');
    }
  }, [tabParam]);

  React.useEffect(() => {
    // Load existing preferences if available
    const loadPreferences = async () => {
      if (!candidateProfile?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', candidateProfile.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.targetCompanies && userData.targetCompanies.length > 0) {
            setTargetCompanies(userData.targetCompanies);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    loadPreferences();
  }, [candidateProfile]);

  const handleCompanyChange = (index: number, field: 'name' | 'position', value: string) => {
    const updatedCompanies = [...targetCompanies];
    updatedCompanies[index][field] = value;
    setTargetCompanies(updatedCompanies);
  };

  const addCompany = () => {
    // Don't add more companies if already at the maximum
    if (targetCompanies.length >= MAX_COMPANIES) {
      return;
    }
    setTargetCompanies([...targetCompanies, { name: '', position: '' }]);
  };

  const removeCompany = (index: number) => {
    if (targetCompanies.length > 1) {
      const updatedCompanies = [...targetCompanies];
      updatedCompanies.splice(index, 1);
      setTargetCompanies(updatedCompanies);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateProfile?.uid) return;
    
    setLoading(true);
    
    try {
      // Filter out empty entries
      const filteredCompanies = targetCompanies.filter(company => company.name.trim() !== '' || company.position.trim() !== '');
      
      await updateDoc(doc(db, 'users', candidateProfile.uid), {
        targetCompanies: filteredCompanies,
        updatedAt: new Date()
      });
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const tabs: TabConfig[] = [
    { id: 'resume', title: 'Resume & Skills' },
    { id: 'target-companies', title: 'Target Companies' },
  ];
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your resume and career preferences</p>
        </div>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* LinkedIn Profile Import - will only show when needed */}
      <LinkedInProfileImport />

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {activeTab === 'resume' && (
          <ResumeManager onUpdateComplete={() => router.refresh()} />
        )}
        
        {activeTab === 'target-companies' && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">Target Companies</h2>
              <p className="text-sm text-gray-600 mt-1">Add up to 3 companies you're interested in</p>
            </div>
            
            {saveSuccess && (
              <div className="mb-6 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">Target companies saved successfully</span>
              </div>
            )}
            
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Target Companies */}
              <div className="relative">
                <div className="space-y-4">
                  {targetCompanies.map((company, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">Company {index + 1}</span>
                        {targetCompanies.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeCompany(index)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`company-name-${index}`} className="block text-xs font-medium text-gray-600 mb-1">
                            Company Name
                          </label>
                          <input 
                            type="text" 
                            id={`company-name-${index}`} 
                            value={company.name}
                            onChange={(e) => handleCompanyChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                            placeholder="e.g., Google, Microsoft"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`company-position-${index}`} className="block text-xs font-medium text-gray-600 mb-1">
                            Target Position
                          </label>
                          <input 
                            type="text" 
                            id={`company-position-${index}`}
                            value={company.position}
                            onChange={(e) => handleCompanyChange(index, 'position', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                            placeholder="e.g., Software Engineer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Only show the add button if below maximum companies */}
                  {targetCompanies.length < MAX_COMPANIES && (
                    <button
                      type="button"
                      onClick={addCompany}
                      className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Company
                      </span>
                    </button>
                  )}
                  
                  {/* Show a message when maximum companies reached */}
                  {targetCompanies.length >= MAX_COMPANIES && (
                    <div className="text-center py-2 text-gray-500 text-xs">
                      Maximum of {MAX_COMPANIES} target companies reached
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Target Companies'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}