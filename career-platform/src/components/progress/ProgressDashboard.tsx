'use client';

import React, { useEffect, useState } from 'react';
import { UserProgress, Achievement } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Zap, 
  Target, 
  Calendar, 
  TrendingUp,
  Star,
  Flame,
  Award,
  RefreshCw
} from 'lucide-react';
import { calculateUserLevel, LevelProgressData, getLevelInfo, getStreakMultiplier } from '@/services/levelProgressService';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressDashboardProps {
  userProgress: UserProgress;
  achievements: Achievement[];
  className?: string;
}

export function ProgressDashboard({ userProgress, achievements, className = '' }: ProgressDashboardProps) {
  // Calculate accurate level progress using the service
  const levelData = calculateUserLevel(userProgress);
  const streakMultiplier = getStreakMultiplier(userProgress.streakDays);

  // Calculate statistics
  const totalAchievements = achievements.length;
  const recentAchievements = achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Level Progress Card */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Level Display */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">Level {levelData.currentLevel}</div>
                <div className="text-sm text-gray-600">{levelData.levelTitle}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{levelData.totalXP}</div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {levelData.currentLevel + 1}</span>
                <span>{levelData.progressPercent}%</span>
              </div>
              <Progress value={levelData.progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{levelData.currentLevelXP} / {levelData.xpForNextLevel} XP</span>
                <span>{levelData.milestonesNeededForNext} milestones needed</span>
              </div>
            </div>

            {/* Level Milestone */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Trophy className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-900">{levelData.nextLevelTitle}</div>
                <div className="text-sm text-blue-700">
                  {levelData.nextLevelDescription}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Daily Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold text-orange-600">
              {userProgress.streakDays}
            </div>
            <div className="text-sm text-gray-600">
              {userProgress.streakDays === 1 ? 'day' : 'days'} in a row
            </div>
            
            {userProgress.streakDays > 0 && (
              <div className="flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 font-medium">
                  {streakMultiplier}x Progress Boost
                </span>
              </div>
            )}

            {/* Streak Milestones */}
            <div className="space-y-1">
              {[3, 7, 30].map(milestone => (
                <div 
                  key={milestone}
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    userProgress.streakDays >= milestone 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span>{milestone} days</span>
                  {userProgress.streakDays >= milestone ? (
                    <Flame className="h-3 w-3" />
                  ) : (
                    <div className="w-3 h-3 border border-gray-400 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Completed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold text-green-600">
              {levelData.milestonesCompleted}
            </div>
            <div className="text-sm text-gray-600">Milestones</div>
            <div className="text-sm text-gray-500">
              +{levelData.microMilestonesCompleted} micro
            </div>
            
            {/* Milestone Progress */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Progress Milestones</div>
              {[1, 5, 10, 25].map(milestone => (
                <div 
                  key={milestone}
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    userProgress.completedMilestones.length >= milestone 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span>{milestone} milestones</span>
                  {userProgress.completedMilestones.length >= milestone ? (
                    <Target className="h-3 w-3" />
                  ) : (
                    <div className="w-3 h-3 border border-gray-400 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalAchievements}</div>
              <div className="text-sm text-gray-600">Unlocked</div>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Recent</div>
                {recentAchievements.map(achievement => (
                  <div key={achievement.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <span className="text-lg">{achievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-purple-900 truncate">
                        {achievement.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}