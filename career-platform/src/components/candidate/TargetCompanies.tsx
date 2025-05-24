'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TargetCompany, ProfessionalField } from '@/types/user';

// Industry options with display names
const INDUSTRY_OPTIONS: { value: ProfessionalField; label: string; icon: string }[] = [
  { value: 'computer-science', label: 'Computer Science & Technology', icon: '💻' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️' },
  { value: 'medicine', label: 'Medicine & Healthcare', icon: '⚕️' },
  { value: 'business', label: 'Business & Management', icon: '💼' },
  { value: 'law', label: 'Law & Legal Services', icon: '⚖️' },
];

export default function TargetCompaniesForm() {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newIndustry, setNewIndustry] = useState<ProfessionalField>('computer-science');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Load existing target companies if available
    async function loadCompanies() {
      if (!userProfile) return;
      
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
                industry: 'computer-science' as ProfessionalField, // Default industry for legacy data
              }));
              setCompanies(convertedCompanies);
            } else {
              // New format - ensure industry is set for existing entries
              const updatedCompanies = targetCompanies.map((company: TargetCompany) => ({
                ...company,
                industry: company.industry || 'computer-science' as ProfessionalField, // Default if missing
              }));
              setCompanies(updatedCompanies);
            }
          }
        }
      } catch (error) {
        console.error('Error loading target companies:', error);
      }
    }
    
    loadCompanies();
  }, [userProfile]);
  
  const handleAddCompany = () => {
    if (newCompany && !companies.some(company => company.name === newCompany)) {
      const newTargetCompany: TargetCompany = {
        name: newCompany,
        position: newPosition,
        industry: newIndustry,
      };
      setCompanies([...companies, newTargetCompany]);
      setNewCompany('');
      setNewPosition('');
      setNewIndustry('computer-science'); // Reset to default
    }
  };
  
  const handleRemoveCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };
  
  const handleUpdatePosition = (index: number, position: string) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index].position = position;
    setCompanies(updatedCompanies);
  };

  const handleUpdateIndustry = (index: number, industry: ProfessionalField) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index].industry = industry;
    setCompanies(updatedCompanies);
  };
  
  const handleSave = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        targetCompanies: companies,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Error saving target companies:', error);
    } finally {
      setSaving(false);
    }
  };

  const getIndustryInfo = (industry: ProfessionalField) => {
    return INDUSTRY_OPTIONS.find(option => option.value === industry) || INDUSTRY_OPTIONS[0];
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Target Companies</h2>
        <p className="text-slate-600">
          Add companies you're interested in working for, specify your desired positions, and select the relevant industry. 
          We'll help you prepare specifically for these opportunities.
        </p>
      </div>
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 font-medium">Your target companies have been saved successfully!</p>
          </div>
        </div>
      )}
      
      {/* Add New Company Form */}
      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Target Company</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft, Apple"
              className="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Desired Position
            </label>
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              className="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Industry *
            </label>
            <select
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value as ProfessionalField)}
              className="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleAddCompany}
          disabled={!newCompany}
          className="mt-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Add Target Company
        </button>
      </div>
      
      {/* Companies List */}
      {companies.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Target Companies ({companies.length})</h3>
          <div className="space-y-4">
            {companies.map((company, index) => {
              const industryInfo = getIndustryInfo(company.industry || 'computer-science');
              return (
                <div 
                  key={index}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-teal-800">
                          {company.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-800">{company.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-slate-600 mr-2">{industryInfo.icon}</span>
                          <span className="text-sm font-medium text-slate-600">{industryInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveCompany(index)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove company"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={company.position}
                        onChange={(e) => handleUpdatePosition(index, e.target.value)}
                        placeholder="Desired position"
                        className="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Industry
                      </label>
                      <select
                        value={company.industry || 'computer-science'}
                        onChange={(e) => handleUpdateIndustry(index, e.target.value as ProfessionalField)}
                        className="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
                      >
                        {INDUSTRY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No target companies yet</h3>
          <p className="text-slate-600">Add your first target company above to get started with personalized career guidance.</p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || companies.length === 0}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none"
        >
          {saving ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          ) : (
            'Save Target Companies'
          )}
        </button>
      </div>
    </div>
  );
}