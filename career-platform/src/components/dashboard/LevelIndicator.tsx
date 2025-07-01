import React from 'react';
import { UserProgress } from '@/types/user';
import { calculateUserLevel } from '@/services/levelProgressService';
import { LevelType, getNextLevelType } from '@/types/levelTypes';
import { CompactLevelTypeIndicator } from '@/components/roadmap/LevelProgressionDisplay';
import { LEVEL_TYPE_FEATURES } from '@/config/levelTypeConfig';

interface LevelIndicatorProps {
  userProgress: UserProgress;
  currentLevelType?: LevelType;
  className?: string;
}

export function LevelIndicator({ userProgress, currentLevelType, className = '' }: LevelIndicatorProps) {
  const levelData = calculateUserLevel(userProgress);
  const levelType = currentLevelType || getNextLevelType(levelData.currentLevel);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {levelData.levelTitle}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {levelData.levelDescription}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-400">
              Level {levelData.currentLevel}
            </p>
            {LEVEL_TYPE_FEATURES.showInUI && (
              <CompactLevelTypeIndicator 
                levelNumber={levelData.currentLevel}
                levelType={levelType}
                isActive={true}
              />
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Next level</p>
          <p className="text-lg font-medium text-gray-900">
            {levelData.nextLevelTitle}
          </p>
          {LEVEL_TYPE_FEATURES.showInUI && (
            <div className="mt-1">
              <CompactLevelTypeIndicator 
                levelNumber={levelData.currentLevel + 1}
                levelType={getNextLevelType(levelData.currentLevel + 1)}
                isActive={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}