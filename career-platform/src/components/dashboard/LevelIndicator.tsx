import React from 'react';
import { motion } from 'framer-motion';
import { UserProgress } from '@/types/user';
import { ProgressTrackingService } from '@/services/progressTracking';

interface LevelIndicatorProps {
  userProgress: UserProgress;
  className?: string;
}

export function LevelIndicator({ userProgress, className = '' }: LevelIndicatorProps) {
  const levelProgress = ProgressTrackingService.calculateLevelProgress(userProgress);
  const nextLevelXP = ProgressTrackingService.getXPForLevel(userProgress.currentLevel);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Level {userProgress.currentLevel}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {userProgress.totalXP.toLocaleString()} total experience points
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Next level</p>
          <p className="text-lg font-medium text-gray-900">
            {userProgress.currentLevel + 1}
          </p>
        </div>
      </div>

      {/* Minimalist Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-gray-100 rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-gray-900"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress.percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{levelProgress.currentLevelXP.toLocaleString()}</span>
          <span>{(nextLevelXP - levelProgress.currentLevelXP).toLocaleString()} to go</span>
          <span>{nextLevelXP.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}