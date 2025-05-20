import React, { useState, useEffect } from 'react';
import { CareerRoadmap as RoadmapType, Milestone } from '@/types/user';
import { safeTimestampToDate } from '@/utils/firebaseUtils';

interface CareerPathProps {
  roadmap: RoadmapType;
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => Promise<void>;
  isEditable?: boolean;
}

const CareerPath: React.FC<CareerPathProps> = ({ 
  roadmap, 
  onMilestoneToggle,
  isEditable = false
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [localToggling, setLocalToggling] = useState<Record<string, boolean>>({});
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  // Track if we have sanitized the roadmap data
  const [sanitizedRoadmap, setSanitizedRoadmap] = useState<RoadmapType | null>(null);

  // Sanitize roadmap data on mount - handle timestamps and ensure all required fields
  useEffect(() => {
    if (!roadmap) return;

    try {
      // Clone the roadmap to avoid mutating props
      const sanitized: RoadmapType = {
        ...roadmap,
        id: roadmap.id || `roadmap-${Math.random().toString(36).substring(2, 9)}`,
        candidateId: roadmap.candidateId || '',
        // Convert timestamps
        createdAt: safeTimestampToDate(roadmap.createdAt) || new Date(),
        updatedAt: safeTimestampToDate(roadmap.updatedAt) || new Date(),
        milestones: []
      };

      // Process milestones with safe timestamp conversion
      if (Array.isArray(roadmap.milestones)) {
        sanitized.milestones = roadmap.milestones.map((milestone, index) => {
          // Ensure milestone has an ID
          const id = milestone.id || `milestone-${Math.random().toString(36).substring(2, 9)}`;
          
          // Convert any timestamp fields
          let createdAt = safeTimestampToDate(milestone.createdAt) || new Date();
          
          return {
            ...milestone,
            id,
            createdAt,
            // Ensure required fields have defaults
            title: milestone.title || 'Untitled Milestone',
            description: milestone.description || 'No description provided',
            timeframe: milestone.timeframe || 'No timeframe specified',
            completed: !!milestone.completed,
            skills: Array.isArray(milestone.skills) ? milestone.skills : [],
            resources: Array.isArray(milestone.resources) ? milestone.resources : []
          };
        });
      }

      console.log('[CAREER-PATH] Sanitized roadmap data:', {
        id: sanitized.id,
        milestonesCount: sanitized.milestones.length,
        timestamps: {
          createdAt: sanitized.createdAt,
          updatedAt: sanitized.updatedAt
        }
      });

      setSanitizedRoadmap(sanitized);
    } catch (error) {
      console.error('[CAREER-PATH] Error sanitizing roadmap data:', error);
      setErrorInfo(`Failed to process career path data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [roadmap]);

  // Debug logging
  useEffect(() => {
    console.log('[CAREER-PATH] Component mounted with roadmap:', {
      id: roadmap?.id,
      candidateId: roadmap?.candidateId,
      milestonesCount: roadmap?.milestones?.length || 0,
      milestonesValid: Array.isArray(roadmap?.milestones)
    });

    // Report render success after component is mounted
    const timer = setTimeout(() => {
      console.log('[CAREER-PATH] Component successfully rendered');
      setRendered(true);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      console.log('[CAREER-PATH] Component unmounted');
    };
  }, [roadmap]);

  // Toggle milestone expansion to show/hide details
  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // Toggle milestone completion status
  const toggleComplete = async (milestone: Milestone) => {
    if (!onMilestoneToggle || !isEditable) return;
    
    setLoading(prev => ({ ...prev, [milestone.id]: true }));
    
    try {
      await onMilestoneToggle(milestone.id, !milestone.completed);
    } catch (error) {
      console.error('[CAREER-PATH] Failed to update milestone:', error);
      setErrorInfo(`Failed to update milestone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, [milestone.id]: false }));
    }
  };

  // Use sanitized roadmap data if available, otherwise use original
  const roadmapData = sanitizedRoadmap || roadmap;

  // Sort milestones by timeframe if possible
  let sortedMilestones: Milestone[] = [];
  try {
    if (roadmapData && Array.isArray(roadmapData.milestones)) {
      sortedMilestones = [...roadmapData.milestones].sort((a, b) => {
        // If timeframes are numbers (e.g., "3 months"), try to sort numerically
        const aMonths = parseInt(a.timeframe?.match?.(/(\d+)/)?.[1] || '0');
        const bMonths = parseInt(b.timeframe?.match?.(/(\d+)/)?.[1] || '0');
    
        if (aMonths && bMonths) {
          return aMonths - bMonths;
        }
        
        // Fallback to alphabetical sort
        return (a.timeframe || '').localeCompare(b.timeframe || '');
      });
    }
  } catch (error) {
    console.error('[CAREER-PATH] Error sorting milestones:', error);
    setErrorInfo(`Error processing milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Use the original milestones array if sorting fails
    sortedMilestones = roadmapData?.milestones || [];
  }

  // Replace the renderMilestone function with a more compact one
  const renderMilestone = (milestone: Milestone, index: number) => {
    try {
      const isExpanded = expandedMilestones[milestone.id] || false;
      
      return (
        <div 
          key={milestone.id || `milestone-${index}`} 
          className={`bg-white rounded-lg shadow-card border ${
            milestone.completed ? 'border-teal-300' : 'border-slate-200'
          } transition-all duration-300 hover:shadow-card-hover h-full ${
            isExpanded ? 'sm:col-span-2 lg:col-span-3 xl:col-span-2 row-span-2' : ''
          }`}
          style={{
            transition: 'all 0.3s ease-in-out',
            transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
            zIndex: isExpanded ? 10 : 1
          }}
        >
          <div className={`h-2 w-full rounded-t-lg ${
            milestone.completed ? 'bg-emerald-500' : 'bg-teal-600'
          }`}></div>
          
          <div className="p-4">
            <div 
              className="flex justify-between items-start mb-3 cursor-pointer"
              onClick={() => toggleExpand(milestone.id)}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(milestone.id);
                }
              }}
            >
              <h3 className="text-base font-semibold text-slate-800 font-inter pr-2">{milestone.title || 'Untitled Milestone'}</h3>
              <div className="flex items-center">
                <span className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full border border-slate-200 flex-shrink-0 mr-2">{milestone.timeframe || 'No timeframe'}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
              <p className="text-sm text-slate-600 mb-4">{milestone.description || 'No description provided'}</p>
              
              {/* Skills needed for milestone - show all when expanded */}
              {milestone.skills && milestone.skills.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Skills to develop:</h4>
                  <div className="flex flex-wrap gap-1">
                    {milestone.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Skills to develop:</h4>
                  <p className="text-xs text-slate-500 italic">No specific skills listed for this milestone.</p>
                </div>
              )}
              
              {/* Resources with links - show all when expanded */}
              {milestone.resources && milestone.resources.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Resources:</h4>
                  <div className="space-y-3">
                    {milestone.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-teal-700 hover:text-teal-800 text-xs font-medium mb-1"
                        >
                          <span className="mr-1">
                            {resource.type === 'article' && '📄'}
                            {resource.type === 'video' && '🎥'}
                            {resource.type === 'course' && '📚'}
                            {resource.type === 'book' && '📖'}
                            {resource.type === 'documentation' && '📋'}
                            {!['article', 'video', 'course', 'book', 'documentation'].includes(resource.type) && '🔗'}
                          </span>
                          {resource.title}
                        </a>
                        {resource.usageGuide ? (
                          <div className="mt-1">
                            <h5 className="text-xs font-medium text-slate-700 mb-1">How to use this resource effectively:</h5>
                            <p className="text-xs text-slate-600">{resource.usageGuide}</p>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <h5 className="text-xs font-medium text-slate-700 mb-1">Usage guide:</h5>
                            {resource.type === 'article' && (
                              <p className="text-xs text-slate-600">
                                Read this article thoroughly and take notes on key points. Try to apply the concepts discussed to your current skill development. Consider creating a summary to reinforce your understanding.
                              </p>
                            )}
                            {resource.type === 'video' && (
                              <p className="text-xs text-slate-600">
                                Watch the complete video, pausing to take notes on important concepts. Consider implementing what you learn in a small practice project to reinforce your understanding.
                              </p>
                            )}
                            {resource.type === 'course' && (
                              <p className="text-xs text-slate-600">
                                Follow this course from start to finish, completing all exercises and projects. Set a consistent schedule and allocate dedicated time each week to make steady progress.
                              </p>
                            )}
                            {resource.type === 'book' && (
                              <p className="text-xs text-slate-600">
                                Read thoroughly, taking notes on key concepts. Consider creating a study group to discuss chapters or implementing code examples as you progress through the material.
                              </p>
                            )}
                            {resource.type === 'documentation' && (
                              <p className="text-xs text-slate-600">
                                Use as a reference while working on projects. Focus on sections most relevant to your current skills gap. Practice implementing examples to solidify your understanding.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Resources:</h4>
                  <p className="text-xs text-slate-500 italic">No resources listed for this milestone.</p>
                </div>
              )}
              
              {/* Minimize button */}
              <div className="text-center mt-4">
                <button 
                  onClick={() => toggleExpand(milestone.id)}
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center justify-center w-full"
                  aria-label="Minimize milestone details"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3 mr-1 rotate-180" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Minimize
                </button>
              </div>
            </div>
            
            {/* Non-expanded view - preview content */}
            <div className={`transition-all duration-300 ${isExpanded ? 'hidden' : 'block'}`}>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{milestone.description || 'No description provided'}</p>
              
              {/* Skills preview */}
              {milestone.skills && milestone.skills.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Skills to develop:</h4>
                  <div className="flex flex-wrap gap-1">
                    {milestone.skills.slice(0, 3).map((skill, skillIndex) => (
                      <span key={skillIndex} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs border border-slate-200">
                        {skill}
                      </span>
                    ))}
                    {milestone.skills.length > 3 && (
                      <span className="text-xs text-slate-500">+{milestone.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Skills to develop:</h4>
                  <p className="text-xs text-slate-500 italic">No specific skills listed for this milestone.</p>
                </div>
              )}
              
              {/* Resources preview */}
              {milestone.resources && milestone.resources.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Resources:</h4>
                  <div className="space-y-1">
                    {milestone.resources.slice(0, 3).map((resource, resourceIndex) => (
                      <a
                        key={resourceIndex}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-teal-700 hover:text-teal-800 text-xs truncate"
                      >
                        <span className="mr-1">
                          {resource.type === 'article' && '📄'}
                          {resource.type === 'video' && '🎥'}
                          {resource.type === 'course' && '📚'}
                          {resource.type === 'book' && '📖'}
                          {resource.type === 'documentation' && '📋'}
                          {!['article', 'video', 'course', 'book', 'documentation'].includes(resource.type) && '🔗'}
                        </span>
                        {resource.title}
                      </a>
                    ))}
                    {milestone.resources.length > 3 && (
                      <p className="text-xs text-slate-500">+{milestone.resources.length - 3} more resources</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="font-medium text-xs text-slate-700 font-inter mb-2">Resources:</h4>
                  <p className="text-xs text-slate-500 italic">No resources listed for this milestone.</p>
                </div>
              )}
            </div>
            
            {/* Hint to click for more details */}
            <div className={`text-center mt-2 mb-1 ${isExpanded ? 'hidden' : 'block'}`}>
              <button 
                onClick={() => toggleExpand(milestone.id)}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center justify-center w-full"
              >
                Click to see full details
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-3 w-3 ml-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Completion checkbox */}
            {isEditable && (
              <div className="flex items-center pt-2 border-t border-slate-100 mt-3">
                <input
                  type="checkbox"
                  id={`milestone-${milestone.id}`}
                  checked={milestone.completed}
                  onChange={(e) => {
                    if (onMilestoneToggle) {
                      const checked = e.target.checked;
                      setLocalToggling((prev) => ({ ...prev, [milestone.id]: true }));
                      
                      onMilestoneToggle(milestone.id, checked)
                        .then(() => {
                          setLocalToggling((prev) => ({ ...prev, [milestone.id]: false }));
                        })
                        .catch((err) => {
                          console.error('Error toggling milestone:', err);
                          setLocalToggling((prev) => ({ ...prev, [milestone.id]: false }));
                        });
                    }
                  }}
                  className="mr-2 h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor={`milestone-${milestone.id}`} className="text-xs text-slate-700">
                  {milestone.completed ? 'Completed' : 'Mark as completed'}
                </label>
                {localToggling[milestone.id] && (
                  <span className="ml-2 text-xs text-slate-500">Updating...</span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error(`[CAREER-PATH] Error rendering milestone ${index}:`, error);
      return (
        <div key={`error-milestone-${index}`} className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-700">Error rendering milestone {index + 1}</p>
        </div>
      );
    }
  };

  // Show error message if there's an issue
  if (errorInfo) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-bold text-red-700 mb-2">Error</h3>
        <p className="text-red-600">{errorInfo}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!sortedMilestones || sortedMilestones.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-600">No milestones found in your career path.</p>
          <p className="text-sm text-slate-500 mt-2">Generate a career path based on your resume and professional goals.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto">
            {sortedMilestones.map((milestone, index) => 
              renderMilestone(milestone, index)
            )}
          </div>
        </div>
      )}
      
      {/* Hidden debug info about render status */}
      <div className="hidden">Rendered: {rendered ? 'yes' : 'no'}</div>
    </div>
  );
};

export default CareerPath; 