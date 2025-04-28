import React from 'react';
import { CareerRoadmap as RoadmapType } from '@/types/user';

interface CandidateRoadmapProps {
  roadmap: RoadmapType;
}

const CandidateRoadmap: React.FC<CandidateRoadmapProps> = ({ roadmap }) => {
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Candidate's Career Roadmap</h2>
      
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No milestones found in the roadmap.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200 z-0"></div>
          
          {/* Milestones */}
          <div className="relative z-10">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="flex flex-col md:flex-row mb-10 items-center">
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full shadow ${
                    milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                  } z-10`}></div>
                </div>
                
                {/* Content container */}
                <div className={`w-full md:w-1/2 p-4 rounded-lg shadow-md ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{milestone.title}</h3>
                    <span className="text-sm text-gray-500">{milestone.timeframe}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{milestone.description}</p>
                  
                  {milestone.skills && milestone.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {milestone.skills.map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center">
                    <span className={`text-sm ${
                      milestone.completed ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {milestone.completed ? 'Completed' : 'In Progress'}
                    </span>
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

export default CandidateRoadmap; 