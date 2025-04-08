'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { JobPreferences } from '@/types/user';

export default function JobPreferencesForm() {
  const { userProfile } = useAuth();
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
  
  useEffect(() => {
    // Load existing preferences if available
    async function loadPreferences() {
      if (!userProfile) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userProfile.uid));
        if (userDoc.exists() && userDoc.data().jobPreferences) {
          setPreferences(userDoc.data().jobPreferences);
        }
      } catch (error) {
        console.error('Error loading job preferences:', error);
      }
    }
    
    loadPreferences();
  }, [userProfile]);
  
  const handleAddRole = () => {
    if (role && !preferences.roles.includes(role)) {
      setPreferences({
        ...preferences,
        roles: [...preferences.roles, role],
      });
      setRole('');
    }
  };
  
  const handleAddLocation = () => {
    if (location && !preferences.locations.includes(location)) {
      setPreferences({
        ...preferences,
        locations: [...preferences.locations, location],
      });
      setLocation('');
    }
  };
  
  const handleAddIndustry = () => {
    if (industry && !preferences.industries.includes(industry)) {
      setPreferences({
        ...preferences,
        industries: [...preferences.industries, industry],
      });
      setIndustry('');
    }
  };
  
  const handleRemoveItem = (type: 'roles' | 'locations' | 'industries', index: number) => {
    setPreferences({
      ...preferences,
      [type]: preferences[type].filter((_, i) => i !== index),
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        jobPreferences: preferences,
      });
      
      setSuccess(true);
      
      // If user has resume but no roadmap, generate one
      if (userProfile.resumeAnalysis) {
        // In the full implementation, this would trigger the roadmap generation
        console.log('Would generate roadmap here');
      }
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
          </div>
        )}
        
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Desired Roles
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
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              Add
            </button>
          </div>
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
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              Add
            </button>
          </div>
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
              className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
            >
              Add
            </button>
          </div>
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
        
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}