'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RecruiterProfile, PositionPreferences } from '@/types/user';
import PositionPreferencesUpload from '@/components/recruiter/PositionPreferencesUpload';
import { doc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function PositionsPage() {
  const { userProfile, updateUserProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check if there are existing positions
  const hasPositions = recruiterProfile?.positionPreferences && 
    Object.keys(recruiterProfile.positionPreferences).length > 0;
  
  // Function to handle position deletion
  const handleDeletePosition = async (positionTitle: string) => {
    if (!recruiterProfile) return;
    
    if (confirm(`Are you sure you want to delete the position "${positionTitle}"?`)) {
      try {
        setLoading(true);
        setError(null);
        
        // Update the document to remove this position
        const userDocRef = doc(db, 'users', recruiterProfile.uid);
        
        await updateDoc(userDocRef, {
          [`positionPreferences.${positionTitle}`]: deleteField()
        });
        
        setSuccessMessage(`Position "${positionTitle}" has been deleted`);
        
        // Refresh user profile data
        if (updateUserProfile) {
          await updateUserProfile();
        }
        
        // Reset selected position if needed
        if (selectedPosition === positionTitle) {
          setSelectedPosition(null);
        }
      } catch (err) {
        console.error('Error deleting position:', err);
        setError('Failed to delete position. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  const handleUpdateComplete = () => {
    // Switch to manage tab after adding a new position
    setActiveTab('manage');
    // Clear any selected position
    setSelectedPosition(null);
    // Display success message
    setSuccessMessage('Position preferences saved successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Position Preferences</h1>
        <button
          onClick={() => router.push('/protected/recruiter/dashboard')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
      
      <p className="text-gray-600 mb-8">
        Manage position preferences that will be used to generate better roadmaps for candidates 
        interested in positions at your company.
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}
      
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-4 px-6 ${
                activeTab === 'manage'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Positions
            </button>
            <button
              onClick={() => {
                setActiveTab('add');
                setSelectedPosition(null);
              }}
              className={`py-4 px-6 ${
                activeTab === 'add'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Position
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'manage' && (
        <div>
          {hasPositions ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Position Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Required Skills
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Updated
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(recruiterProfile?.positionPreferences || {}).map(([title, position]) => (
                    <tr 
                      key={title}
                      className={selectedPosition === title ? "bg-blue-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {position.requiredSkills.slice(0, 3).join(', ')}
                          {position.requiredSkills.length > 3 && `... +${position.requiredSkills.length - 3} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(position.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPosition(title);
                              setActiveTab('add');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDeletePosition(title)}
                            className="text-red-600 hover:text-red-900"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-500 mb-4">No position preferences have been added yet.</p>
              <button
                onClick={() => setActiveTab('add')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Your First Position
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'add' && (
        <PositionPreferencesUpload 
          onUpdateComplete={handleUpdateComplete}
          currentPositions={selectedPosition ? [selectedPosition] : []}
        />
      )}
    </div>
  );
} 