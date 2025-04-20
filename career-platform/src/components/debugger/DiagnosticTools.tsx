'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  id: string;
  type: string;
  name: string;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function DiagnosticTools() {
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailedView, setDetailedView] = useState<TestResult | null>(null);
  const [fullLogs, setFullLogs] = useState<string[]>([]);

  // Toggle visibility with Alt+D (for diagnostics)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'g') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const log = (message: string) => {
    console.log(`[Diagnostics] ${message}`);
    setFullLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const addResult = (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const newResult = {
      ...result,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString()
    };
    setResults(prev => [newResult, ...prev]);
    return newResult;
  };

  const clearResults = () => {
    setResults([]);
    setDetailedView(null);
    setFullLogs([]);
  };

  // Test direct OPTIONS request (preflight simulation)
  const testPreflight = async () => {
    log("Testing OPTIONS preflight request...");
    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const success = response.ok;
      
      addResult({
        type: 'cors',
        name: 'OPTIONS Preflight Request',
        success,
        message: success 
          ? 'Preflight request succeeded' 
          : `Preflight failed with status ${response.status}`,
        details: {
          status: response.status,
          headers,
          hasAccessControlAllowOrigin: !!headers['access-control-allow-origin'],
          hasAccessControlAllowMethods: !!headers['access-control-allow-methods'],
          allowsPost: headers['access-control-allow-methods']?.includes('POST') || false
        }
      });

      return success;
    } catch (error: any) {
      log(`Error in preflight test: ${error.message}`);
      addResult({
        type: 'cors',
        name: 'OPTIONS Preflight Request',
        success: false,
        message: `Error: ${error.message}`,
        details: { error: error.toString() }
      });
      return false;
    }
  };

  // Test simple POST request
  const testDirectPost = async () => {
    log("Testing direct POST request...");
    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeText: 'Test resume content for diagnosis' })
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let responseText;
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = "Unable to read response text";
      }

      const success = response.ok;
      
      addResult({
        type: 'request',
        name: 'Direct POST Request',
        success,
        message: success 
          ? 'POST request succeeded' 
          : `POST request failed with status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers,
          responseText
        }
      });

      return success;
    } catch (error: any) {
      log(`Error in direct POST test: ${error.message}`);
      addResult({
        type: 'request',
        name: 'Direct POST Request',
        success: false,
        message: `Error: ${error.message}`,
        details: { error: error.toString() }
      });
      return false;
    }
  };

  // Test with different headers to isolate CORS issues
  const testCorsVariations = async () => {
    log("Testing different header combinations for CORS issues...");
    
    // Test headers variations with proper typing
    const variations = [
      {
        name: "No Origin",
        headers: { 'Content-Type': 'application/json' } as Record<string, string>
      },
      {
        name: "With Origin",
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        } as Record<string, string>
      },
      {
        name: "With X-Requested-With",
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        } as Record<string, string>
      },
      {
        name: "With Credentials",
        headers: { 
          'Content-Type': 'application/json'
        } as Record<string, string>,
        credentials: 'include' as RequestCredentials
      }
    ];

    for (const variation of variations) {
      log(`Testing variation: ${variation.name}`);
      try {
        const response = await fetch('/api/analyze-resume', {
          method: 'POST',
          headers: variation.headers,
          credentials: variation.credentials,
          body: JSON.stringify({ resumeText: 'Test resume content' })
        });

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        const success = response.ok;
        
        addResult({
          type: 'cors-variation',
          name: `CORS Variation: ${variation.name}`,
          success,
          message: success 
            ? `${variation.name} succeeded` 
            : `${variation.name} failed with status ${response.status}`,
          details: {
            variation,
            status: response.status,
            headers
          }
        });
      } catch (error: any) {
        log(`Error in CORS variation test (${variation.name}): ${error.message}`);
        addResult({
          type: 'cors-variation',
          name: `CORS Variation: ${variation.name}`,
          success: false,
          message: `Error: ${error.message}`,
          details: { variation, error: error.toString() }
        });
      }
    }
  };

  // Test middleware by checking different paths
  const testMiddleware = async () => {
    log("Testing middleware impact on different paths...");
    
    // Test paths to check if middleware is causing issues
    const paths = [
      {
        name: "Normal API endpoint", 
        path: "/api/test"
      },
      {
        name: "Resume API with query param", 
        path: "/api/analyze-resume?debug=true"
      },
      {
        name: "API root", 
        path: "/api"
      }
    ];

    for (const { name, path } of paths) {
      log(`Testing path: ${name} (${path})`);
      try {
        const response = await fetch(path, { method: 'GET' });
        
        const success = response.status !== 405; // We're testing if it's NOT a 405
        
        addResult({
          type: 'middleware',
          name: `Middleware Test: ${name}`,
          success,
          message: success 
            ? `Path ${path} does not return 405` 
            : `Path ${path} returns 405 - likely middleware issue`,
          details: {
            path,
            status: response.status,
            statusText: response.statusText
          }
        });
      } catch (error: any) {
        log(`Error in middleware test (${name}): ${error.message}`);
        addResult({
          type: 'middleware',
          name: `Middleware Test: ${name}`,
          success: false,
          message: `Error: ${error.message}`,
          details: { path, error: error.toString() }
        });
      }
    }
  };

  // Test HTTP Method Handling
  const testHttpMethods = async () => {
    log("Testing different HTTP methods...");
    
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    
    for (const method of methods) {
      log(`Testing HTTP method: ${method}`);
      try {
        const response = await fetch('/api/analyze-resume', { 
          method, 
          headers: { 'Content-Type': 'application/json' },
          body: method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' 
            ? JSON.stringify({ resumeText: 'Test' }) 
            : undefined
        });
        
        const success = response.status !== 405;
        
        addResult({
          type: 'http-method',
          name: `HTTP Method: ${method}`,
          success,
          message: success 
            ? `Method ${method} accepted` 
            : `Method ${method} rejected with 405`,
          details: {
            method,
            status: response.status,
            statusText: response.statusText
          }
        });
      } catch (error: any) {
        log(`Error in HTTP method test (${method}): ${error.message}`);
        addResult({
          type: 'http-method',
          name: `HTTP Method: ${method}`,
          success: false,
          message: `Error: ${error.message}`,
          details: { method, error: error.toString() }
        });
      }
    }
  };
  
  // Environment check
  const testEnvironment = async () => {
    log("Testing environment variables and configuration...");
    
    try {
      const response = await fetch('/api/debug/env');
      const success = response.ok;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = 'Unable to parse response';
      }
      
      addResult({
        type: 'environment',
        name: 'Environment Variables',
        success,
        message: success 
          ? 'Environment variables check succeeded' 
          : `Environment check failed with status ${response.status}`,
        details: { data }
      });
    } catch (error: any) {
      log(`Error in environment test: ${error.message}`);
      addResult({
        type: 'environment',
        name: 'Environment Variables',
        success: false,
        message: `Error: ${error.message}`,
        details: { error: error.toString() }
      });
    }
  };

  // Run all diagnostic tests
  const runDiagnostics = async () => {
    setLoading(true);
    clearResults();
    log("Starting comprehensive diagnostics...");

    // Perform tests in sequence
    await testEnvironment();
    await testPreflight();
    await testDirectPost();
    await testCorsVariations();
    await testMiddleware();
    await testHttpMethods();
    
    log("Diagnostics completed. Analyzing results...");
    
    // Analyze the results to determine the likely cause
    const corsIssues = results.filter(r => r.type === 'cors' && !r.success).length > 0;
    const middlewareIssues = results.filter(r => r.type === 'middleware' && !r.success).length > 0;
    const methodIssues = results.filter(r => r.type === 'http-method' && r.name.includes('POST') && !r.success).length > 0;
    const envIssues = results.filter(r => r.type === 'environment' && !r.success).length > 0;
    
    let diagnosis = "⚠️ Multiple issues detected:";
    let diagnosisCount = 0;
    
    if (corsIssues) {
      diagnosis += "\n- CORS configuration issue: OPTIONS preflight request is failing";
      diagnosisCount++;
    }
    
    if (middlewareIssues) {
      diagnosis += "\n- Middleware conflict: Middleware may be incorrectly handling API routes";
      diagnosisCount++;
    }
    
    if (methodIssues) {
      diagnosis += "\n- HTTP method handling: POST method is explicitly rejected";
      diagnosisCount++;
    }
    
    if (envIssues) {
      diagnosis += "\n- Environment configuration: API endpoints might lack necessary environment variables";
      diagnosisCount++;
    }
    
    if (diagnosisCount === 0) {
      diagnosis = "🔍 No clear issue pattern detected. Check detailed test results for more insights.";
    }
    
    addResult({
      type: 'diagnosis',
      name: 'Final Diagnosis',
      success: diagnosisCount === 0,
      message: diagnosis
    });
    
    setLoading(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold">
            Advanced API Diagnostics (Alt+G)
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            Close
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Controls and Results list */}
          <div className="w-1/3 bg-gray-50 p-4 flex flex-col border-r">
            <div className="mb-6">
              <button
                onClick={runDiagnostics}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-2 disabled:bg-blue-300"
              >
                {loading ? "Running Diagnostics..." : "Run Comprehensive Diagnostics"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={testPreflight}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-2 rounded text-sm disabled:bg-gray-400"
                >
                  Test CORS
                </button>
                <button
                  onClick={testDirectPost}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-2 rounded text-sm disabled:bg-gray-400"
                >
                  Test POST
                </button>
                <button
                  onClick={testMiddleware}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-2 rounded text-sm disabled:bg-gray-400"
                >
                  Test Middleware
                </button>
                <button
                  onClick={testEnvironment}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-2 rounded text-sm disabled:bg-gray-400"
                >
                  Test Environment
                </button>
              </div>
            </div>

            <div className="text-sm font-medium mb-2 flex justify-between">
              <span>Test Results</span>
              {results.length > 0 && (
                <button 
                  onClick={clearResults}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {results.length === 0 ? (
                <div className="text-gray-500 text-center py-10">
                  Run diagnostics to see results here
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map(result => (
                    <div 
                      key={result.id}
                      className={`p-2 rounded cursor-pointer ${
                        detailedView?.id === result.id 
                          ? 'bg-blue-100 border-blue-300 border' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => setDetailedView(result)}
                    >
                      <div className="flex items-center">
                        <span className={`mr-2 text-lg ${
                          result.success ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {result.success ? '✓' : '✗'}
                        </span>
                        <span className="font-medium truncate">{result.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {result.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Detailed view or logs */}
          <div className="flex-1 p-4 overflow-y-auto">
            {detailedView ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  {detailedView.name}
                </h3>
                
                <div className="mb-4">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    detailedView.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {detailedView.success ? 'Success' : 'Failed'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(detailedView.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">Test Type</h4>
                  <div className="bg-gray-100 p-2 rounded">
                    {detailedView.type}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-1">Message</h4>
                  <div className="bg-gray-100 p-2 rounded whitespace-pre-line">
                    {detailedView.message}
                  </div>
                </div>
                
                {detailedView.details && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Details</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(detailedView.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                <button
                  onClick={() => setDetailedView(null)}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Back to all results
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">Diagnostic Logs</h3>
                
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-y-auto h-full max-h-[calc(90vh-8rem)]">
                  {fullLogs.length === 0 ? (
                    <div className="text-gray-400 italic">
                      No logs yet. Run diagnostics to see logs here.
                    </div>
                  ) : (
                    fullLogs.map((log, i) => (
                      <div key={i} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 