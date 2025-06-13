import { UserProgress, MicroMilestone } from '@/types/user';

export interface LevelProgressData {
  currentLevel: number;
  totalXP: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  progressPercent: number;
  levelTitle: string;
  levelDescription: string;
  milestonesCompleted: number;
  microMilestonesCompleted: number;
  milestonesNeededForNext: number;
  nextLevelTitle: string;
  nextLevelDescription: string;
}

// XP values for different activities
const XP_VALUES = {
  MILESTONE_COMPLETION: 100,
  MICRO_MILESTONE_COMPLETION: 25,
  ACHIEVEMENT_UNLOCK: 50,
  DAILY_STREAK_BONUS: 10,
  WEEKLY_GOAL_BONUS: 75,
};

// Level progression configuration
const LEVEL_CONFIG = {
  BASE_XP: 100, // XP required for level 1
  LEVEL_MULTIPLIER: 1.2, // Each level requires 20% more XP than previous
  MAX_LEVEL: 50,
};

// Level titles and descriptions
const LEVEL_TITLES: { [key: number]: { title: string; description: string } } = {
  0: { title: 'Beginner', description: 'Just starting your journey' },
  1: { title: 'Novice', description: 'Learning the basics' },
  2: { title: 'Apprentice', description: 'Building foundational skills' },
  3: { title: 'Practitioner', description: 'Applying knowledge effectively' },
  4: { title: 'Professional', description: 'Demonstrating competence' },
  5: { title: 'Specialist', description: 'Developing expertise' },
  6: { title: 'Expert', description: 'Mastering your craft' },
  7: { title: 'Master', description: 'Leading with excellence' },
  8: { title: 'Mentor', description: 'Guiding others' },
  9: { title: 'Thought Leader', description: 'Shaping the industry' },
  10: { title: 'Legend', description: 'Inspiring generations' },
};

/**
 * Calculate XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return LEVEL_CONFIG.BASE_XP;
  
  // Exponential growth formula
  return Math.floor(
    LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.LEVEL_MULTIPLIER, level - 1)
  );
}

/**
 * Calculate total XP required to reach a level (cumulative)
 */
export function getTotalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += getXPForLevel(i);
  }
  return totalXP;
}

/**
 * Get level title and description
 */
export function getLevelInfo(level: number): { title: string; description: string } {
  if (level >= 10) {
    return LEVEL_TITLES[10]; // Cap at "Legend"
  }
  return LEVEL_TITLES[level] || LEVEL_TITLES[0];
}

/**
 * Calculate user's current level based on their progress
 */
export function calculateUserLevel(userProgress: UserProgress): LevelProgressData {
  // Calculate total XP earned
  const milestoneXP = userProgress.completedMilestones.length * XP_VALUES.MILESTONE_COMPLETION;
  const microMilestoneXP = (userProgress.completedMicroMilestones?.length || 0) * XP_VALUES.MICRO_MILESTONE_COMPLETION;
  const achievementXP = (userProgress.achievements?.length || 0) * XP_VALUES.ACHIEVEMENT_UNLOCK;
  
  // Apply streak bonus
  const streakMultiplier = getStreakMultiplier(userProgress.streakDays);
  const baseXP = milestoneXP + microMilestoneXP + achievementXP;
  const totalXP = Math.floor(baseXP * streakMultiplier);
  
  // Determine current level
  let currentLevel = 0;
  let remainingXP = totalXP;
  
  while (currentLevel < LEVEL_CONFIG.MAX_LEVEL) {
    const xpForNextLevel = getXPForLevel(currentLevel + 1);
    if (remainingXP >= xpForNextLevel) {
      remainingXP -= xpForNextLevel;
      currentLevel++;
    } else {
      break;
    }
  }
  
  // Calculate progress to next level
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const currentLevelXP = remainingXP;
  const progressPercent = xpForNextLevel > 0 
    ? Math.round((currentLevelXP / xpForNextLevel) * 100)
    : 100;
  
  // Get level titles
  const { title: levelTitle, description: levelDescription } = getLevelInfo(currentLevel);
  const { title: nextLevelTitle, description: nextLevelDescription } = getLevelInfo(currentLevel + 1);
  
  // Calculate milestones needed for next level
  const xpNeeded = xpForNextLevel - currentLevelXP;
  const milestonesNeededForNext = Math.ceil(xpNeeded / XP_VALUES.MILESTONE_COMPLETION);
  
  return {
    currentLevel,
    totalXP,
    currentLevelXP,
    xpForNextLevel,
    progressPercent,
    levelTitle,
    levelDescription,
    milestonesCompleted: userProgress.completedMilestones.length,
    microMilestonesCompleted: userProgress.completedMicroMilestones?.length || 0,
    milestonesNeededForNext,
    nextLevelTitle,
    nextLevelDescription,
  };
}

/**
 * Calculate streak multiplier for XP
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 14) return 1.3;
  if (streakDays >= 7) return 1.2;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Calculate progress to next level as a simple object
 */
export function calculateProgressToNextLevel(
  currentXP: number,
  currentLevel: number
): { percent: number; xpNeeded: number; milestonesNeeded: number } {
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - getTotalXPForLevel(currentLevel);
  const percent = Math.round((xpInCurrentLevel / xpForNextLevel) * 100);
  const xpNeeded = xpForNextLevel - xpInCurrentLevel;
  const milestonesNeeded = Math.ceil(xpNeeded / XP_VALUES.MILESTONE_COMPLETION);
  
  return { percent, xpNeeded, milestonesNeeded };
}

/**
 * Get recommended actions based on current progress
 */
export function getRecommendedActions(levelData: LevelProgressData): string[] {
  const actions: string[] = [];
  
  // Level-based recommendations
  if (levelData.currentLevel < 3) {
    actions.push('Complete fundamental milestones to build a strong foundation');
  } else if (levelData.currentLevel < 6) {
    actions.push('Focus on technical milestones to deepen your expertise');
  } else {
    actions.push('Explore niche technologies to differentiate yourself');
  }
  
  // Progress-based recommendations
  if (levelData.progressPercent < 25) {
    actions.push(`Complete ${levelData.milestonesNeededForNext} more milestones to reach ${levelData.nextLevelTitle} level`);
  } else if (levelData.progressPercent > 75) {
    actions.push(`You're close to ${levelData.nextLevelTitle}! Just ${Math.ceil(levelData.milestonesNeededForNext * 0.25)} more milestones`);
  }
  
  // Milestone balance recommendations
  if (levelData.microMilestonesCompleted < levelData.milestonesCompleted * 3) {
    actions.push('Complete micro-milestones to gain steady progress');
  }
  
  return actions;
}