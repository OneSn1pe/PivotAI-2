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
  
  // Category configurations matching the career path page
  const categoryConfig = {
    technical: {
      name: 'Technical',
      icon: '💻',
      color: 'teal',
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-800',
      buttonColor: 'bg-teal-700',
      description: 'Programming, frameworks, and technical implementations'
    },
    fundamental: {
      name: 'Fundamental',
      icon: '🏗️',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      buttonColor: 'bg-blue-700',
      description: 'Core concepts, architecture, and problem-solving skills'
    },
    niche: {
      name: 'Niche',
      icon: '🚀',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      buttonColor: 'bg-purple-700',
      description: 'Specialized technologies and emerging domains'
    },
    soft: {
      name: 'Soft Skills',
      icon: '🤝',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      buttonColor: 'bg-orange-700',
      description: 'Communication, leadership, and interpersonal skills'
    }
  };
  
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

  // Get category stats
  const getCategoryStats = () => {
    const stats: Record<ObjectiveType, { total: number; completed: number }> = {
      technical: { total: 0, completed: 0 },
      fundamental: { total: 0, completed: 0 },
      niche: { total: 0, completed: 0 },
      soft: { total: 0, completed: 0 }
    };

    objectives.forEach(objective => {
      const category = objective.type;
      stats[category].total++;
      if (objective.status === 'completed') {
        stats[category].completed++;
      }
    });

    return stats;
  };

  const stats = getCategoryStats();
  
  const renderFilterButtons = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleFilterChange('all')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
          activeFilter === 'all'
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        All Tasks ({objectives.length})
      </button>
      {Object.entries(categoryConfig).map(([category, config]) => (
        <button
          key={category}
          onClick={() => handleFilterChange(category as ObjectiveType)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeFilter === category
              ? `${config.buttonColor} text-white`
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>{config.icon}</span>
          <span>{config.name}</span>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs text-slate-700">
            {stats[category as ObjectiveType].completed}/{stats[category as ObjectiveType].total}
          </span>
        </button>
      ))}
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
    
    const config = categoryConfig[type];
    
    return (
      <div key={type} className="mb-10">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <h2 className="text-xl font-bold text-slate-800 font-inter">{config.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
              {stats[type].completed}/{stats[type].total} completed
            </span>
          </div>
          <p className="text-sm text-slate-500">{config.description}</p>
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
          Track and complete your professional development objectives organized by skill categories
        </p>
        
        {renderFilterButtons()}
        {renderStatusFilter()}
      </div>
      
      {activeFilter === 'all' ? (
        <>
          {renderObjectivesByType('technical')}
          {renderObjectivesByType('fundamental')}
          {renderObjectivesByType('niche')}
          {renderObjectivesByType('soft')}
        </>
      ) : (
        renderObjectivesByType(activeFilter)
      )}

      {filteredObjectives.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No objectives found</h3>
          <p className="text-slate-500">
            {activeFilter === 'all' 
              ? 'No objectives match the current filters.' 
              : `No ${categoryConfig[activeFilter as ObjectiveType]?.name.toLowerCase()} objectives found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskManager; 