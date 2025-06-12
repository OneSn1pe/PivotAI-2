'use client';

import React from 'react';
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
  BarChart3
} from 'lucide-react';

interface ProgressDashboardProps {
  userProgress: UserProgress;
  achievements: Achievement[];
  className?: string;
}

export function ProgressDashboard({ userProgress, achievements, className = '' }: ProgressDashboardProps) {
  // Calculate level progress based on milestones
  const completedCount = userProgress.completedMilestones.length;
  const estimatedMilestonesPerLevel = 3;
  const milestonesInCurrentLevel = completedCount % estimatedMilestonesPerLevel;
  const milestonesNeededForNext = estimatedMilestonesPerLevel;
  const progressPercent = (milestonesInCurrentLevel / milestonesNeededForNext) * 100;

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
                <div className="text-3xl font-bold text-blue-600">Level {userProgress.currentLevel}</div>
                <div className="text-sm text-gray-600">Current Level</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{userProgress.completedMilestones.length}</div>
                <div className="text-sm text-gray-600">Milestones Completed</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {userProgress.currentLevel + 1}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{milestonesInCurrentLevel} milestones</span>
                <span>{milestonesNeededForNext - milestonesInCurrentLevel} needed</span>
              </div>
            </div>

            {/* Level Milestone */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Trophy className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-900">Next Level Reward</div>
                <div className="text-sm text-blue-700">
                  Unlock new milestones and career opportunities
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
                  {userProgress.streakDays >= 30 ? '1.5x' :
                   userProgress.streakDays >= 14 ? '1.3x' :
                   userProgress.streakDays >= 7 ? '1.2x' :
                   userProgress.streakDays >= 3 ? '1.1x' : '1.0x'} Progress Boost
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
              {userProgress.completedMilestones.length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
            
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

      {/* Weekly Activity Card */}
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Learning Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const dayIndex = (new Date().getDay() - i + 7) % 7;
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const isToday = i === 0;
              const hasActivity = Math.random() > 0.3; // Mock activity data
              
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-600 mb-2">
                    {dayNames[dayIndex]}
                  </div>
                  <div 
                    className={`w-full h-16 rounded-lg border-2 ${
                      isToday 
                        ? 'border-blue-500 bg-blue-100' 
                        : hasActivity 
                          ? 'border-green-500 bg-green-100' 
                          : 'border-gray-200 bg-gray-50'
                    } flex items-center justify-center`}
                  >
                    {hasActivity && (
                      <div className="text-center">
                        <div className="text-xs font-bold text-green-700">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span className="text-gray-600">Inactive</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium">This Week</div>
              <div className="text-xs text-gray-600">
                {Math.floor(Math.random() * 5) + 1} milestones completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}