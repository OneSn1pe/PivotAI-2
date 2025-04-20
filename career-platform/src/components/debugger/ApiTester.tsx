'use client';

import React, { useState } from 'react';

interface ApiTestRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
}

export default function ApiTester() {
  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState<ApiTestRequest>({
    url: '/api/analyze-resume',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText: 'Sample resume text for testing...' }, null, 2),
  });
  const [response, setResponse] = useState<ApiTestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingHeaders, setEditingHeaders] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const addHeader = () => {
    if (headerKey.trim() === '') return;
    
    setRequest({
      ...request,
      headers: {
        ...request.headers,
        [headerKey]: headerValue,
      },
    });
    
    setHeaderKey('');
    setHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...request.headers };
    delete newHeaders[key];
    setRequest({
      ...request,
      headers: newHeaders,
    });
  };

  const formatBody = () => {
    try {
      const parsed = JSON.parse(request.body);
      setRequest({
        ...request,
        body: JSON.stringify(parsed, null, 2),
      });
    } catch (e) {
      // Not JSON or invalid JSON, leave as is
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      let reqHeaders: HeadersInit = {};
      // Convert headers object to fetch-compatible format
      Object.entries(request.headers).forEach(([key, value]) => {
        reqHeaders[key] = value;
      });

      let reqBody: BodyInit | null = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        reqBody = request.body;
      }

      const res = await fetch(request.url, {
        method: request.method,
        headers: reqHeaders,
        body: reqBody,
      });

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Try to parse response as JSON
      let responseBody = '';
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const jsonBody = await res.json();
          responseBody = JSON.stringify(jsonBody, null, 2);
        } else {
          responseBody = await res.text();
        }
      } catch (e) {
        responseBody = await res.text();
      }

      const endTime = performance.now();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        timeMs: Math.round(endTime - startTime),
      });
    } catch (error: any) {
      const endTime = performance.now();
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: error.message || 'Failed to fetch',
        timeMs: Math.round(endTime - startTime),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 't') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">API Tester (Alt+T)</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col md:flex-row gap-4">
          {/* Request Panel */}
          <div className="w-full md:w-1/2 flex flex-col">
            <h3 className="font-semibold mb-2">Request</h3>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={request.url}
                onChange={(e) => setRequest({ ...request, url: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                value={request.method}
                onChange={(e) => setRequest({ ...request, method: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Headers</label>
                <button
                  onClick={() => setEditingHeaders(!editingHeaders)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {editingHeaders ? 'Done' : 'Edit'}
                </button>
              </div>
              
              {editingHeaders && (
                <div className="mb-2 flex">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={headerKey}
                    onChange={(e) => setHeaderKey(e.target.value)}
                    className="w-1/3 p-2 border rounded-l"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    className="w-1/3 p-2 border-t border-b"
                  />
                  <button
                    onClick={addHeader}
                    className="w-1/3 p-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              )}
              
              <div className="border rounded p-2 h-24 overflow-y-auto bg-gray-50">
                {Object.entries(request.headers).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm mb-1">
                    <div>
                      <span className="font-mono text-gray-800">{key}:</span>{' '}
                      <span className="text-gray-600">{value}</span>
                    </div>
                    {editingHeaders && (
                      <button
                        onClick={() => removeHeader(key)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {Object.keys(request.headers).length === 0 && (
                  <div className="text-gray-400 text-sm">No headers defined</div>
                )}
              </div>
            </div>
            
            <div className="mb-3 flex-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Body</label>
                <button
                  onClick={formatBody}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Format JSON
                </button>
              </div>
              <textarea
                value={request.body}
                onChange={(e) => setRequest({ ...request, body: e.target.value })}
                className="w-full p-2 border rounded font-mono text-sm h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={sendRequest}
              disabled={loading}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
          
          {/* Response Panel */}
          <div className="w-full md:w-1/2 flex flex-col">
            <h3 className="font-semibold mb-2">Response</h3>
            
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {!loading && !response && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Send a request to see the response
              </div>
            )}
            
            {!loading && response && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="inline-block px-2 py-1 rounded text-sm mr-2" 
                            style={{
                              backgroundColor: 
                                response.status >= 200 && response.status < 300 ? '#d1fae5' :
                                response.status >= 300 && response.status < 400 ? '#fef3c7' :
                                '#fee2e2',
                              color:
                                response.status >= 200 && response.status < 300 ? '#065f46' :
                                response.status >= 300 && response.status < 400 ? '#92400e' :
                                '#b91c1c'
                            }}>
                        {response.status}
                      </span>
                      <span className="text-sm text-gray-600">{response.statusText}</span>
                    </div>
                    <span className="text-xs text-gray-500">{response.timeMs}ms</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Headers</div>
                  <div className="border rounded p-2 h-24 overflow-y-auto bg-gray-50 text-sm">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="font-mono text-gray-800">{key}:</span>{' '}
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                    {Object.keys(response.headers).length === 0 && (
                      <div className="text-gray-400">No headers received</div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">Body</div>
                  <pre className="border rounded p-2 bg-gray-50 overflow-auto h-40 text-sm font-mono">
                    {response.body || '<Empty response>'}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 