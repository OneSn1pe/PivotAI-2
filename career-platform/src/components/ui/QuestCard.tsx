import React from 'react';

export type QuestDifficulty = 1 | 2 | 3 | 4 | 5;
export type QuestType = 'main' | 'side' | 'daily';
export type QuestStatus = 'available' | 'in-progress' | 'completed' | 'locked';

export interface QuestProps {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  rewards: {
    xp: number;
    coins?: number;
    items?: Array<{
      id: string;
      name: string;
      rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    }>;
  };
  requiredLevel?: number;
  objectives?: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  onClick?: (questId: string) => void;
  className?: string;
}

const QuestCard: React.FC<QuestProps> = ({
  id,
  title,
  description,
  type,
  difficulty,
  status,
  rewards,
  requiredLevel,
  objectives,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  const renderDifficultyStars = () => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg 
            key={index} 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ${index < difficulty ? 'text-amber-500' : 'text-gray-300'}`}
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderQuestBadge = () => {
    let bgColor = '';
    let textColor = '';
    let label = '';

    switch (type) {
      case 'main':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        label = 'MAIN QUEST';
        break;
      case 'side':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        label = 'SIDE QUEST';
        break;
      case 'daily':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        label = 'DAILY QUEST';
        break;
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md`}>
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
        label = 'AVAILABLE';
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
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
        label = 'COMPLETED';
        break;
      case 'locked':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-600';
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        );
        label = 'LOCKED';
        break;
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md flex items-center`}>
        {icon}
        {label}
      </span>
    );
  };

  const isDisabled = status === 'locked';

  return (
    <div 
      className={`quest-card ornate-corners ${isDisabled ? 'opacity-75' : ''} ${className} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
      onClick={isDisabled ? undefined : handleClick}
    >
      <span></span> {/* Required for ornate corners */}
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex space-x-2">
          {renderQuestBadge()}
          {renderStatusBadge()}
        </div>
        <div>{renderDifficultyStars()}</div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      
      {objectives && objectives.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Objectives:</h4>
          <ul className="space-y-1">
            {objectives.map(objective => (
              <li 
                key={objective.id} 
                className="flex items-start text-sm"
              >
                <span className="inline-block w-5 h-5 mr-2 flex-shrink-0">
                  {objective.completed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V7z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className={objective.completed ? 'line-through text-slate-400' : 'text-slate-600'}>
                  {objective.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {requiredLevel && status === 'locked' && (
        <div className="bg-red-50 p-2 rounded mb-3 flex items-center text-sm text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Requires Level {requiredLevel}
        </div>
      )}
      
      <div className="border-t border-amber-200 pt-3 mt-2">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Rewards:</h4>
        <div className="flex items-center space-x-3">
          {rewards.xp > 0 && (
            <div className="flex items-center text-purple-700 bg-purple-50 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="text-xs font-medium">{rewards.xp} XP</span>
            </div>
          )}
          
          {rewards.coins && rewards.coins > 0 && (
            <div className="flex items-center text-amber-700 bg-amber-50 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">{rewards.coins} Coins</span>
            </div>
          )}
          
          {rewards.items && rewards.items.length > 0 && (
            <div className="flex items-center text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span className="text-xs font-medium">{rewards.items.length} {rewards.items.length === 1 ? 'Item' : 'Items'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestCard; 