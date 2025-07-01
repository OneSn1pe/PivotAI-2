'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  Lock, 
  Star, 
  ChevronRight,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { LevelType, getNextLevelType } from '@/types/levelTypes';
import { LevelTypeBadge } from '@/components/roadmap/LevelTypeIndicator';
import { LEVEL_TYPE_FEATURES } from '@/config/levelTypeConfig';

interface LevelNode {
  level: number;
  isActive: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  milestoneCount: number;
  title: string;
  levelType?: LevelType;
}

interface LevelNavigatorProps {
  currentLevel: number;
  maxUnlockedLevel: number;
  levelData: LevelNode[];
  onLevelSelect: (level: number) => void;
  className?: string;
}

export function LevelNavigator({ 
  currentLevel, 
  maxUnlockedLevel, 
  levelData,
  onLevelSelect, 
  className = '' 
}: LevelNavigatorProps) {
  return (
    <div className={`level-navigator ${className}`}>

      {/* Level Track */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-12 left-12 right-12 h-1 bg-gray-200 rounded-full">
          <motion.div
            className="h-full bg-gray-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min((currentLevel / Math.max(levelData.length, 1)) * 100, 100)}%` 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Level Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levelData.map((levelNode, index) => (
            <LevelCard
              key={levelNode.level}
              levelNode={levelNode}
              isSelected={levelNode.level === currentLevel}
              onClick={() => levelNode.isUnlocked && onLevelSelect(levelNode.level)}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <Card className="mt-8 p-6 bg-gray-50 border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{currentLevel}</div>
            <div className="text-sm text-gray-600">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{maxUnlockedLevel}</div>
            <div className="text-sm text-gray-600">Max Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {levelData.filter(l => l.isCompleted).length}
            </div>
            <div className="text-sm text-gray-600">Levels Completed</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Individual Level Card Component
interface LevelCardProps {
  levelNode: LevelNode;
  isSelected: boolean;
  onClick: () => void;
  delay: number;
}

function LevelCard({ levelNode, isSelected, onClick, delay }: LevelCardProps) {
  const { level, isActive, isUnlocked, isCompleted, milestoneCount, title, levelType } = levelNode;
  const displayLevelType = levelType || getNextLevelType(level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'bg-gray-100 shadow-md' 
            : isCompleted 
              ? 'bg-gray-50' 
              : isUnlocked 
                ? 'hover:bg-gray-50' 
                : 'opacity-60'
        }`}
        onClick={onClick}
      >
        {/* Level Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            {/* Level Number with Type Badge */}
            <div className="flex items-center gap-2">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                isCompleted 
                  ? 'bg-gray-900 text-white' 
                  : isActive 
                    ? 'bg-gray-700 text-white' 
                    : isUnlocked 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : !isUnlocked ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  level
                )}
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -inset-1 rounded-full ring-2 ring-gray-600"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              
              {/* Level Type Badge */}
              {LEVEL_TYPE_FEATURES.showInUI && isUnlocked && (
                <LevelTypeBadge levelType={displayLevelType} />
              )}
            </div>

            {/* Status Badge */}
            <Badge variant={
              isCompleted ? "default" : 
              isActive ? "secondary" : 
              isUnlocked ? "outline" : "secondary"
            } className="text-xs">
              {isCompleted ? "Completed" : 
               isActive ? "Active" : 
               isUnlocked ? "Available" : "Locked"}
            </Badge>
          </div>

          {/* Level Title */}
          <h3 className={`font-semibold mb-2 ${
            isUnlocked ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {title}
          </h3>

          {/* Level Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{milestoneCount} milestones</span>
              </div>
            </div>

            {/* Progress Indicator */}
            {isUnlocked && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-full rounded-full ${
                    isCompleted ? 'bg-gray-900' : isActive ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ 
                    width: isCompleted ? '100%' : isActive ? '50%' : '0%' 
                  }}
                  transition={{ duration: 1, delay: delay + 0.5 }}
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          {isUnlocked && (
            <Button 
              variant={isCompleted ? "outline" : "default"}
              size="sm" 
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {isCompleted ? (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Review Level
                </>
              ) : isActive ? (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Continue
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Start Level
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Compact Level Navigator for smaller spaces
export function CompactLevelNavigator({ 
  currentLevel, 
  maxUnlockedLevel, 
  onLevelSelect 
}: {
  currentLevel: number;
  maxUnlockedLevel: number;
  onLevelSelect: (level: number) => void;
}) {
  const maxDisplayLevel = Math.max(maxUnlockedLevel + 2, 10);
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {Array.from({ length: maxDisplayLevel }, (_, i) => i + 1).map(level => {
        const isUnlocked = level <= maxUnlockedLevel;
        const isActive = level === currentLevel;
        const isCompleted = level < currentLevel;
        
        return (
          <Button
            key={level}
            variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
            size="sm"
            className={`flex-shrink-0 w-10 h-10 p-0 ${
              !isUnlocked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => isUnlocked && onLevelSelect(level)}
            disabled={!isUnlocked}
          >
            {isCompleted ? (
              <Check className="h-4 w-4" />
            ) : !isUnlocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              level
            )}
          </Button>
        );
      })}
    </div>
  );
}