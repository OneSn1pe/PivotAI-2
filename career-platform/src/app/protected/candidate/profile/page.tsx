'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeManager from '@/components/candidate/ResumeManager';
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

  const handleCompanyChange = (index: number, field: keyof TargetCompany, value: string) => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
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
        <h1 className="text-3xl font-bold text-slate-800">Your Profile</h1>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium py-2 px-4 rounded-lg shadow-md shadow-teal-500/30 transition-all"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      
      <div className="bg-white/80 backdrop-filter backdrop-blur-md p-8 rounded-xl shadow-xl shadow-teal-200/30 border border-slate-100 float-card">
        {activeTab === 'resume' && (
          <ResumeManager onUpdateComplete={() => router.refresh()} />
        )}
        
        {activeTab === 'target-companies' && (
          <>
            <h2 className="text-xl font-semibold mb-6 text-slate-700">Set Your Target Companies</h2>
            
            {saveSuccess && (
              <div className="mb-6 p-4 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                Target companies saved successfully!
              </div>
            )}
            
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Target Companies */}
              <div className="relative">
                <div className="absolute -top-4 -right-4">
                  <div className="cloud-sm opacity-30"></div>
                </div>
                
                <div className="space-y-4">
                  {targetCompanies.map((company, index) => (
                    <div key={index} className="p-4 bg-white/90 rounded-lg border border-teal-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-teal-700">Company #{index + 1}</span>
                        {targetCompanies.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeCompany(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`company-name-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                            Company Name
                          </label>
                          <input 
                            type="text" 
                            id={`company-name-${index}`} 
                            value={company.name}
                            onChange={(e) => handleCompanyChange(index, 'name', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g., Google, Microsoft"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`company-position-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                            Target Position
                          </label>
                          <input 
                            type="text" 
                            id={`company-position-${index}`}
                            value={company.position}
                            onChange={(e) => handleCompanyChange(index, 'position', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g., Software Engineer, Product Manager"
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
                      className="w-full py-2 px-4 border border-teal-300 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      + Add Another Company
                    </button>
                  )}
                  
                  {/* Show a message when maximum companies reached */}
                  {targetCompanies.length >= MAX_COMPANIES && (
                    <div className="text-center py-2 text-teal-600 text-sm">
                      Maximum of {MAX_COMPANIES} target companies reached
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 px-4 rounded-md shadow-button transition-all disabled:opacity-50"
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