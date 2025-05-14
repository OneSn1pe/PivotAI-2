'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CandidateProfile } from '@/types/user';

interface TargetCompany {
  name: string;
  position: string;
}

interface TargetRole {
  title: string;
  industry: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  
  const [targetCompanies, setTargetCompanies] = useState<TargetCompany[]>([{ name: '', position: '' }]);
  const [targetRoles, setTargetRoles] = useState<TargetRole[]>([{ title: '', industry: '' }]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
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
          
          if (userData.targetRoles && userData.targetRoles.length > 0) {
            setTargetRoles(userData.targetRoles);
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

  const handleRoleChange = (index: number, field: keyof TargetRole, value: string) => {
    const updatedRoles = [...targetRoles];
    updatedRoles[index][field] = value;
    setTargetRoles(updatedRoles);
  };

  const addCompany = () => {
    setTargetCompanies([...targetCompanies, { name: '', position: '' }]);
  };

  const removeCompany = (index: number) => {
    if (targetCompanies.length > 1) {
      const updatedCompanies = [...targetCompanies];
      updatedCompanies.splice(index, 1);
      setTargetCompanies(updatedCompanies);
    }
  };

  const addRole = () => {
    setTargetRoles([...targetRoles, { title: '', industry: '' }]);
  };

  const removeRole = (index: number) => {
    if (targetRoles.length > 1) {
      const updatedRoles = [...targetRoles];
      updatedRoles.splice(index, 1);
      setTargetRoles(updatedRoles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateProfile?.uid) return;
    
    setLoading(true);
    
    try {
      // Filter out empty entries
      const filteredCompanies = targetCompanies.filter(company => company.name.trim() !== '' || company.position.trim() !== '');
      const filteredRoles = targetRoles.filter(role => role.title.trim() !== '' || role.industry.trim() !== '');
      
      await updateDoc(doc(db, 'users', candidateProfile.uid), {
        targetCompanies: filteredCompanies,
        targetRoles: filteredRoles,
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-sky-800">Career Targets</h1>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white/80 backdrop-filter backdrop-blur-md p-8 rounded-xl shadow-xl shadow-sky-200/50 border border-slate-100 float-card">
        <h2 className="text-xl font-semibold mb-6 text-sky-700">Set Your Career Targets</h2>
        
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-lg status-partly-cloudy">
            Preferences saved successfully!
          </div>
        )}
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Target Companies */}
          <div className="relative">
            <div className="absolute -top-4 -right-4">
              <div className="cloud-sm opacity-30"></div>
            </div>
            <h3 className="text-lg font-medium text-sky-800 mb-4">Target Companies</h3>
            
            <div className="space-y-4">
              {targetCompanies.map((company, index) => (
                <div key={index} className="p-4 bg-white/90 rounded-lg border border-sky-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sky-700">Company #{index + 1}</span>
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
                        className="w-full p-2 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
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
                        className="w-full p-2 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
                        placeholder="e.g., Software Engineer, Product Manager"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCompany}
                className="w-full py-2 px-4 border border-sky-300 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
              >
                + Add Another Company
              </button>
            </div>
          </div>
          
          {/* Target Roles */}
          <div className="relative">
            <div className="absolute -top-4 -left-4">
              <div className="cloud-sm opacity-30"></div>
            </div>
            <h3 className="text-lg font-medium text-sky-800 mb-4">Target Roles</h3>
            
            <div className="space-y-4">
              {targetRoles.map((role, index) => (
                <div key={index} className="p-4 bg-white/90 rounded-lg border border-sky-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sky-700">Role #{index + 1}</span>
                    {targetRoles.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeRole(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`role-title-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                        Role Title
                      </label>
                      <input 
                        type="text" 
                        id={`role-title-${index}`}
                        value={role.title}
                        onChange={(e) => handleRoleChange(index, 'title', e.target.value)}
                        className="w-full p-2 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
                        placeholder="e.g., Full Stack Developer, UX Designer"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`role-industry-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                        Industry
                      </label>
                      <input 
                        type="text" 
                        id={`role-industry-${index}`}
                        value={role.industry}
                        onChange={(e) => handleRoleChange(index, 'industry', e.target.value)}
                        className="w-full p-2 border border-sky-200 rounded-lg bg-white/70 backdrop-filter backdrop-blur-sm focus:ring-sky-500 focus:border-sky-500"
                        placeholder="e.g., Tech, Healthcare, Finance"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addRole}
                className="w-full py-2 px-4 border border-sky-300 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
              >
                + Add Another Role
              </button>
            </div>
          </div>
          
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`cloud-btn w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-sky-600 hover:to-blue-700'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                  Saving...
                </span>
              ) : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}