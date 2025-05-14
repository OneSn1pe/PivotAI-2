'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Job Preferences</h1>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Set Your Job Preferences</h2>
        
        <form className="space-y-6">
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Desired Roles
            </label>
            <input 
              type="text" 
              id="roles" 
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="e.g., Software Engineer, Product Manager"
            />
          </div>
          
          <div>
            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Locations
            </label>
            <input 
              type="text" 
              id="locations" 
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="e.g., New York, Remote"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Environment
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" name="workEnv" className="mr-2" />
                Remote
              </label>
              <label className="flex items-center">
                <input type="radio" name="workEnv" className="mr-2" />
                Hybrid
              </label>
              <label className="flex items-center">
                <input type="radio" name="workEnv" className="mr-2" />
                On-site
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="industries" className="block text-sm font-medium text-gray-700 mb-1">
              Industries of Interest
            </label>
            <input 
              type="text" 
              id="industries" 
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="e.g., Tech, Healthcare, Finance"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}