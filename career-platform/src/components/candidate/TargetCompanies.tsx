'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export default function TargetCompanies() {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<string[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Load existing target companies if available
    async function loadCompanies() {
      if (!userProfile) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userProfile.uid));
        if (userDoc.exists() && userDoc.data().targetCompanies) {
          setCompanies(userDoc.data().targetCompanies);
        }
      } catch (error) {
        console.error('Error loading target companies:', error);
      }
    }
    
    loadCompanies();
  }, [userProfile]);
  
  const handleAddCompany = () => {
    if (newCompany && !companies.includes(newCompany)) {
      setCompanies([...companies, newCompany]);
      setNewCompany('');
    }
  };
  
  const handleRemoveCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
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
    } catch (error) {
      console.error('Error saving target companies:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Target Companies</h2>
      <p className="text-gray-600 mb-6">
        Add companies you're interested in working for, and we'll help you prepare specifically for these opportunities.
      </p>
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">Your target companies have been saved successfully!</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex mb-2">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="Company name"
            className="flex-1 border border-gray-300 rounded-l py-2 px-3"
          />
          <button
            onClick={handleAddCompany}
            className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>
      
      {companies.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Your Target Companies:</h3>
          <ul className="space-y-2">
            {companies.map((company, index) => (
              <li 
                key={index}
                className="flex justify-between items-center bg-gray-50 p-3 rounded"
              >
                <span>{company}</span>
                <button
                  onClick={() => handleRemoveCompany(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 italic mb-6">You haven't added any target companies yet.</p>
      )}
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
      >
        {saving ? 'Saving...' : 'Save Target Companies'}
      </button>
    </div>
  );
}