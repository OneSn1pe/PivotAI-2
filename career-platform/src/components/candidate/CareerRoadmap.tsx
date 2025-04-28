import React, { useState } from 'react';
import { CareerRoadmap as RoadmapType, Milestone } from '@/types/user';

interface CareerRoadmapProps {
  roadmap: RoadmapType;
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => Promise<void>;
  isEditable?: boolean;
  readOnly?: boolean;
}

const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ 
  roadmap, 
  onMilestoneToggle,
  isEditable = false,
  readOnly = false
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Progress</h3>
          <div className="flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%`
                }}
              ></div>
            </div>
            <span className="text-sm font-medium">
              {Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Milestones</h3>
          <p className="text-sm text-gray-600">
            {roadmap.milestones.filter(m => m.completed).length} of {roadmap.milestones.length} completed
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Career Path</h3>
        <div className="space-y-4">
          {roadmap.milestones.map((milestone: Milestone, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                milestone.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{milestone.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Timeframe: {milestone.timeframe}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmap; 