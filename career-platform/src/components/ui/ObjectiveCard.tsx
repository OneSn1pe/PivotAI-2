import React from 'react';

export type ObjectiveDifficulty = 1 | 2 | 3 | 4 | 5;
export type ObjectiveType = 'major' | 'minor' | 'daily';
export type ObjectiveStatus = 'available' | 'in-progress' | 'completed' | 'locked';

export interface ObjectiveProps {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  difficulty: ObjectiveDifficulty;
  status: ObjectiveStatus;
  rewards: {
    points: number;
    resources?: Array<{
      id: string;
      name: string;
      type: 'template' | 'guide' | 'tool' | 'course' | 'certification';
    }>;
  };
  requiredLevel?: number;
  tasks?: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  onClick?: (objectiveId: string) => void;
  className?: string;
}

const ObjectiveCard: React.FC<ObjectiveProps> = ({
  id,
  title,
  description,
  type,
  difficulty,
  status,
  rewards,
  requiredLevel,
  tasks,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  const renderObjectiveBadge = () => {
    let bgColor = '';
    let textColor = '';
    let label = '';

    switch (type) {
      case 'major':
        bgColor = 'bg-teal-100';
        textColor = 'text-teal-800';
        label = 'MAJOR';
        break;
      case 'minor':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        label = 'MINOR';
        break;
      case 'daily':
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-800';
        label = 'DAILY';
        break;
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md`}>
        {label}
      </span>
    );
  };

  const renderStatusBadge = () => {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    let label = '';

    switch (status) {
      case 'available':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-800';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
        label = 'OPEN';
        break;
      case 'in-progress':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
        label = 'IN PROGRESS';
        break;
      case 'completed':
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-800';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
        label = 'COMPLETED';
        break;
      case 'locked':
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-600';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        );
        label = 'LOCKED';
        break;
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md flex items-center`}>
        {icon}
        {label}
      </span>
    );
  };

  const isDisabled = status === 'locked';

  return (
    <div 
      className={`bg-white p-6 md:p-7 rounded-lg shadow-card border border-slate-200 ${isDisabled ? 'opacity-75' : ''} ${className} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-card-hover transition-all duration-300'}`}
      onClick={isDisabled ? undefined : handleClick}
    >
      <div className="flex items-start mb-4">
        <div className="flex space-x-2">
          {renderObjectiveBadge()}
          {renderStatusBadge()}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-3 font-inter">{title}</h3>
      
      <p className="text-sm text-slate-600 mb-5">{description}</p>
      
      {tasks && tasks.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 mb-2.5 font-inter">Action Items:</h4>
          <ul className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {tasks.map(task => (
              <li 
                key={task.id} 
                className="flex items-start text-sm"
              >
                <span className="inline-block w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5">
                  {task.completed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V7z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700'}>
                  {task.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Outcome section */}
      <div className="mb-5 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-2.5 font-inter">Outcome:</h4>
        <div className="flex items-center">
          <div className="bg-teal-100 text-teal-800 rounded-full px-2.5 py-0.5 text-xs font-medium mr-3">
            +{rewards.points} Points
          </div>
          {rewards.resources && rewards.resources.length > 0 && (
            <div className="text-xs text-slate-600">
              + {rewards.resources.length} Professional {rewards.resources.length === 1 ? 'Resource' : 'Resources'}
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isDisabled}
          className={`text-sm font-medium ${isDisabled ? 'text-slate-400' : 'text-teal-700 hover:text-teal-800'}`}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default ObjectiveCard; 