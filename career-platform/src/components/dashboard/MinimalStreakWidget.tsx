import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  nextMilestone: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface MinimalStreakWidgetProps {
  streakData: StreakData;
  className?: string;
}

export function MinimalStreakWidget({ streakData, className = '' }: MinimalStreakWidgetProps) {
  const daysUntilMilestone = streakData.nextMilestone - streakData.currentStreak;
  const weeklyPercentage = (streakData.weeklyProgress / streakData.weeklyGoal) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Streak</h3>
        <Flame className={`w-5 h-5 ${streakData.currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
      </div>

      <div className="space-y-4">
        {/* Current Streak */}
        <div>
          <p className="text-3xl font-semibold text-gray-900">
            {streakData.currentStreak}
            <span className="text-lg font-normal text-gray-500 ml-2">days</span>
          </p>
          {daysUntilMilestone > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {daysUntilMilestone} days to next milestone
            </p>
          )}
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">This week</span>
            <span className="text-gray-900 font-medium">
              {streakData.weeklyProgress}/{streakData.weeklyGoal}
            </span>
          </div>
          <div className="h-1 bg-gray-100 rounded-sm overflow-hidden">
            <motion.div
              className="h-full bg-gray-900"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(weeklyPercentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Longest</span>
            <span className="text-gray-900 font-medium">{streakData.longestStreak} days</span>
          </div>
        </div>
      </div>
    </div>
  );
}