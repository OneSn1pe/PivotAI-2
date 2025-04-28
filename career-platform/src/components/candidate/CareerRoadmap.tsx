import React, { useState } from 'react';
import { CareerRoadmap as RoadmapType, Milestone, ResourceLink } from '@/types/user';

interface CareerRoadmapProps {
  roadmap: RoadmapType;
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => Promise<void>;
  isEditable?: boolean;
}

const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ 
  roadmap, 
  onMilestoneToggle,
  isEditable = false
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [localToggling, setLocalToggling] = useState<Record<string, boolean>>({});

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
      console.error('Failed to update milestone:', error);
    } finally {
      setLoading(prev => ({ ...prev, [milestone.id]: false }));
    }
  };

  // Sort milestones by timeframe if possible
  const sortedMilestones = [...roadmap.milestones].sort((a, b) => {
    // If timeframes are numbers (e.g., "3 months"), try to sort numerically
    const aMonths = parseInt(a.timeframe.match(/(\d+)/)?.[1] || '0');
    const bMonths = parseInt(b.timeframe.match(/(\d+)/)?.[1] || '0');
    
    if (aMonths && bMonths) {
      return aMonths - bMonths;
    }
    
    // Fallback to alphabetical sort
    return a.timeframe.localeCompare(b.timeframe);
  });

  // Helper to render resource badge by type
  const getResourceBadge = (type: string) => {
    const badges: Record<string, { color: string, icon: React.ReactNode }> = {
      course: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ) 
      },
      article: { 
        color: 'bg-green-100 text-green-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        ) 
      },
      video: { 
        color: 'bg-red-100 text-red-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) 
      },
      book: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ) 
      },
      tool: { 
        color: 'bg-purple-100 text-purple-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) 
      },
      community: { 
        color: 'bg-pink-100 text-pink-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ) 
      },
      other: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) 
      }
    };
    
    const badge = badges[type] || badges.other;
    
    return (
      <div className={`flex items-center ${badge.color} px-2 py-1 rounded text-xs font-medium`}>
        {badge.icon}
        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
    );
  };

  return (
    <div className="w-full px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Career Roadmap</h2>
      
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No milestones found in your roadmap.</p>
          <p className="text-sm text-gray-400 mt-2">Generate a roadmap based on your resume and target companies.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200 z-0"></div>
          
          {/* Milestones */}
          <div className="relative z-10">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className={`flex flex-col md:flex-row mb-10 items-center`}>
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full shadow ${
                    milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                  } z-10`}></div>
                </div>
                
                {/* Content container with alternating sides */}
                <div className={`flex ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } w-full items-center`}>
                  {/* Spacer for first half */}
                  <div className="hidden md:block md:w-1/2"></div>
                  
                  {/* Card content */}
                  <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                      <span className="text-sm text-gray-500">{milestone.timeframe}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{milestone.description}</p>
                    
                    {/* Skills needed for milestone */}
                    {milestone.skills && milestone.skills.length > 0 ? (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Skills to develop:</h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Skills to develop:</h4>
                        <p className="text-xs text-gray-500 italic">No specific skills listed for this milestone.</p>
                      </div>
                    )}
                    
                    {/* Toggle button for expanding details */}
                    <button
                      onClick={() => toggleExpand(milestone.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mb-4"
                    >
                      {expandedMilestones[milestone.id] ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide details
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show details
                        </>
                      )}
                    </button>
                    
                    {/* Expanded details section */}
                    {expandedMilestones[milestone.id] && (
                      <div className="mt-2 space-y-4 border-t pt-4">
                        {/* Resources section */}
                        {milestone.resources && milestone.resources.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-600 mb-2">Recommended Resources:</h4>
                            <div className="space-y-3">
                              {milestone.resources.map((resource, resourceIndex) => (
                                <div key={resourceIndex} className="bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      >
                                        {resource.title}
                                      </a>
                                      {resource.description && (
                                        <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                                      )}
                                    </div>
                                    {resource.type && (
                                      <div>{getResourceBadge(resource.type)}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Action items section */}
                        {milestone.actionItems && milestone.actionItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-600 mb-2">Action Items:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {milestone.actionItems.map((item, itemIndex) => (
                                <li key={itemIndex} className="text-sm text-gray-700">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Company-specific notes section */}
                        {milestone.companySpecificNotes && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-600 mb-2">Target Company Notes:</h4>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded">
                              <p className="text-sm text-blue-800">{milestone.companySpecificNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Completion checkbox that triggers parent handler */}
                    {isEditable && (
                      <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          id={`milestone-${milestone.id}`}
                          checked={milestone.completed}
                          onChange={(e) => {
                            if (onMilestoneToggle) {
                              const checked = e.target.checked;
                              // Set local state immediately for UI feedback
                              setLocalToggling((prev) => ({ 
                                ...prev, 
                                [milestone.id]: true 
                              }));
                              
                              onMilestoneToggle(milestone.id, checked)
                                .then(() => {
                                  // Clear toggling state when done
                                  setLocalToggling((prev) => ({ 
                                    ...prev, 
                                    [milestone.id]: false 
                                  }));
                                })
                                .catch((err) => {
                                  console.error('Error toggling milestone:', err);
                                  setLocalToggling((prev) => ({ 
                                    ...prev, 
                                    [milestone.id]: false 
                                  }));
                                });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={localToggling[milestone.id]}
                        />
                        <label
                          htmlFor={`milestone-${milestone.id}`}
                          className={`ml-2 text-sm font-medium ${
                            milestone.completed ? 'text-green-600' : 'text-gray-700'
                          }`}
                        >
                          {milestone.completed ? 'Completed' : 'Mark as complete'}
                          {localToggling[milestone.id] && (
                            <span className="ml-2 inline-block animate-pulse">
                              Updating...
                            </span>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap; 