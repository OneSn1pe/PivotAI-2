import React from 'react';
import { LevelType, LEVEL_TYPE_ICONS, LEVEL_TYPE_DESCRIPTIONS } from '@/types/levelTypes';
import { LEVEL_TYPE_FEATURES } from '@/config/levelTypeConfig';

interface LevelTypeIndicatorProps {
  levelType: LevelType;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LevelTypeIndicator: React.FC<LevelTypeIndicatorProps> = ({
  levelType,
  showDescription = false,
  size = 'md',
  className = ''
}) => {
  // Don't render if feature is disabled
  if (!LEVEL_TYPE_FEATURES.showInUI) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const getTypeColor = (type: LevelType) => {
    switch (type) {
      case 'skill':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'project':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'position':
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getTypeLabel = (type: LevelType) => {
    switch (type) {
      case 'skill':
        return 'Skill Level';
      case 'project':
        return 'Project Level';
      case 'position':
        return 'Position Level';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
          ${getTypeColor(levelType)}
          ${sizeClasses[size]}
        `}
      >
        <span className={iconSizes[size]}>{LEVEL_TYPE_ICONS[levelType]}</span>
        <span className="font-medium">{getTypeLabel(levelType)}</span>
      </div>
      
      {showDescription && (
        <p className={`text-gray-600 ${sizeClasses[size]}`}>
          {LEVEL_TYPE_DESCRIPTIONS[levelType]}
        </p>
      )}
    </div>
  );
};

interface LevelTypeBadgeProps {
  levelType: LevelType;
  className?: string;
}

export const LevelTypeBadge: React.FC<LevelTypeBadgeProps> = ({
  levelType,
  className = ''
}) => {
  if (!LEVEL_TYPE_FEATURES.showInUI) {
    return null;
  }

  const getTypeColor = (type: LevelType) => {
    switch (type) {
      case 'skill':
        return 'bg-blue-500';
      case 'project':
        return 'bg-green-500';
      case 'position':
        return 'bg-purple-500';
    }
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-full
        ${getTypeColor(levelType)} text-white text-lg
        ${className}
      `}
      title={`${levelType} level`}
    >
      {LEVEL_TYPE_ICONS[levelType]}
    </div>
  );
};