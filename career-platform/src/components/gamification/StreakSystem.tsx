'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  Zap, 
  Star, 
  Trophy, 
  Target,
  Calendar,
  Sparkles,
  Gift,
  Clock,
  TrendingUp
} from 'lucide-react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  streakMultiplier: number;
  nextMilestone: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface StreakSystemProps {
  streakData: StreakData;
  onStreakExtend?: () => void;
  onClaimReward?: (milestone: number) => void;
  className?: string;
}

export function StreakSystem({ 
  streakData, 
  onStreakExtend, 
  onClaimReward,
  className = '' 
}: StreakSystemProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastStreakCheck, setLastStreakCheck] = useState(streakData.currentStreak);

  // Check for streak changes
  useEffect(() => {
    if (streakData.currentStreak > lastStreakCheck) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
    setLastStreakCheck(streakData.currentStreak);
  }, [streakData.currentStreak, lastStreakCheck]);

  // Calculate streak rewards and milestones
  const streakMilestones = [3, 7, 14, 30, 50, 100];
  const getStreakReward = (streak: number) => {
    if (streak >= 100) return 'Legendary Badge + Master Status';
    if (streak >= 50) return 'Epic Badge + Expert Status';
    if (streak >= 30) return 'Rare Badge + Advanced Status';
    if (streak >= 14) return 'Special Badge + Dedicated Status';
    if (streak >= 7) return 'Weekly Badge + Active Status';
    if (streak >= 3) return 'Starter Badge + Beginner Status';
    return 'Starting Status';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '🏆';
    if (streak >= 50) return '💎';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '🎯';
    if (streak >= 3) return '✨';
    return '👍';
  };

  const canClaimReward = (milestone: number) => {
    return streakData.currentStreak >= milestone && milestone <= streakData.nextMilestone;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Streak Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ x: 300, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 300, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <Flame className="h-8 w-8 text-orange-500" />
                  </motion.div>
                  <div>
                    <div className="font-bold text-orange-800">Streak Extended!</div>
                    <div className="text-sm text-orange-600">
                      {streakData.currentStreak} days strong! 🔥
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Streak Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardTitle className="flex items-center gap-3">
            <Flame className="h-6 w-6" />
            Daily Learning Streak
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Streak */}
            <div className="text-center">
              <motion.div
                className="text-5xl font-bold text-orange-600 mb-2"
                animate={showCelebration ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {streakData.currentStreak}
              </motion.div>
              <div className="text-sm text-gray-600 mb-2">Current Streak</div>
              <Badge 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                {getStreakEmoji(streakData.currentStreak)} {getStreakReward(streakData.currentStreak)}
              </Badge>
            </div>

            {/* Longest Streak */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {streakData.longestStreak}
              </div>
              <div className="text-sm text-gray-600 mb-2">Personal Best</div>
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">Record Holder</span>
              </div>
            </div>

            {/* Multiplier */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {streakData.streakMultiplier.toFixed(1)}x
              </div>
              <div className="text-sm text-gray-600 mb-2">Learning Boost</div>
              <div className="flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-green-600">Active Bonus</span>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900">This Week's Goal</h4>
              <div className="text-sm text-blue-700">
                {streakData.weeklyProgress}/{streakData.weeklyGoal} days
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((streakData.weeklyProgress / streakData.weeklyGoal) * 100, 100)}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {streakData.weeklyGoal - streakData.weeklyProgress > 0 
                ? `${streakData.weeklyGoal - streakData.weeklyProgress} more days to complete weekly goal`
                : 'Weekly goal completed! 🎉'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Streak Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streakMilestones.map((milestone) => {
              const isCompleted = streakData.currentStreak >= milestone;
              const canClaim = canClaimReward(milestone);
              const isNext = milestone === streakData.nextMilestone;
              
              return (
                <motion.div
                  key={milestone}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-500 bg-green-50' 
                      : isNext
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-2xl font-bold ${
                      isCompleted ? 'text-green-600' : isNext ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {milestone}
                    </div>
                    <div className="text-xl">
                      {isCompleted ? '✅' : isNext ? '🎯' : '⏳'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    {milestone} day streak reward
                  </div>
                  
                  <div className="text-xs font-medium mb-3">
                    {getStreakReward(milestone)}
                  </div>
                  
                  {canClaim && onClaimReward && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => onClaimReward(milestone)}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Claim Reward
                    </Button>
                  )}
                  
                  {isNext && !canClaim && (
                    <div className="text-xs text-blue-600 text-center">
                      {milestone - streakData.currentStreak} more days to unlock
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Streak Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Streak Tips & Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">How to Maintain Your Streak</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Complete at least one micro-milestone daily
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Set up daily reminders and learning blocks
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Track your progress consistently
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  Build small, achievable daily habits
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Streak Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  Increased learning effectiveness
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  Exclusive achievement badges
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  Faster career progression
                </li>
                <li className="flex items-start gap-2">
                  <Gift className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  Special milestone rewards
                </li>
              </ul>
            </div>
          </div>
          
          {onStreakExtend && (
            <div className="mt-6 text-center">
              <Button
                onClick={onStreakExtend}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Flame className="h-4 w-4 mr-2" />
                Continue Streak Today
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact Streak Widget for dashboard
export function StreakWidget({ 
  streakData, 
  className = '' 
}: { 
  streakData: StreakData; 
  className?: string; 
}) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {streakData.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
              {streakData.streakMultiplier.toFixed(1)}x Boost
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              Next: {streakData.nextMilestone} days
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}