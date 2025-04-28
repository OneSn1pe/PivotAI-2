import React, { useState } from 'react';
import { CareerRoadmap as RoadmapType, Milestone } from '@/types/user';

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
                    
                    {/* Resources for milestone */}
                    {milestone.resources && milestone.resources.length > 0 ? (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Resources:</h4>
                        <div className="space-y-2">
                          {milestone.resources.map((resource, resourceIndex) => (
                            <a
                              key={resourceIndex}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <span className="mr-2">
                                {resource.type === 'article' && '📄'}
                                {resource.type === 'video' && '🎥'}
                                {resource.type === 'course' && '📚'}
                                {resource.type === 'book' && '📖'}
                                {resource.type === 'documentation' && '📋'}
                              </span>
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Resources:</h4>
                        <p className="text-xs text-gray-500 italic">No resources listed for this milestone.</p>
                      </div>
                    )}
                    
                    {/* Completion checkbox that triggers parent handler */}
                    {isEditable && (
                      <div className="flex items-center">
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