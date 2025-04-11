'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TargetCompany } from '@/types/user';

export default function TargetCompaniesForm() {
  const { userProfile } = useAuth();
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
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
      }
    }
    
    loadCompanies();
  }, [userProfile]);
  
  const handleAddCompany = () => {
    if (newCompany && !companies.some(company => company.name === newCompany)) {
      const newTargetCompany: TargetCompany = {
        name: newCompany,
        position: newPosition,
      };
      setCompanies([...companies, newTargetCompany]);
      setNewCompany('');
      setNewPosition('');
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
        Add companies you're interested in working for and your desired positions. We'll help you prepare specifically for these opportunities.
      </p>
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">Your target companies have been saved successfully!</p>
        </div>
      )}
      
      <div className="mb-6 space-y-3">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="Company name"
            className="border border-gray-300 rounded py-2 px-3"
          />
          <input
            type="text"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            placeholder="Desired position"
            className="border border-gray-300 rounded py-2 px-3"
          />
          <button
            onClick={handleAddCompany}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Add Target Company
          </button>
        </div>
      </div>
      
      {companies.length > 0 ? (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Your Target Companies:</h3>
          <ul className="space-y-3">
            {companies.map((company, index) => (
              <li 
                key={index}
                className="bg-gray-50 p-4 rounded border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg">{company.name}</h4>
                  <button
                    onClick={() => handleRemoveCompany(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
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
                    className="border border-gray-300 rounded py-2 px-3 w-full"
                  />
                </div>
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