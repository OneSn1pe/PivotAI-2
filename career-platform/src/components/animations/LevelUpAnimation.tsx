'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LevelType, getNextLevelType, LEVEL_TYPE_ICONS, LEVEL_TYPE_DESCRIPTIONS } from '@/types/levelTypes';
import { LevelTypeIndicator } from '@/components/roadmap/LevelTypeIndicator';
import { LEVEL_TYPE_FEATURES } from '@/config/levelTypeConfig';

interface LevelUpAnimationProps {
  isVisible: boolean;
  newLevel: number;
  levelType?: LevelType;
  newAchievements?: {
    id: string;
    title: string;
    icon: string;
  }[];
  onComplete: () => void;
}

export function LevelUpAnimation({ 
  isVisible, 
  newLevel, 
  levelType,
  newAchievements = [],
  onComplete 
}: LevelUpAnimationProps) {
  const displayLevelType = levelType || getNextLevelType(newLevel);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true);
      
      // Show achievements after level up animation
      const achievementTimer = setTimeout(() => {
        if (newAchievements.length > 0) {
          setShowAchievements(true);
        }
      }, 2000);

      return () => clearTimeout(achievementTimer);
    } else {
      setShowAchievements(false);
      setShowCelebration(false);
    }
  }, [isVisible, newAchievements.length]);

  const getLevelMessage = (level: number) => {
    // Generic progression messages not tied to specific level ranges
    const messages = [
      "Great progress! Keep going!",
      "You're advancing your skills!",
      "Excellent work on your journey!",
      "Building momentum in your career!",
      "Your dedication is paying off!",
      "Reaching new heights!",
      "Mastering new competencies!",
      "You're on fire! Keep it up!",
      "Amazing achievement unlocked!",
      "Your expertise is growing!"
    ];
    // Use level as index with modulo to cycle through messages
    return messages[(level - 1) % messages.length];
  };
  
  const levelMessage = getLevelMessage(newLevel);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onComplete()}
        >
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{
                  y: window.innerHeight + 10,
                  rotate: 360,
                  transition: {
                    duration: Math.random() * 3 + 2,
                    ease: "linear",
                    delay: Math.random() * 2
                  }
                }}
              />
            ))}
          </div>

          {/* Main Animation Container */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
          >
            {/* Header with Background Effect */}
            <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 text-center overflow-hidden">
              {/* Animated Background Stars */}
              <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-white/30"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [0, 180, 360],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </motion.div>
                ))}
              </div>

              {/* Main Content */}
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                >
                  <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
                </motion.div>

                <motion.h1
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  LEVEL UP!
                </motion.h1>

                <motion.div
                  className="text-6xl font-bold text-white mb-2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", damping: 8 }}
                >
                  {newLevel}
                </motion.div>

                <motion.p
                  className="text-yellow-100 text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {levelMessage}
                </motion.p>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4">
              {/* Level Type Display */}
              {LEVEL_TYPE_FEATURES.showInUI && (
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.0, type: "spring" }}
                >
                  <LevelTypeIndicator 
                    levelType={displayLevelType}
                    showDescription={true}
                    size="lg"
                  />
                </motion.div>
              )}

              {/* Level Benefits */}
              <motion.div
                className="space-y-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <h3 className="font-semibold text-gray-800 text-center">
                  New Level Benefits
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {displayLevelType === 'skill' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Star className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-blue-800">
                          New skills and certifications to master
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-blue-800">
                          Advanced learning resources unlocked
                        </span>
                      </div>
                    </>
                  )}
                  {displayLevelType === 'project' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Star className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-800">
                          Hands-on projects to build your portfolio
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Sparkles className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-800">
                          Real-world applications of your skills
                        </span>
                      </div>
                    </>
                  )}
                  {displayLevelType === 'position' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Star className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-purple-800">
                          Career advancement opportunities
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-purple-800">
                          Interview preparation and networking
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Trophy className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-800">
                      New achievement opportunities
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.div
                className="pt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <Button 
                  onClick={onComplete}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                  size="lg"
                >
                  Continue Your Journey
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Achievement Notifications */}
          <AnimatePresence>
            {showAchievements && newAchievements.length > 0 && (
              <motion.div
                className="absolute top-4 right-4 space-y-2 max-w-sm"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                {newAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    className="bg-white rounded-lg shadow-lg border-l-4 border-purple-500 p-4"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            Achievement
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-purple-900 text-sm">
                          {achievement.title}
                        </h4>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress Gain Animation Component
interface ProgressGainAnimationProps {
  isVisible: boolean;
  milestoneName: string;
  source: string;
  onComplete: () => void;
}

export function ProgressGainAnimation({ 
  isVisible, 
  milestoneName, 
  source, 
  onComplete 
}: ProgressGainAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 right-6 z-40"
          initial={{ x: 100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <div>
              <div className="font-bold">Milestone Complete!</div>
              <div className="text-xs opacity-90">{milestoneName}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement Unlock Animation
interface AchievementUnlockAnimationProps {
  isVisible: boolean;
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
  };
  onComplete: () => void;
}

export function AchievementUnlockAnimation({ 
  isVisible, 
  achievement, 
  onComplete 
}: AchievementUnlockAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-purple-200 p-6 max-w-sm text-center">
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {achievement.icon}
            </motion.div>
            
            <Badge className="mb-3 bg-purple-500">
              Achievement Unlocked!
            </Badge>
            
            <h3 className="text-xl font-bold text-purple-900 mb-2">
              {achievement.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-center gap-1 text-yellow-600">
              <Trophy className="h-4 w-4" />
              <span className="font-semibold">Achievement Unlocked!</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}