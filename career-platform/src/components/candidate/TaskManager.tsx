'use client';

import React from 'react';
import ObjectiveCard, { 
  ObjectiveProps, 
  ObjectiveType, 
  ObjectiveStatus 
} from '@/components/ui/ObjectiveCard';

interface TaskManagerProps {
  objectives: ObjectiveProps[];
  onObjectiveClick?: (objectiveId: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  objectives,
  onObjectiveClick
}) => {
  // Sort objectives by status (available first, then completed, then locked)
  const sortObjectives = (objectives: ObjectiveProps[]): ObjectiveProps[] => {
    return [...objectives].sort((a, b) => {
      const statusOrder: Record<ObjectiveStatus, number> = {
        'available': 0,
        'completed': 1,
        'locked': 2
      };
      
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };

  // If no objectives are available
  if (!objectives || objectives.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200 text-center">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Objectives Available</h3>
        <p className="text-slate-500 mb-4">Your objectives will appear here once they're created or assigned</p>
        <button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md font-medium shadow-button hover:shadow-button-hover transition-all duration-300">
          Generate New Objectives
        </button>
      </div>
    );
  }

  // Sort all objectives
  const sortedObjectives = sortObjectives(objectives);
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 font-inter">Task Manager</h1>
        <p className="text-slate-600 mb-6">
          Track and complete your professional development objectives organized by skill categories
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedObjectives.map(objective => (
          <ObjectiveCard
            key={objective.id}
            {...objective}
            onClick={onObjectiveClick}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskManager; 