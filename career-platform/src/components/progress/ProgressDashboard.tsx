'use client';

import React from 'react';
import { UserProgress, Achievement } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateUserLevel, getStreakMultiplier } from '@/services/levelProgressService';

interface ProgressDashboardProps {
  userProgress: UserProgress;
  achievements: Achievement[];
  className?: string;
}

export function ProgressDashboard({ userProgress, achievements, className = '' }: ProgressDashboardProps) {
  const levelData = calculateUserLevel(userProgress);
  const streakMultiplier = getStreakMultiplier(userProgress.streakDays);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Main Level Display - Hero Metric */}
      <div className="text-center py-8 sm:py-12">
        <div className="text-5xl sm:text-6xl font-semibold text-gray-900 mb-2">
          {levelData.currentLevel}
        </div>
        <div className="text-base sm:text-lg text-gray-600 mb-1">{levelData.levelTitle}</div>
        <div className="text-xs sm:text-sm text-gray-500">{levelData.totalXP} XP earned</div>
      </div>

      {/* Progress to Next Level */}
      <div className="max-w-2xl mx-auto">
        <div className="mb-2 flex justify-between items-baseline">
          <span className="text-sm text-gray-600">Progress to level {levelData.currentLevel + 1}</span>
          <span className="text-sm font-medium text-gray-900">{levelData.progressPercent}%</span>
        </div>
        <Progress value={levelData.progressPercent} className="h-1" />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{levelData.currentLevelXP} / {levelData.xpForNextLevel} XP</span>
          <span>{levelData.milestonesNeededForNext} milestones to next level</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Milestones */}
        <Card className="border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {levelData.milestonesCompleted}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Milestones completed</div>
              {levelData.microMilestonesCompleted > 0 && (
                <div className="text-xs text-gray-500">
                  +{levelData.microMilestonesCompleted} micro-milestones
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {userProgress.streakDays}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Day streak</div>
              {streakMultiplier > 1 && (
                <div className="text-xs text-gray-500">
                  {streakMultiplier}x XP multiplier
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {achievements.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Achievements earned</div>
              {achievements.length > 0 && (
                <div className="text-xs text-gray-500 truncate">
                  Latest: {achievements[achievements.length - 1].title}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Progress Breakdown */}
      <div className="border-t border-gray-200 pt-6 sm:pt-8">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">Milestone Progress</h3>
        <div className="space-y-2 sm:space-y-3">
          {[1, 5, 10, 25, 50].map(target => {
            const completed = levelData.milestonesCompleted >= target;
            return (
              <div key={target} className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  completed ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                }`} />
                <span className={`text-sm ${completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  Complete {target} milestones
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Level Preview */}
      {levelData.currentLevel < 10 && (
        <div className="border-t border-gray-200 pt-6 sm:pt-8">
          <div className="max-w-2xl">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Next Level</h3>
            <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
              Level {levelData.currentLevel + 1}: {levelData.nextLevelTitle}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{levelData.nextLevelDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}