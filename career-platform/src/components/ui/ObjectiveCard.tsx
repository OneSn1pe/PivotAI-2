import React from 'react';
import { useRouter } from 'next/navigation';

export type ObjectiveType = 'technical' | 'fundamental' | 'niche' | 'soft';
export type ObjectiveStatus = 'available' | 'completed' | 'locked';

export interface ObjectiveProps {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  category?: ObjectiveType; // Added for backward compatibility
  status: ObjectiveStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
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
  status,
  priority,
  estimatedHours,
  rewards,
  requiredLevel,
  tasks,
  onClick,
  className = ''
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) onClick(id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/protected/candidate/roadmap');
  };

  const renderObjectiveBadge = () => {
    let bgColor = '';
    let textColor = '';
    let icon = '';
    let label = '';

    switch (type) {
      case 'technical':
        bgColor = 'bg-teal-100';
        textColor = 'text-teal-800';
        icon = '💻';
        label = 'TECHNICAL';
        break;
      case 'fundamental':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = '🏗️';
        label = 'FUNDAMENTAL';
        break;
      case 'niche':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        icon = '🚀';
        label = 'NICHE';
        break;
      case 'soft':
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-800';
        icon = '🤝';
        label = 'SOFT SKILLS';
        break;
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md flex items-center gap-1`}>
        <span>{icon}</span>
        <span>{label}</span>
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
        bgColor = '';
        textColor = '';
        icon = null;
        label = '';
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

    if (status === 'available') {
      return null;
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
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {renderObjectiveBadge()}
          {renderStatusBadge()}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-3 font-inter line-clamp-1">{title}</h3>
      
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{description}</p>

      {estimatedHours && (
        <div className="flex justify-end mb-4">
          <span className="text-xs text-slate-500">
            Est. {estimatedHours}h
          </span>
        </div>
      )}
      
      {tasks && tasks.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 mb-2.5 font-inter">Action Items:</h4>
          <ul className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {tasks.slice(0, 3).map(task => (
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
                <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-700'} truncate`}>
                  {task.description}
                </span>
              </li>
            ))}
            {tasks.length > 3 && (
              <li className="text-sm text-slate-500 mt-1 pl-8">
                +{tasks.length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleViewDetails}
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