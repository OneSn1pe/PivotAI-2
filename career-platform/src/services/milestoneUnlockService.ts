import { Milestone, UserProgress } from '@/types/user';
import { db } from '@/config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { calculateUserLevel } from './levelProgressService';

export interface UnlockResult {
  unlockedMilestones: string[];
  newLevel: number;
  message: string;
}

/**
 * Check if a milestone is unlocked based on user progress
 */
export function isMilestoneUnlocked(milestone: Milestone, userProgress: UserProgress): boolean {
  // A milestone is unlocked if:
  // 1. Its level is <= user's maxUnlockedLevel (or level 1)
  // 2. All prerequisites are completed
  // 3. All unlock conditions are met
  
  // Check level requirement
  const milestoneLevel = milestone.level || 1;
  const maxUnlockedLevel = userProgress.maxUnlockedLevel || 1;
  
  // Level 1 is always unlocked, otherwise check against maxUnlockedLevel
  if (milestoneLevel > maxUnlockedLevel && milestoneLevel !== 1) {
    return false;
  }
  
  // Check prerequisites
  if (milestone.prerequisites && milestone.prerequisites.length > 0) {
    const allPrereqsCompleted = milestone.prerequisites.every(
      prereqId => userProgress.completedMilestones.includes(prereqId)
    );
    if (!allPrereqsCompleted) {
      return false;
    }
  }
  
  // Check unlock conditions
  if (milestone.unlockConditions && milestone.unlockConditions.length > 0) {
    for (const condition of milestone.unlockConditions) {
      if (!checkUnlockCondition(condition, userProgress)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if a specific unlock condition is met
 */
function checkUnlockCondition(condition: any, userProgress: UserProgress): boolean {
  switch (condition.type) {
    case 'level_completion':
      // Check if all milestones from specified levels are completed
      if (condition.requirement.levels) {
        // This would require access to all milestones to check
        // For now, return true if user level is high enough
        const maxRequiredLevel = Math.max(...condition.requirement.levels);
        return userProgress.currentLevel >= maxRequiredLevel;
      }
      break;
      
    case 'category_balance':
      // Check if minimum completions per category are met
      if (condition.requirement.categories) {
        // This would require categorizing completed milestones
        // For now, return true
        return true;
      }
      break;
      
    case 'skill_threshold':
      // Check if skill proficiencies meet thresholds
      if (condition.requirement.skills) {
        for (const [skill, threshold] of Object.entries(condition.requirement.skills)) {
          if ((userProgress.skillProficiencies?.[skill] || 0) < (threshold as number)) {
            return false;
          }
        }
      }
      break;
      
    case 'time_gate':
      // Check if enough time has passed since previous completion
      if (condition.requirement.timeGate) {
        const lastActiveTime = new Date(userProgress.lastActiveDate).getTime();
        const currentTime = new Date().getTime();
        const daysPassed = (currentTime - lastActiveTime) / (1000 * 60 * 60 * 24);
        return daysPassed >= condition.requirement.timeGate;
      }
      break;
  }
  
  return true;
}

/**
 * Check and unlock milestones after completing a level
 */
export async function checkAndUnlockMilestones(
  roadmapId: string,
  userId: string,
  completedLevel: number
): Promise<UnlockResult> {
  try {
    // Get the roadmap
    const roadmapDoc = await getDoc(doc(db, 'roadmaps', roadmapId));
    if (!roadmapDoc.exists()) {
      throw new Error('Roadmap not found');
    }
    
    const roadmapData = roadmapDoc.data();
    const milestones = roadmapData.milestones as Milestone[];
    
    // Get user progress
    const userProgressDoc = await getDoc(doc(db, 'userProgress', userId));
    if (!userProgressDoc.exists()) {
      throw new Error('User progress not found');
    }
    
    const userProgress = userProgressDoc.data() as UserProgress;
    
    // Check if all milestones for the completed level are done
    const levelMilestones = milestones.filter(m => (m.level || 1) === completedLevel);
    const completedLevelMilestones = levelMilestones.filter(
      m => userProgress.completedMilestones.includes(m.id)
    );
    
    if (completedLevelMilestones.length < levelMilestones.length) {
      return {
        unlockedMilestones: [],
        newLevel: userProgress.currentLevel,
        message: `Complete all milestones in level ${completedLevel} to unlock the next level`
      };
    }
    
    // All milestones for the level are completed - unlock next level
    const nextLevel = completedLevel + 1;
    const nextLevelMilestones = milestones.filter(m => (m.level || 1) === nextLevel);
    const unlockedMilestoneIds = nextLevelMilestones.map(m => m.id);
    
    // Update user's max unlocked level
    const newMaxUnlockedLevel = Math.max(userProgress.maxUnlockedLevel || 1, nextLevel);
    
    // Update user progress
    await updateDoc(doc(db, 'userProgress', userId), {
      maxUnlockedLevel: newMaxUnlockedLevel,
      updatedAt: new Date()
    });
    
    return {
      unlockedMilestones: unlockedMilestoneIds,
      newLevel: nextLevel,
      message: `Congratulations! You've unlocked Level ${nextLevel} with ${nextLevelMilestones.length} new milestones!`
    };
    
  } catch (error) {
    console.error('Error checking and unlocking milestones:', error);
    throw error;
  }
}

/**
 * Get all unlocked milestones for a user
 */
export function getUnlockedMilestones(
  milestones: Milestone[],
  userProgress: UserProgress
): Milestone[] {
  return milestones.filter(milestone => isMilestoneUnlocked(milestone, userProgress));
}

/**
 * Get locked milestones with reasons
 */
export function getLockedMilestonesWithReasons(
  milestones: Milestone[],
  userProgress: UserProgress
): Array<{ milestone: Milestone; reason: string }> {
  const maxUnlockedLevel = userProgress.maxUnlockedLevel || 1;
  const lockedMilestones: Array<{ milestone: Milestone; reason: string }> = [];
  
  for (const milestone of milestones) {
    if (!isMilestoneUnlocked(milestone, userProgress)) {
      let reason = '';
      
      // Check level requirement
      const milestoneLevel = milestone.level || 1;
      if (milestoneLevel > maxUnlockedLevel && milestoneLevel !== 1) {
        reason = `Complete all milestones in Level ${milestoneLevel - 1} to unlock`;
      }
      // Check prerequisites
      else if (milestone.prerequisites && milestone.prerequisites.length > 0) {
        const missingPrereqs = milestone.prerequisites.filter(
          prereqId => !userProgress.completedMilestones.includes(prereqId)
        );
        if (missingPrereqs.length > 0) {
          reason = `Complete ${missingPrereqs.length} prerequisite milestone(s) first`;
        }
      }
      // Check unlock conditions
      else if (milestone.unlockConditions && milestone.unlockConditions.length > 0) {
        reason = 'Special conditions not yet met';
      }
      
      if (reason) {
        lockedMilestones.push({ milestone, reason });
      }
    }
  }
  
  return lockedMilestones;
}