import React from 'react';
import { UserProgress } from '@/types/user';
import { calculateUserLevel } from '@/services/levelProgressService';

interface LevelIndicatorProps {
  userProgress: UserProgress;
  className?: string;
}

export function LevelIndicator({ userProgress, className = '' }: LevelIndicatorProps) {
  const levelData = calculateUserLevel(userProgress);

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
          <p className="text-xs text-gray-400 mt-2">
            Level {levelData.currentLevel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Next level</p>
          <p className="text-lg font-medium text-gray-900">
            {levelData.nextLevelTitle}
          </p>
        </div>
      </div>
    </div>
  );
}