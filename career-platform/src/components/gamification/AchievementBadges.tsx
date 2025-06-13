'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy,
  Star,
  Award,
  Crown,
  Shield,
  Target,
  Zap,
  Flame,
  Gem,
  Heart,
  Gift,
  Calendar,
  Users,
  BookOpen,
  Code,
  TrendingUp,
  Lock,
  Sparkles,
  Medal,
  Hexagon
} from 'lucide-react';
import { Achievement } from '@/types/user';
import { EmptyState } from '@/components/ui/empty-state';

interface AchievementBadgesProps {
  achievements: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  showLocked?: boolean;
  className?: string;
}

interface AchievementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  achievements: Achievement[];
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-green-500',
  rare: 'from-blue-400 to-blue-500',
  epic: 'from-purple-400 to-purple-500',
  legendary: 'from-yellow-400 to-orange-500'
};

const RARITY_GLOW = {
  common: 'shadow-gray-200',
  uncommon: 'shadow-green-200',
  rare: 'shadow-blue-200', 
  epic: 'shadow-purple-200',
  legendary: 'shadow-yellow-200'
};

const CATEGORY_ICONS = {
  progress: TrendingUp,
  skill: Code,
  streak: Flame,
  special: Crown,
  milestone: Target,
  social: Users,
  learning: BookOpen
};

export function AchievementBadges({ 
  achievements, 
  onAchievementClick, 
  showLocked = true,
  className = '' 
}: AchievementBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Group achievements by category
  const categories: AchievementCategory[] = [
    {
      id: 'progress',
      name: 'Progress',
      icon: TrendingUp,
      color: 'blue',
      achievements: achievements.filter(a => a.category === 'progress')
    },
    {
      id: 'skill',
      name: 'Skills',
      icon: Code,
      color: 'green',
      achievements: achievements.filter(a => a.category === 'skill')
    },
    {
      id: 'streak',
      name: 'Streaks',
      icon: Flame,
      color: 'orange',
      achievements: achievements.filter(a => a.category === 'streak')
    },
    {
      id: 'special',
      name: 'Special',
      icon: Crown,
      color: 'purple',
      achievements: achievements.filter(a => a.category === 'special')
    }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getAchievementIcon = (achievement: Achievement) => {
    // Return emoji if available, otherwise use category icon
    if (achievement.icon && achievement.icon.length <= 2) {
      return achievement.icon;
    }
    const CategoryIcon = CATEGORY_ICONS[achievement.category as keyof typeof CATEGORY_ICONS] || Award;
    return <CategoryIcon className="h-6 w-6" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Stats Header */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {achievements.filter(a => a.unlockedAt).length}
              </div>
              <div className="text-sm text-gray-600">Achievements Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {achievements.filter(a => a.rarity === 'legendary' && a.unlockedAt).length}
              </div>
              <div className="text-sm text-gray-600">Legendary Badges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {achievements.filter(a => a.unlockedAt).length}
              </div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round((achievements.filter(a => a.unlockedAt).length / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievement Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              All ({achievements.length})
            </Button>
            {categories.map(category => {
              const CategoryIcon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <CategoryIcon className="h-4 w-4" />
                  {category.name} ({category.achievements.length})
                </Button>
              );
            })}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                onClick={() => {
                  setSelectedAchievement(achievement);
                  onAchievementClick?.(achievement);
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              onClick={e => e.stopPropagation()}
            >
              <AchievementDetail 
                achievement={selectedAchievement}
                onClose={() => setSelectedAchievement(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual Achievement Badge Component
interface AchievementBadgeProps {
  achievement: Achievement;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function AchievementBadge({ achievement, onClick, size = 'md' }: AchievementBadgeProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const rarity = achievement.rarity || 'common';
  
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-20 h-24', 
    lg: 'w-24 h-28'
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  return (
    <motion.div
      className={`relative cursor-pointer ${sizeClasses[size]}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`
        w-full h-full rounded-xl border-2 transition-all duration-300
        ${isUnlocked 
          ? `bg-gradient-to-br ${RARITY_COLORS[rarity]} border-white shadow-lg ${RARITY_GLOW[rarity]}` 
          : 'bg-gray-200 border-gray-300 opacity-60'
        }
        flex flex-col items-center justify-center text-white
      `}>
        {/* Achievement Icon */}
        <div className={`${iconSizes[size]} mb-1`}>
          {isUnlocked ? (
            typeof achievement.icon === 'string' && achievement.icon.length <= 2 ? (
              achievement.icon
            ) : (
              <Trophy className="h-6 w-6" />
            )
          ) : (
            <Lock className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Rarity Indicator */}
        {isUnlocked && rarity !== 'common' && (
          <div className="absolute top-1 right-1">
            {rarity === 'legendary' && <Crown className="h-3 w-3 text-yellow-200" />}
            {rarity === 'epic' && <Gem className="h-3 w-3 text-purple-200" />}
            {rarity === 'rare' && <Star className="h-3 w-3 text-blue-200" />}
            {rarity === 'uncommon' && <Sparkles className="h-3 w-3 text-green-200" />}
          </div>
        )}

      </div>

      {/* Achievement Title */}
      <div className="mt-2 text-center">
        <div className={`text-xs font-medium truncate ${
          isUnlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {achievement.title}
        </div>
      </div>
    </motion.div>
  );
}

// Achievement Detail Component
function AchievementDetail({ 
  achievement, 
  onClose 
}: { 
  achievement: Achievement; 
  onClose: () => void; 
}) {
  const isUnlocked = !!achievement.unlockedAt;
  const rarity = achievement.rarity || 'common';

  const getRarityBadge = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500'
    };
    
    return (
      <Badge 
        className={`text-xs text-white ${colors[rarity as keyof typeof colors] || colors.common}`}
      >
        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
      </Badge>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className={`p-6 bg-gradient-to-br ${RARITY_COLORS[rarity]} text-white text-center`}>
        <div className="text-6xl mb-4">
          {typeof achievement.icon === 'string' && achievement.icon.length <= 2 ? (
            achievement.icon
          ) : (
            <Trophy className="h-16 w-16 mx-auto" />
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
        {getRarityBadge(rarity)}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className="text-gray-700">{achievement.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <div className="font-semibold text-blue-700">
              {isUnlocked ? new Date(achievement.unlockedAt!).toLocaleDateString() : 'Locked'}
            </div>
            <div className="text-xs text-blue-600">
              {isUnlocked ? 'Unlocked' : 'Not Earned'}
            </div>
          </div>
        </div>

        {/* Requirements */}
        {achievement.requirements && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Requirements</h4>
            <p className="text-sm text-gray-600">{achievement.requirements}</p>
          </div>
        )}

        {/* Close Button */}
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}

// Compact Achievement Showcase for dashboard
export function AchievementShowcase({ 
  achievements, 
  className = '' 
}: { 
  achievements: Achievement[]; 
  className?: string; 
}) {
  const recentAchievements = achievements
    .filter(a => a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 6);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-yellow-500" />
          Recent Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {recentAchievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="sm"
            />
          ))}
        </div>
        {recentAchievements.length === 0 && (
          <EmptyState
            illustration="NoAchievements"
            title="No achievements unlocked yet"
            description="Complete milestones to earn your first badge!"
          />
        )}
      </CardContent>
    </Card>
  );
}