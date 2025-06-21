import { UserProgress, MicroMilestone } from '@/types/user';

export interface LevelProgressData {
  currentLevel: number;
  levelTitle: string;
  levelDescription: string;
  milestonesCompleted: number;
  microMilestonesCompleted: number;
  nextLevelTitle: string;
  nextLevelDescription: string;
}


// Level progression configuration
const LEVEL_CONFIG = {
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
  // Calculate level based on milestones completed
  // Every 5 milestones = 1 level
  const totalMilestones = userProgress.completedMilestones.length + Math.floor((userProgress.completedMicroMilestones?.length || 0) / 3);
  const currentLevel = Math.min(Math.floor(totalMilestones / 5), LEVEL_CONFIG.MAX_LEVEL);
  
  // Get level titles
  const { title: levelTitle, description: levelDescription } = getLevelInfo(currentLevel);
  const { title: nextLevelTitle, description: nextLevelDescription } = getLevelInfo(currentLevel + 1);
  
  return {
    currentLevel,
    levelTitle,
    levelDescription,
    milestonesCompleted: userProgress.completedMilestones.length,
    microMilestonesCompleted: userProgress.completedMicroMilestones?.length || 0,
    nextLevelTitle,
    nextLevelDescription,
  };
}

/**
 * Calculate streak multiplier (kept for compatibility but returns 1.0)
 */
export function getStreakMultiplier(streakDays: number): number {
  return 1.0;
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
  
  // Level-based milestone recommendations
  const milestonesForNext = (levelData.currentLevel + 1) * 5 - (levelData.milestonesCompleted + Math.floor(levelData.microMilestonesCompleted / 3));
  if (milestonesForNext > 0) {
    actions.push(`Complete ${milestonesForNext} more milestones to reach ${levelData.nextLevelTitle} level`);
  }
  
  // Milestone balance recommendations
  if (levelData.microMilestonesCompleted < levelData.milestonesCompleted * 3) {
    actions.push('Complete micro-milestones to gain steady progress');
  }
  
  return actions;
}