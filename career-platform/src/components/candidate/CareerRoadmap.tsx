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
                <div className={`flex-1 w-full md:w-5/12 ${
                  index % 2 === 0 ? 'md:mr-auto md:text-right md:pr-8' : 'md:ml-auto md:text-left md:pl-8'
                }`}>
                  <div 
                    className={`p-4 rounded-lg shadow-md border-l-4 ${
                      milestone.completed ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-white'
                    } hover:shadow-lg transition-shadow duration-300`}
                  >
                    {/* Header with completion checkbox */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">{milestone.title}</h3>
                      {isEditable && (
                        <button 
                          onClick={() => toggleComplete(milestone)}
                          disabled={loading[milestone.id]}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {loading[milestone.id] ? (
                            <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : milestone.completed ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Timeframe */}
                    <div className="text-sm font-medium text-blue-600 mb-2">
                      {milestone.timeframe}
                    </div>
                    
                    {/* Toggle details button */}
                    <button 
                      onClick={() => toggleExpand(milestone.id)} 
                      className="text-sm text-gray-500 flex items-center"
                    >
                      {expandedMilestones[milestone.id] ? 'Hide details' : 'Show details'}
                      <svg 
                        className={`w-4 h-4 ml-1 transform transition-transform ${expandedMilestones[milestone.id] ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Expanded details */}
                    {expandedMilestones[milestone.id] && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-700 mb-3">{milestone.description}</p>
                        
                        {milestone.skills && milestone.skills.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Skills to develop:</p>
                            <div className="flex flex-wrap gap-1">
                              {milestone.skills.map((skill, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
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