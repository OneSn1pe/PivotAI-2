'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalField, CandidateProfile } from '@/types/user';

// Industry options with display names
const PROFESSIONAL_FIELD_OPTIONS: { value: ProfessionalField; label: string; icon: string; description: string }[] = [
  { 
    value: 'computer-science', 
    label: 'Computer Science & Technology', 
    icon: '💻',
    description: 'Software development, algorithms, system design, and digital innovation'
  },
  { 
    value: 'engineering', 
    label: 'Engineering', 
    icon: '⚙️',
    description: 'Design, build, and optimize systems through applied science and innovation'
  },
  { 
    value: 'medicine', 
    label: 'Medicine & Healthcare', 
    icon: '⚕️',
    description: 'Patient care, clinical diagnosis, medical research, and healthcare delivery'
  },
  { 
    value: 'business', 
    label: 'Business & Management', 
    icon: '💼',
    description: 'Strategic planning, operations, finance, and organizational leadership'
  },
  { 
    value: 'law', 
    label: 'Law & Legal Services', 
    icon: '⚖️',
    description: 'Legal research, advocacy, compliance, and regulatory expertise'
  },
];

export default function ProfessionalFieldSelector() {
  const { userProfile, updateUserProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [selectedField, setSelectedField] = useState<ProfessionalField>('computer-science');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load current professional field from user profile
    if (candidateProfile?.professionalField) {
      setSelectedField(candidateProfile.professionalField);
    }
    setIsLoaded(true);
  }, [candidateProfile]);

  const handleFieldChange = async (field: ProfessionalField) => {
    if (!candidateProfile) return;

    setSelectedField(field);
    setSaving(true);
    setSuccess(false);

    try {
      await updateDoc(doc(db, 'users', candidateProfile.uid), {
        professionalField: field,
        updatedAt: new Date()
      });

      // Refresh the user profile in auth context to reflect the changes
      await updateUserProfile();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving professional field:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const selectedOption = PROFESSIONAL_FIELD_OPTIONS.find(option => option.value === selectedField) || PROFESSIONAL_FIELD_OPTIONS[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-slate-700">Professional Field</h2>
        <p className="text-slate-600 text-sm mb-4">
          Select your primary professional field. This determines your milestone categories and career development path.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 font-medium">Professional field updated successfully!</p>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">{selectedOption.icon}</span>
          <div>
            <h3 className="font-semibold text-teal-800">{selectedOption.label}</h3>
            <p className="text-sm text-teal-600">Current Selection</p>
          </div>
        </div>
        <p className="text-sm text-teal-700 mt-2">{selectedOption.description}</p>
      </div>

      {/* Field Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Choose your professional field:
        </label>
        <div className="space-y-2">
          {PROFESSIONAL_FIELD_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedField === option.value
                  ? 'border-teal-500 bg-teal-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => handleFieldChange(option.value)}
            >
              <div className="flex items-start">
                <span className="text-xl mr-3 mt-1">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-slate-800">{option.label}</h4>
                    {selectedField === option.value && (
                      <svg className="w-5 h-5 text-teal-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                  {saving && selectedField === option.value && (
                    <div className="flex items-center mt-2">
                      <svg className="animate-spin h-4 w-4 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-teal-600">Saving...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-slate-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-slate-600">
            <p className="font-medium mb-1">Why does this matter?</p>
            <p>Your professional field determines:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Milestone categories in your career roadmap</li>
              <li>Field-specific competency tracking</li>
              <li>Customized learning resources and assessments</li>
              <li>Industry-relevant success criteria</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 