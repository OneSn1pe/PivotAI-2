import React from 'react';
import { LevelType, DEFAULT_LEVEL_PROGRESSION_PATTERN, LEVEL_TYPE_ICONS } from '@/types/levelTypes';
import { LEVEL_TYPE_FEATURES } from '@/config/levelTypeConfig';

interface LevelProgressionDisplayProps {
  currentLevel: number;
  customPattern?: LevelType[];
  maxDisplay?: number;
  className?: string;
}

export const LevelProgressionDisplay: React.FC<LevelProgressionDisplayProps> = ({
  currentLevel,
  customPattern,
  maxDisplay = 10,
  className = ''
}) => {
  if (!LEVEL_TYPE_FEATURES.showInUI) {
    return null;
  }

  const pattern = customPattern || DEFAULT_LEVEL_PROGRESSION_PATTERN;
  
  // Generate levels to display
  const levels: Array<{ number: number; type: LevelType; status: 'completed' | 'current' | 'upcoming' }> = [];
  
  for (let i = 1; i <= maxDisplay; i++) {
    const levelType = pattern[(i - 1) % pattern.length];
    let status: 'completed' | 'current' | 'upcoming';
    
    if (i < currentLevel) {
      status = 'completed';
    } else if (i === currentLevel) {
      status = 'current';
    } else {
      status = 'upcoming';
    }
    
    levels.push({ number: i, type: levelType, status });
  }

  const getStatusStyles = (status: 'completed' | 'current' | 'upcoming', type: LevelType) => {
    const baseColors = {
      skill: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
      project: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
      position: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' }
    };

    switch (status) {
      case 'completed':
        return `${baseColors[type].bg} text-white`;
      case 'current':
        return `bg-white ${baseColors[type].border} ${baseColors[type].text} border-2 shadow-lg scale-110`;
      case 'upcoming':
        return 'bg-gray-100 text-gray-400 border border-gray-300';
    }
  };

  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Level Progression</h3>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {levels.map((level, index) => (
          <React.Fragment key={level.number}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${getStatusStyles(level.status, level.type)}
                `}
              >
                <span className="text-xl">{LEVEL_TYPE_ICONS[level.type]}</span>
              </div>
              <span className="text-xs mt-1 font-medium">L{level.number}</span>
            </div>
            
            {index < levels.length - 1 && (
              <div
                className={`
                  h-0.5 w-8
                  ${level.status === 'completed' ? 'bg-gray-400' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-lg">{LEVEL_TYPE_ICONS.project}</span>
          <span className="text-gray-600">Project</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">{LEVEL_TYPE_ICONS.position}</span>
          <span className="text-gray-600">Position</span>
        </div>
      </div>
    </div>
  );
};

interface CompactLevelTypeIndicatorProps {
  levelNumber: number;
  levelType: LevelType;
  isActive?: boolean;
  className?: string;
}

export const CompactLevelTypeIndicator: React.FC<CompactLevelTypeIndicatorProps> = ({
  levelNumber,
  levelType,
  isActive = false,
  className = ''
}) => {
  if (!LEVEL_TYPE_FEATURES.showInUI) {
    return null;
  }

  const getTypeStyles = (type: LevelType, active: boolean) => {
    const colors = {
      skill: active ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700',
      project: active ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700',
      position: active ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'
    };
    return colors[type];
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-sm text-gray-500">Level {levelNumber}</span>
      <div
        className={`
          inline-flex items-center justify-center w-6 h-6 rounded-full text-sm
          ${getTypeStyles(levelType, isActive)}
        `}
        title={`${levelType} level`}
      >
        {LEVEL_TYPE_ICONS[levelType]}
      </div>
    </div>
  );
};