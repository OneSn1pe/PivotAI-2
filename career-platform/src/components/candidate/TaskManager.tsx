'use client';

import React, { useState } from 'react';
import ObjectiveCard, { 
  ObjectiveProps, 
  ObjectiveType, 
  ObjectiveStatus 
} from '@/components/ui/ObjectiveCard';

interface TaskManagerProps {
  objectives: ObjectiveProps[];
  onObjectiveClick?: (objectiveId: string) => void;
  onFilterChange?: (filter: ObjectiveType | 'all') => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  objectives,
  onObjectiveClick,
  onFilterChange
}) => {
  const [activeFilter, setActiveFilter] = useState<ObjectiveType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ObjectiveStatus | 'all'>('all');
  
  // Filter objectives based on the active filters
  const filteredObjectives = objectives.filter(objective => {
    // Filter by type
    if (activeFilter !== 'all' && objective.type !== activeFilter) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'all' && objective.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
  
  // Group objectives by their type
  const groupedObjectives = filteredObjectives.reduce((groups, objective) => {
    const key = objective.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(objective);
    return groups;
  }, {} as Record<ObjectiveType, ObjectiveProps[]>);
  
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
  
  const handleFilterChange = (filter: ObjectiveType | 'all') => {
    setActiveFilter(filter);
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };
  
  const handleStatusFilterChange = (status: ObjectiveStatus | 'all') => {
    setStatusFilter(status);
  };
  
  const renderFilterButtons = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleFilterChange('all')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'all'
            ? 'bg-teal-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        All Tasks
      </button>
      <button
        onClick={() => handleFilterChange('technical')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'technical'
            ? 'bg-indigo-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Technical Skills
      </button>
      <button
        onClick={() => handleFilterChange('non-technical')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'non-technical'
            ? 'bg-amber-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Soft Skills
      </button>
    </div>
  );
  
  const renderStatusFilter = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="mr-2 text-sm text-slate-600 self-center">Status:</div>
      <button
        onClick={() => handleStatusFilterChange('all')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          statusFilter === 'all'
            ? 'bg-slate-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        All
      </button>
      <button
        onClick={() => handleStatusFilterChange('available')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          statusFilter === 'available'
            ? 'bg-amber-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Available
      </button>
      <button
        onClick={() => handleStatusFilterChange('completed')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          statusFilter === 'completed'
            ? 'bg-emerald-700 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Completed
      </button>
    </div>
  );
  
  const renderObjectivesByType = (type: ObjectiveType) => {
    const objectivesOfType = groupedObjectives[type] || [];
    const sortedObjectives = sortObjectives(objectivesOfType);
    
    if (sortedObjectives.length === 0) {
      return null;
    }
    
    let title = '';
    let description = '';
    
    switch (type) {
      case 'technical':
        title = 'Technical Skills Development';
        description = 'Technical abilities, programming, development, and specialized knowledge tasks';
        break;
      case 'non-technical':
        title = 'Soft Skills & Professional Growth';
        description = 'Communication, leadership, teamwork, and career advancement activities';
        break;
    }
    
    return (
      <div key={type} className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800 font-inter">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
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
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 font-inter">Task Manager</h1>
        <p className="text-slate-600 mb-6">
          Track and complete your professional development objectives to advance your career
        </p>
        
        {renderFilterButtons()}
        {renderStatusFilter()}
      </div>
      
      {activeFilter === 'all' ? (
        <>
          {renderObjectivesByType('technical')}
          {renderObjectivesByType('non-technical')}
        </>
      ) : (
        renderObjectivesByType(activeFilter)
      )}
    </div>
  );
};

export default TaskManager; 