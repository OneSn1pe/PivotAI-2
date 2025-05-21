'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeManager from '@/components/candidate/ResumeManager';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CandidateProfile, TargetCompany } from '@/types/user';
import TargetCompaniesManager from '@/components/candidate/TargetCompaniesManager';
import JobPreferencesManager from '@/components/candidate/JobPreferencesManager';
import CandidateProfileBanner from '@/components/candidate/CandidateProfileBanner';

interface TabConfig {
  id: 'resume' | 'target-companies' | 'job-preferences';
  title: string;
}

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateProfile = userProfile as CandidateProfile | null;
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'resume' | 'target-companies' | 'job-preferences'>(
    tabParam === 'target-companies' ? 'target-companies' : tabParam === 'job-preferences' ? 'job-preferences' : 'resume'
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
    } else if (tabParam === 'job-preferences') {
      setActiveTab('job-preferences');
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
    { id: 'job-preferences', title: 'Job Preferences' },
  ];
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <CandidateProfileBanner />
      
      <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap gap-4 mb-5">
          {/* Tab navigation */}
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'resume' 
                ? 'bg-teal-700 text-white shadow-button' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Resume Management
          </button>
          
          <button
            onClick={() => setActiveTab('target-companies')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'target-companies' 
                ? 'bg-teal-700 text-white shadow-button' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Target Companies
          </button>
          
          <button
            onClick={() => setActiveTab('job-preferences')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'job-preferences' 
                ? 'bg-teal-700 text-white shadow-button' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Job Preferences
          </button>
        </div>
        
        {/* Resume Management */}
        {activeTab === 'resume' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-inter">Resume Management</h2>
            <ResumeManager />
          </div>
        )}
        
        {/* Target Companies */}
        {activeTab === 'target-companies' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-inter">Target Companies</h2>
            <TargetCompaniesManager />
          </div>
        )}
        
        {/* Job Preferences */}
        {activeTab === 'job-preferences' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-inter">Job Preferences</h2>
            <JobPreferencesManager />
          </div>
        )}
      </div>
    </div>
  );
}