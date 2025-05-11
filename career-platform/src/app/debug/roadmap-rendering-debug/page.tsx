'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc, where, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';

// Simple fallback roadmap component for comparison
const FallbackRoadmapComponent = ({ roadmap }: { roadmap: CareerRoadmap }) => {
  if (!roadmap || !roadmap.milestones) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium">Error: Invalid roadmap data</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white border border-blue-200 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Fallback Roadmap View</h3>
      
      <div className="space-y-6">
        {roadmap.milestones.map((milestone, index) => (
          <div 
            key={milestone.id || `milestone-${index}`} 
            className="p-4 bg-white shadow-sm border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-bold text-gray-800">
                {index + 1}. {milestone.title || 'Untitled Milestone'}
              </h4>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {milestone.timeframe || 'No timeframe'}
              </span>
            </div>
            
            <p className="my-2 text-gray-600">{milestone.description || 'No description provided'}</p>
            
            {milestone.skills && milestone.skills.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-1">Skills to develop:</h5>
                <div className="flex flex-wrap gap-1">
                  {milestone.skills.map((skill, i) => (
                    <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Error boundary component
class RoadmapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError: (error: Error, info: React.ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode; onError: (error: Error, info: React.ErrorInfo) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Main debug page
export default function RoadmapRenderingDebug() {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<CareerRoadmap | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [renderMode, setRenderMode] = useState<'normal' | 'fallback' | 'simplified' | 'delayed'>('normal');
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [milestoneLimit, setMilestoneLimit] = useState(1000); // Default to a high number

  // Helper for adding logs
  const addLog = (message: string) => {
    console.log(`[ROADMAP-DEBUG] ${message}`);
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Helper for adding errors
  const addError = (message: string) => {
    console.error(`[ROADMAP-DEBUG] ${message}`);
    setErrors(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Protocol 17: Device-specific Rendering - Log device info
  useEffect(() => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio,
      touchPoints: navigator.maxTouchPoints,
    };
    
    addLog(`Device info: ${JSON.stringify(deviceInfo)}`);
    setDiagnostics((prev: Record<string, any>) => ({ ...prev, deviceInfo }));
  }, []);

  // Protocol 10: Font Loading Differences
  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        addLog('All fonts loaded and ready');
        setDiagnostics((prev: Record<string, any>) => ({ 
          ...prev, 
          fonts: { 
            allLoaded: true, 
            loadedFonts: Array.from(document.fonts).filter(f => f.status === 'loaded').length 
          } 
        }));
      });
      
      document.fonts.addEventListener('loadingdone', () => {
        addLog(`Fonts loading done, loaded fonts: ${Array.from(document.fonts).filter(f => f.status === 'loaded').length}`);
      });
      
      document.fonts.addEventListener('loadingerror', (event) => {
        addError(`Font loading error: ${JSON.stringify(event)}`);
      });
    }
  }, []);

  // Protocol 14: Third-party Library Version
  useEffect(() => {
    // Log React version
    const reactVersion = React.version;
    addLog(`React version: ${reactVersion}`);
    setDiagnostics((prev: Record<string, any>) => ({ ...prev, libraries: { react: reactVersion } }));
  }, []);

  // Protocol 13: Content Security Policy
  useEffect(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      addError(`CSP Violation: ${e.violatedDirective} (blocked: ${e.blockedURI})`);
      setDiagnostics((prev: Record<string, any>) => ({ 
        ...prev, 
        csp: { 
          violations: [...(prev.csp?.violations || []), {
            directive: e.violatedDirective,
            blockedURI: e.blockedURI,
            timestamp: new Date().toISOString()
          }] 
        } 
      }));
    });
  }, []);

  // Protocol 6: Browser Caching Behavior - Test for caching issues
  useEffect(() => {
    if (selectedRoadmap) {
      addLog('Adding cache-busting parameters to stylesheets');
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          const newHref = href.includes('?') 
            ? `${href}&refresh=${Date.now()}` 
            : `${href}?refresh=${Date.now()}`;
          link.setAttribute('href', newHref);
          addLog(`Updated stylesheet: ${href} -> ${newHref}`);
        }
      });
    }
  }, [selectedRoadmap]);

  // Fetch roadmaps on load
  useEffect(() => {
    async function fetchRoadmaps() {
      addLog('Starting to fetch roadmaps');
      setLoading(true);
      
      try {
        // Protocol 1: Refresh token to ensure auth is working
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken(true);
            addLog(`Successfully refreshed ID token (length: ${token.length})`);
          } catch (err) {
            addError(`Error refreshing token: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        const roadmapsQuery = query(collection(db, 'roadmaps'), limit(10));
        const snapshot = await getDocs(roadmapsQuery);
        
        addLog(`Found ${snapshot.size} roadmaps`);
        
        const roadmapList = snapshot.docs.map(doc => ({
          id: doc.id,
          candidateId: doc.data().candidateId,
          timestamp: doc.data().createdAt?.toDate?.() || 'no timestamp',
          milestoneCount: doc.data().milestones?.length || 0
        }));
        
        setRoadmaps(roadmapList);
        
        if (roadmapList.length > 0) {
          addLog(`First roadmap ID: ${roadmapList[0].id}`);
        }
      } catch (err) {
        addError(`Error fetching roadmaps: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoadmaps();
  }, [currentUser]);

  // Protocol 4: Data Serialization Differences
  const loadRoadmap = async (roadmapId: string) => {
    addLog(`Loading roadmap: ${roadmapId}`);
    setLoading(true);
    setSelectedRoadmap(null);
    
    try {
      const docRef = doc(db, 'roadmaps', roadmapId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        addError('Roadmap not found');
        return;
      }
      
      const rawData = snapshot.data();
      addLog(`Raw roadmap data: ${Object.keys(rawData).join(', ')}`);
      
      // Protocol 1: Timestamp Handling - Log timestamp types
      if (rawData.createdAt) {
        addLog(`CreatedAt type: ${rawData.createdAt.constructor.name}, can convert: ${typeof rawData.createdAt.toDate === 'function'}`);
      }
      
      if (rawData.milestones && rawData.milestones.length > 0) {
        const firstMilestone = rawData.milestones[0];
        addLog(`First milestone keys: ${Object.keys(firstMilestone).join(', ')}`);
        
        if (firstMilestone.createdAt) {
          addLog(`Milestone timestamp type: ${firstMilestone.createdAt.constructor.name}`);
        }
      }
      
      // Test serialization
      try {
        const serialized = JSON.stringify(rawData);
        addLog(`Successfully serialized roadmap data (${serialized.length} chars)`);
      } catch (err) {
        addError(`Serialization error: ${err instanceof Error ? err.message : String(err)}`);
        
        // Find problematic path
        const findProblematicPath = (obj: any, path = '') => {
          if (typeof obj !== 'object' || obj === null) return;
          
          try {
            JSON.stringify(obj);
          } catch (e) {
            Object.keys(obj).forEach(key => {
              try {
                JSON.stringify(obj[key]);
              } catch (err) {
                addError(`Cannot serialize at: ${path}.${key}`);
                findProblematicPath(obj[key], `${path}.${key}`);
              }
            });
          }
        };
        
        findProblematicPath(rawData, 'roadmap');
      }
      
      // Process the data
      let processedMilestones: any[] = [];
      
      if (rawData.milestones && Array.isArray(rawData.milestones)) {
        // Protocol 15: Handle only limited milestones
        const limitedMilestones = rawData.milestones.slice(0, milestoneLimit);
        addLog(`Processing ${limitedMilestones.length} of ${rawData.milestones.length} milestones`);
        
        try {
          processedMilestones = limitedMilestones.map((milestone, index) => {
            // Protocol 1: Carefully handle timestamps
            let createdAt;
            if (milestone.createdAt instanceof Date) {
              createdAt = milestone.createdAt;
              addLog(`Milestone ${index} createdAt is already a Date`);
            } else if (milestone.createdAt && typeof milestone.createdAt.toDate === 'function') {
              try {
                createdAt = milestone.createdAt.toDate();
                addLog(`Converted timestamp for milestone ${index}`);
              } catch (err) {
                addError(`Error converting timestamp for milestone ${index}: ${err instanceof Error ? err.message : String(err)}`);
                createdAt = new Date();
              }
            } else {
              addLog(`No valid timestamp for milestone ${index}, using current date`);
              createdAt = new Date();
            }
            
            return {
              ...milestone,
              id: milestone.id || `milestone-${Math.random().toString(36).substr(2, 9)}`,
              createdAt,
              // Ensure all required fields have defaults
              title: milestone.title || 'Untitled',
              description: milestone.description || 'No description',
              timeframe: milestone.timeframe || 'No timeframe',
              completed: !!milestone.completed,
              skills: Array.isArray(milestone.skills) ? milestone.skills : []
            };
          });
          
          addLog(`Successfully processed ${processedMilestones.length} milestones`);
        } catch (err) {
          addError(`Error processing milestones: ${err instanceof Error ? err.message : String(err)}`);
          processedMilestones = [];
        }
      } else {
        addError(`Invalid milestones data: ${typeof rawData.milestones}`);
      }
      
      // Create the final roadmap object
      const roadmap: CareerRoadmap = {
        id: snapshot.id,
        candidateId: rawData.candidateId || 'unknown',
        milestones: processedMilestones,
        createdAt: rawData.createdAt?.toDate?.() || new Date(),
        updatedAt: rawData.updatedAt?.toDate?.() || new Date()
      };
      
      // Data structure validation
      const dataValidation = {
        id: typeof roadmap.id === 'string',
        candidateId: typeof roadmap.candidateId === 'string',
        milestones: Array.isArray(roadmap.milestones),
        milestonesLength: roadmap.milestones.length,
        createdAt: roadmap.createdAt instanceof Date,
        updatedAt: roadmap.updatedAt instanceof Date
      };
      
      setDiagnostics((prev: Record<string, any>) => ({ ...prev, dataValidation }));
      addLog(`Data validation: ${JSON.stringify(dataValidation)}`);
      
      // Set the roadmap in state
      setSelectedRoadmap(roadmap);
      
    } catch (err) {
      addError(`Error loading roadmap: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Protocol 5: Content Loading Order - handle errors in the component
  const handleComponentError = (error: Error, info: React.ErrorInfo) => {
    addError(`Component error: ${error.message}`);
    addError(`Component stack: ${info.componentStack}`);
    
    setDiagnostics((prev: Record<string, any>) => ({ 
      ...prev, 
      componentErrors: [...(prev.componentErrors || []), { 
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack 
      }] 
    }));
  };

  // Protocol 9: Memory Constraints
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.performance && (window.performance as any).memory) {
        const memory = (window.performance as any).memory;
        addLog(`Memory usage: ${Math.round(memory.usedJSHeapSize / (1024 * 1024))}MB of ${Math.round(memory.jsHeapSizeLimit / (1024 * 1024))}MB`);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Protocol 2: CSS Purging - Create simplified component
  const getSimplifiedRoadmap = () => {
    if (!selectedRoadmap) return null;
    
    return {
      ...selectedRoadmap,
      milestones: selectedRoadmap.milestones.map(m => ({
        ...m,
        // Strip down to essentials
        id: m.id,
        title: m.title,
        description: m.description,
        timeframe: m.timeframe,
        completed: m.completed,
        skills: m.skills?.slice(0, 3) || []
      }))
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Roadmap Rendering Debug</h1>
      
      {/* Authentication status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <div>
          <p><strong>User:</strong> {currentUser ? `✅ ${currentUser.email}` : '❌ Not authenticated'}</p>
          <p><strong>Role:</strong> {userProfile?.role || 'Unknown'}</p>
        </div>
      </div>
      
      {/* Debug controls */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Controls</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Render Mode:</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-1 rounded text-sm ${renderMode === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setRenderMode('normal')}
              >
                Normal
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${renderMode === 'fallback' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setRenderMode('fallback')}
              >
                Fallback
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${renderMode === 'simplified' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setRenderMode('simplified')}
              >
                Simplified
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${renderMode === 'delayed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setRenderMode('delayed')}
              >
                Delayed
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Milestone Limit:</h3>
            <div className="flex items-center gap-2">
              <input 
                type="range" 
                min="1" 
                max={selectedRoadmap?.milestones?.length || 10} 
                value={milestoneLimit} 
                onChange={(e) => setMilestoneLimit(parseInt(e.target.value))}
                className="w-48"
              />
              <span>{milestoneLimit} / {selectedRoadmap?.milestones?.length || 0}</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Actions:</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                onClick={() => {
                  if (selectedRoadmap) {
                    addLog('Forcing re-render');
                    setSelectedRoadmap({...selectedRoadmap});
                  }
                }}
                disabled={!selectedRoadmap}
              >
                Force Re-render
              </button>
              <button 
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  addLog('Cleared local/session storage');
                }}
              >
                Clear Storage
              </button>
              <button 
                className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                onClick={() => {
                  setLogs([]);
                  setErrors([]);
                  addLog('Cleared logs');
                }}
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Errors ({errors.length})</h2>
          <div className="max-h-40 overflow-y-auto text-red-700 text-sm">
            {errors.map((error, i) => (
              <div key={i} className="mb-1">{error}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available roadmaps */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Available Roadmaps</h2>
        
        {loading && !selectedRoadmap ? (
          <div className="p-4 bg-blue-50 rounded-lg">Loading roadmaps...</div>
        ) : roadmaps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Candidate ID</th>
                  <th className="px-4 py-2 text-left">Milestones</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((roadmap) => (
                  <tr key={roadmap.id} className="border-t border-gray-200">
                    <td className="px-4 py-2 font-mono text-sm">{roadmap.id}</td>
                    <td className="px-4 py-2 font-mono text-sm">{roadmap.candidateId}</td>
                    <td className="px-4 py-2">{roadmap.milestoneCount}</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => loadRoadmap(roadmap.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg">No roadmaps found</div>
        )}
      </div>
      
      {/* Roadmap display area */}
      {selectedRoadmap && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Roadmap Preview</h2>
          
          {loading ? (
            <div className="p-4 bg-blue-50 rounded-lg">Loading roadmap...</div>
          ) : (
            <div>
              {/* Roadmap info */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4">
                <h3 className="font-medium mb-2">Roadmap Info</h3>
                <p><strong>ID:</strong> {selectedRoadmap.id}</p>
                <p><strong>Candidate ID:</strong> {selectedRoadmap.candidateId}</p>
                <p><strong>Milestones:</strong> {selectedRoadmap.milestones.length}</p>
                <p><strong>Created:</strong> {selectedRoadmap.createdAt.toLocaleString()}</p>
              </div>
              
              {/* Component render */}
              <div className="roadmap-container p-1 border border-gray-300 rounded-lg">
                {/* Protocol 5: Dynamic Content Loading - Wait before rendering if in delayed mode */}
                {renderMode === 'delayed' ? (
                  <DelayedRender delay={2000}>
                    <RoadmapDisplay 
                      roadmap={selectedRoadmap} 
                      renderMode={'normal'} 
                      onError={handleComponentError}
                    />
                  </DelayedRender>
                ) : (
                  <RoadmapDisplay 
                    roadmap={renderMode === 'simplified' ? getSimplifiedRoadmap() || selectedRoadmap : selectedRoadmap} 
                    renderMode={renderMode} 
                    onError={handleComponentError}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Diagnostics display */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Diagnostics</h2>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      </div>
      
      {/* Logs */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Debug Logs ({logs.length})</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component for delayed rendering
const DelayedRender: React.FC<{children: React.ReactNode; delay: number}> = ({ children, delay }) => {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!shouldRender) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading with delay ({delay}ms)...</span>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Helper component for roadmap display
const RoadmapDisplay: React.FC<{
  roadmap: CareerRoadmap; 
  renderMode: string;
  onError: (error: Error, info: React.ErrorInfo) => void;
}> = ({ roadmap, renderMode, onError }) => {
  // Protocol 2: CSS Purging Investigation - Directly add CSS classes with !important
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .roadmap-container * {
        visibility: visible !important;
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Protocol 16: Disable animations for testing
  useEffect(() => {
    if (renderMode === 'simplified') {
      const style = document.createElement('style');
      style.textContent = `
        .roadmap-container * {
          animation: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [renderMode]);
  
  if (renderMode === 'fallback') {
    return <FallbackRoadmapComponent roadmap={roadmap} />;
  }
  
  return (
    <div className="roadmap-wrapper" style={{minHeight: '200px'}}>
      <RoadmapErrorBoundary
        fallback={<FallbackRoadmapComponent roadmap={roadmap} />}
        onError={onError}
      >
        <CareerRoadmapComponent 
          roadmap={roadmap}
          isEditable={false}
        />
      </RoadmapErrorBoundary>
    </div>
  );
}; 