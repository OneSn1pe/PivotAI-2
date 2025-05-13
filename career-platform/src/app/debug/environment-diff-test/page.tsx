'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDevelopmentMode, getCookie } from '@/utils/environment';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function EnvironmentDiffTestPage() {
  const { userProfile, currentUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [candidateId, setCandidateId] = useState('0AZJyS2HH1OXTHdE6QvvzuPYmMA3'); // Default test candidate ID

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    setLogs([]);
    setResults({});

    addLog('🔍 Starting environment difference tests...');
    
    // 1. Environment detection
    const envResults = testEnvironmentDetection();
    setResults(prev => ({ ...prev, environment: envResults }));
    
    // 2. Token validation
    await testTokenValidation();
    
    // 3. Cookie settings
    testCookieSettings();
    
    // 4. Custom claims
    await testCustomClaims();
    
    // 5. API access
    await testAPIAccess();
    
    // 6. Firestore rules
    await testFirestoreRules();
    
    // 7. Production bypass for short tokens
    await testProductionBypass();
    
    addLog('✅ All tests completed');
    setLoading(false);
  };

  // 1. Test environment detection
  const testEnvironmentDetection = () => {
    addLog('1️⃣ Testing environment detection...');
    
    const nodeEnv = process.env.NODE_ENV;
    const devFlag = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    const isDev = isDevelopmentMode();
    
    addLog(`NODE_ENV: ${nodeEnv}`);
    addLog(`NEXT_PUBLIC_DEVELOPMENT_MODE: ${devFlag}`);
    addLog(`Hostname: ${hostname}`);
    addLog(`isDevelopmentMode(): ${isDev}`);
    
    return {
      nodeEnv,
      devFlag,
      hostname,
      isDev
    };
  };

  // 2. Test token validation
  const testTokenValidation = async () => {
    addLog('2️⃣ Testing token validation...');
    
    const sessionCookie = getCookie('session');
    addLog(`Session cookie present: ${!!sessionCookie}`);
    
    if (sessionCookie) {
      addLog(`Session cookie length: ${sessionCookie.length}`);
      
      try {
        // Test middleware token validation
        addLog('Testing middleware token validation...');
        const middlewareResponse = await fetch('/debug/middleware-token');
        const middlewareData = await middlewareResponse.json();
        
        addLog(`Middleware token validation result: ${JSON.stringify({
          present: middlewareData.token?.present,
          length: middlewareData.token?.length,
          structureValid: middlewareData.token?.structureValid,
          hasRole: middlewareData.token?.payload?.hasRole,
          role: middlewareData.token?.payload?.role
        })}`);
        
        setResults(prev => ({ 
          ...prev, 
          tokenValidation: { 
            middleware: middlewareData
          } 
        }));
        
        // Test API token validation
        addLog('Testing API token validation...');
        const apiResponse = await fetch('/api/auth/verify-token');
        const apiData = await apiResponse.json();
        
        addLog(`API token validation success: ${apiData.validationSuccess}`);
        addLog(`API validation method: ${apiData.validationMethod}`);
        if (apiData.decodedToken) {
          addLog(`Token role: ${apiData.decodedToken.role || 'not set'}`);
        }
        
        setResults(prev => ({ 
          ...prev, 
          tokenValidation: { 
            ...prev.tokenValidation,
            api: apiData
          } 
        }));
      } catch (error) {
        addLog(`❌ Error testing token validation: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      addLog('❌ No session cookie found, skipping token validation tests');
    }
  };

  // 3. Test cookie settings
  const testCookieSettings = () => {
    addLog('3️⃣ Testing cookie settings...');
    
    const allCookies = document.cookie;
    addLog(`All cookies: ${allCookies}`);
    
    const sessionCookie = getCookie('session');
    if (sessionCookie) {
      // Try to parse secure and samesite from document.cookie
      const cookieStr = document.cookie;
      const hasSecure = cookieStr.includes('secure');
      const hasSameSite = cookieStr.includes('samesite=strict') || cookieStr.includes('SameSite=Strict');
      
      addLog(`Cookie secure flag present: ${hasSecure}`);
      addLog(`Cookie samesite=strict flag present: ${hasSameSite}`);
      
      setResults(prev => ({ 
        ...prev, 
        cookieSettings: {
          hasSecure,
          hasSameSite
        } 
      }));
    } else {
      addLog('❌ No session cookie found, skipping cookie settings test');
    }
  };

  // 4. Test custom claims
  const testCustomClaims = async () => {
    addLog('4️⃣ Testing custom claims...');
    
    if (currentUser) {
      try {
        // Get token result to check claims
        const idTokenResult = await currentUser.getIdTokenResult();
        const hasClaims = !!idTokenResult.claims;
        const hasRoleClaim = !!idTokenResult.claims.role;
        const role = idTokenResult.claims.role;
        
        addLog(`User has claims: ${hasClaims}`);
        addLog(`User has role claim: ${hasRoleClaim}`);
        addLog(`User role: ${role || 'not set'}`);
        
        // Test setting custom claims
        addLog('Testing custom claims setting API...');
        
        try {
          const response = await fetch('/api/auth/set-role-claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: currentUser.uid }),
          });
          
          const data = await response.json();
          addLog(`Set role claim API response: ${JSON.stringify(data)}`);
          
          setResults(prev => ({ 
            ...prev, 
            customClaims: {
              hasClaims,
              hasRoleClaim,
              role,
              apiResponse: data
            } 
          }));
        } catch (error) {
          addLog(`❌ Error setting custom claims: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error) {
        addLog(`❌ Error getting token claims: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      addLog('❌ No user logged in, skipping custom claims test');
    }
  };

  // 5. Test API access
  const testAPIAccess = async () => {
    addLog('5️⃣ Testing API access...');
    
    try {
      // Test roadmap API
      addLog(`Testing roadmap API for candidate ID: ${candidateId}`);
      const response = await fetch(`/api/roadmaps/${candidateId}`);
      const status = response.status;
      
      addLog(`Roadmap API status: ${status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Failed to parse JSON response' };
      }
      
      if (response.ok) {
        addLog('✅ Roadmap API access successful');
        addLog(`Roadmap data available: ${!!data.roadmap}`);
      } else {
        addLog(`❌ Roadmap API access failed: ${data.error || 'Unknown error'}`);
      }
      
      setResults(prev => ({ 
        ...prev, 
        apiAccess: {
          status,
          success: response.ok,
          data: data
        } 
      }));
    } catch (error) {
      addLog(`❌ Error accessing API: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 6. Test Firestore rules
  const testFirestoreRules = async () => {
    addLog('6️⃣ Testing Firestore rules...');
    
    try {
      // Test direct access to roadmaps collection
      addLog('Testing direct Firestore access to roadmaps collection...');
      
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateId)
        );
        
        const querySnapshot = await getDocs(roadmapQuery);
        const success = !querySnapshot.empty;
        
        addLog(`Direct Firestore query success: ${success}`);
        addLog(`Found ${querySnapshot.size} roadmap document(s)`);
        
        if (success) {
          // Try to access the document directly
          const docId = querySnapshot.docs[0].id;
          addLog(`Testing direct access to roadmap document: ${docId}`);
          
          const docSnapshot = await getDoc(doc(db, 'roadmaps', docId));
          addLog(`Document exists: ${docSnapshot.exists()}`);
        }
        
        setResults(prev => ({ 
          ...prev, 
          firestoreRules: {
            success,
            count: querySnapshot.size
          } 
        }));
      } catch (error) {
        addLog(`❌ Firestore access error: ${error instanceof Error ? error.message : String(error)}`);
        
        setResults(prev => ({ 
          ...prev, 
          firestoreRules: {
            success: false,
            error: String(error)
          } 
        }));
      }
    } catch (error) {
      addLog(`❌ Error testing Firestore rules: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 7. Test production bypass for short tokens
  const testProductionBypass = async () => {
    addLog('7️⃣ Testing production bypass for short tokens...');
    
    try {
      // Check if we're in production
      const isProd = process.env.NODE_ENV === 'production';
      addLog(`Running in production mode: ${isProd}`);
      
      if (isProd) {
        // Test accessing a protected route that should trigger the bypass
        addLog('Testing access to protected candidate detail page...');
        
        try {
          const response = await fetch(`/protected/recruiter/candidate/${candidateId}`, {
            redirect: 'manual'
          });
          
          addLog(`Protected page response status: ${response.status}`);
          addLog(`Was redirected: ${response.redirected}`);
          
          setResults(prev => ({ 
            ...prev, 
            productionBypass: {
              status: response.status,
              redirected: response.redirected
            } 
          }));
        } catch (error) {
          addLog(`❌ Error testing production bypass: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        addLog('Not in production mode, skipping production bypass test');
      }
    } catch (error) {
      addLog(`❌ Error testing production bypass: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Difference Test</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current Environment</h2>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        <p><strong>NEXT_PUBLIC_DEVELOPMENT_MODE:</strong> {process.env.NEXT_PUBLIC_DEVELOPMENT_MODE}</p>
        <p><strong>isDevelopmentMode():</strong> {isDevelopmentMode() ? 'true' : 'false'}</p>
        <p><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">User Information</h2>
        {userProfile ? (
          <>
            <p><strong>User ID:</strong> {userProfile.uid}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Role:</strong> {userProfile.role}</p>
          </>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block mb-2">
          <span className="font-bold">Test Candidate ID:</span>
          <input 
            type="text" 
            value={candidateId} 
            onChange={(e) => setCandidateId(e.target.value)} 
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
        
        <button 
          onClick={runAllTests} 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Console Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded h-96 overflow-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Test Results</h2>
          <div className="bg-white border p-4 rounded h-96 overflow-auto">
            <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
} 