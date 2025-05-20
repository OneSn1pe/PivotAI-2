'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { JobPreferences, CandidateProfile, TargetCompany } from '@/types/user';
import { useRouter } from 'next/navigation';
import { generateCareerRoadmap } from '@/services/openai';

// Maximum number of items allowed for each preference category
const MAX_ITEMS = {
  roles: 3,
  locations: 3,
  industries: 3
};

export default function JobPreferencesForm() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [preferences, setPreferences] = useState<JobPreferences>({
    roles: [],
    locations: [],
    remotePreference: 'hybrid',
    salaryExpectation: 0,
    industries: [],
  });
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    // Load existing preferences if available
    async function loadPreferences() {
      if (!candidateProfile) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', candidateProfile.uid));
        if (userDoc.exists() && userDoc.data().jobPreferences) {
          setPreferences(userDoc.data().jobPreferences);
        }
      } catch (error) {
        console.error('Error loading job preferences:', error);
      }
    }
    
    loadPreferences();
  }, [candidateProfile]);
  
  const handleAddRole = () => {
    if (!role) return;
    
    if (preferences.roles.includes(role)) {
      setErrors({...errors, roles: 'This role is already added'});
      return;
    }
    
    if (preferences.roles.length >= MAX_ITEMS.roles) {
      setErrors({...errors, roles: `You can only add up to ${MAX_ITEMS.roles} roles`});
      return;
    }
    
    setPreferences({
      ...preferences,
      roles: [...preferences.roles, role],
    });
    setRole('');
    setErrors({...errors, roles: ''});
  };
  
  const handleAddLocation = () => {
    if (!location) return;
    
    if (preferences.locations.includes(location)) {
      setErrors({...errors, locations: 'This location is already added'});
      return;
    }
    
    if (preferences.locations.length >= MAX_ITEMS.locations) {
      setErrors({...errors, locations: `You can only add up to ${MAX_ITEMS.locations} locations`});
      return;
    }
    
    setPreferences({
      ...preferences,
      locations: [...preferences.locations, location],
    });
    setLocation('');
    setErrors({...errors, locations: ''});
  };
  
  const handleAddIndustry = () => {
    if (!industry) return;
    
    if (preferences.industries.includes(industry)) {
      setErrors({...errors, industries: 'This industry is already added'});
      return;
    }
    
    if (preferences.industries.length >= MAX_ITEMS.industries) {
      setErrors({...errors, industries: `You can only add up to ${MAX_ITEMS.industries} industries`});
      return;
    }
    
    setPreferences({
      ...preferences,
      industries: [...preferences.industries, industry],
    });
    setIndustry('');
    setErrors({...errors, industries: ''});
  };
  
  const handleRemoveItem = (type: 'roles' | 'locations' | 'industries', index: number) => {
    setPreferences({
      ...preferences,
      [type]: preferences[type].filter((_, i) => i !== index),
    });
    // Clear any errors when an item is removed
    setErrors({...errors, [type]: ''});
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateProfile) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      // Update user preferences
      await updateDoc(doc(db, 'users', candidateProfile.uid), {
        jobPreferences: preferences,
      });
      
      // If user has resume analysis, generate a new roadmap
      if (candidateProfile.resumeAnalysis) {
        // Convert job preferences to target companies format
        const targetCompanies: TargetCompany[] = preferences.roles.map(role => ({
          name: preferences.industries[0] || "General",
          position: role
        }));
        
        const roadmap = await generateCareerRoadmap(
          candidateProfile.resumeAnalysis,
          targetCompanies
        );
        
        // Save the roadmap to Firestore
        await setDoc(doc(db, 'roadmaps', candidateProfile.uid), {
          ...roadmap,
          candidateId: candidateProfile.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('Error saving job preferences:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Your Job Preferences</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">Your job preferences have been saved successfully!</p>
            <button
              type="button"
              onClick={() => router.push('/protected/candidate/dashboard')}
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded w-full"
            >
              Back to Dashboard
            </button>
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Desired Roles
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Maximum {MAX_ITEMS.roles})
            </span>
          </label>
          <div className="flex mb-2">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="flex-1 border border-gray-300 rounded-l py-2 px-3"
            />
            <button
              type="button"
              onClick={handleAddRole}
              disabled={preferences.roles.length >= MAX_ITEMS.roles}
              className={`${
                preferences.roles.length >= MAX_ITEMS.roles 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white px-4 rounded-r`}
            >
              Add
            </button>
          </div>
          {errors.roles && (
            <p className="text-red-500 text-sm mt-1">{errors.roles}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.roles.map((role, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {role}
                <button
                  type="button"
                  onClick={() => handleRemoveItem('roles', index)}
                  className="ml-2 text-blue-800 hover:text-blue-900"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Preferred Locations
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Maximum {MAX_ITEMS.locations})
            </span>
          </label>
          <div className="flex mb-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York"
              className="flex-1 border border-gray-300 rounded-l py-2 px-3"
            />
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={preferences.locations.length >= MAX_ITEMS.locations}
              className={`${
                preferences.locations.length >= MAX_ITEMS.locations 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white px-4 rounded-r`}
            >
              Add
            </button>
          </div>
          {errors.locations && (
            <p className="text-red-500 text-sm mt-1">{errors.locations}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.locations.map((location, index) => (
              <span 
                key={index} 
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {location}
                <button
                  type="button"
                  onClick={() => handleRemoveItem('locations', index)}
                  className="ml-2 text-green-800 hover:text-green-900"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Remote Work Preference
          </label>
          <select
            value={preferences.remotePreference}
            onChange={(e) => setPreferences({
              ...preferences,
              remotePreference: e.target.value as 'remote' | 'hybrid' | 'onsite',
            })}
            className="w-full border border-gray-300 rounded py-2 px-3"
          >
            <option value="remote">Fully Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Expected Annual Salary ($)
          </label>
          <input
            type="number"
            value={preferences.salaryExpectation}
            onChange={(e) => setPreferences({
              ...preferences,
              salaryExpectation: parseInt(e.target.value) || 0,
            })}
            min="0"
            step="1000"
            className="w-full border border-gray-300 rounded py-2 px-3"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Preferred Industries
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Maximum {MAX_ITEMS.industries})
            </span>
          </label>
          <div className="flex mb-2">
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology"
              className="flex-1 border border-gray-300 rounded-l py-2 px-3"
            />
            <button
              type="button"
              onClick={handleAddIndustry}
              disabled={preferences.industries.length >= MAX_ITEMS.industries}
              className={`${
                preferences.industries.length >= MAX_ITEMS.industries 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white px-4 rounded-r`}
            >
              Add
            </button>
          </div>
          {errors.industries && (
            <p className="text-red-500 text-sm mt-1">{errors.industries}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.industries.map((industry, index) => (
              <span 
                key={index} 
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {industry}
                <button
                  type="button"
                  onClick={() => handleRemoveItem('industries', index)}
                  className="ml-2 text-purple-800 hover:text-purple-900"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}