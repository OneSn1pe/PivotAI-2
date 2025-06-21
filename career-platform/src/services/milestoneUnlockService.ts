import { Milestone, UserProgress } from '@/types/user';
import { db } from '@/config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { calculateUserLevel } from './levelProgressService';

export { calculateMaxUnlockedLevel };

export interface UnlockResult {
  unlockedMilestones: string[];
  newLevel: number;
  message: string;
}

/**
 * Calculate the maximum unlocked level based on completed milestones and micro-milestones
 * A level is only unlocked if ALL milestones AND micro-milestones from ALL previous levels are completed
 */
export function calculateMaxUnlockedLevel(
  milestones: Milestone[],
  userProgress: UserProgress
): number {
  // Group milestones by level
  const milestonesByLevel: Map<number, Milestone[]> = new Map();
  milestones.forEach(milestone => {
    const level = milestone.level || 1;
    if (!milestonesByLevel.has(level)) {
      milestonesByLevel.set(level, []);
    }
    milestonesByLevel.get(level)!.push(milestone);
  });

  // Get sorted levels
  const levels = Array.from(milestonesByLevel.keys()).sort((a, b) => a - b);
  
  // Level 1 is always unlocked
  let maxUnlockedLevel = 1;
  
  // Check each level sequentially
  for (const level of levels) {
    if (level <= maxUnlockedLevel) continue; // Skip already unlocked levels
    
    // Check if all previous levels are fully completed
    let allPreviousLevelsComplete = true;
    
    for (let prevLevel = 1; prevLevel < level; prevLevel++) {
      const prevLevelMilestones = milestonesByLevel.get(prevLevel) || [];
      
      // Check regular milestones
      const allMilestonesComplete = prevLevelMilestones.every(m => 
        userProgress.completedMilestones.includes(m.id)
      );
      
      // Check micro-milestones
      const allMicroMilestonesComplete = prevLevelMilestones.every(m => {
        if (m.microMilestones && m.microMilestones.length > 0) {
          return m.microMilestones.every(micro => 
            userProgress.completedMicroMilestones.includes(micro.id)
          );
        }
        return true;
      });
      
      if (!allMilestonesComplete || !allMicroMilestonesComplete) {
        allPreviousLevelsComplete = false;
        break;
      }
    }
    
    if (allPreviousLevelsComplete) {
      maxUnlockedLevel = level;
    } else {
      // Once we find a level that can't be unlocked, stop checking
      break;
    }
  }
  
  return maxUnlockedLevel;
}

/**
 * Check if a milestone is unlocked based on user progress
 * Now requires ALL micro-milestones from previous levels to be completed
 */
export function isMilestoneUnlocked(
  milestone: Milestone, 
  userProgress: UserProgress,
  allMilestones?: Milestone[]
): boolean {
  // A milestone is unlocked if:
  // 1. Its level is <= user's maxUnlockedLevel (or level 1)
  // 2. All prerequisites are completed
  // 3. All unlock conditions are met
  // 4. All milestones AND micro-milestones from previous levels are completed
  
  // Check level requirement
  const milestoneLevel = milestone.level || 1;
  const maxUnlockedLevel = userProgress.maxUnlockedLevel || 1;
  
  // Level 1 is always unlocked, otherwise check against maxUnlockedLevel
  if (milestoneLevel > maxUnlockedLevel && milestoneLevel !== 1) {
    return false;
  }
  
  // NEW: If we have access to all milestones, verify that all previous levels are fully completed
  if (allMilestones && milestoneLevel > 1) {
    // Check all levels below the current milestone's level
    for (let level = 1; level < milestoneLevel; level++) {
      const levelMilestones = allMilestones.filter(m => (m.level || 1) === level);
      
      // Check if all regular milestones are completed
      const allMilestonesCompleted = levelMilestones.every(m => 
        userProgress.completedMilestones.includes(m.id)
      );
      
      // Check if all micro-milestones are completed
      const allMicroMilestonesCompleted = levelMilestones.every(m => {
        if (m.microMilestones && m.microMilestones.length > 0) {
          return m.microMilestones.every(micro => 
            userProgress.completedMicroMilestones.includes(micro.id)
          );
        }
        return true;
      });
      
      if (!allMilestonesCompleted || !allMicroMilestonesCompleted) {
        return false;
      }
    }
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
    
    // Check if all milestones AND micro-milestones for the completed level are done
    const levelMilestones = milestones.filter(m => (m.level || 1) === completedLevel);
    
    // Check regular milestones completion
    const allMilestonesCompleted = levelMilestones.every(
      m => userProgress.completedMilestones.includes(m.id)
    );
    
    // Check micro-milestones completion
    const allMicroMilestonesCompleted = levelMilestones.every(m => {
      if (m.microMilestones && m.microMilestones.length > 0) {
        return m.microMilestones.every(micro => 
          userProgress.completedMicroMilestones.includes(micro.id)
        );
      }
      return true; // No micro-milestones means they're "completed"
    });
    
    if (!allMilestonesCompleted || !allMicroMilestonesCompleted) {
      const incompleteMilestones = levelMilestones.filter(
        m => !userProgress.completedMilestones.includes(m.id)
      ).length;
      
      const incompleteMicroMilestones = levelMilestones.reduce((count, m) => {
        if (m.microMilestones) {
          return count + m.microMilestones.filter(
            micro => !userProgress.completedMicroMilestones.includes(micro.id)
          ).length;
        }
        return count;
      }, 0);
      
      let message = `Complete all milestones in level ${completedLevel} to unlock the next level.`;
      if (incompleteMilestones > 0) {
        message += ` ${incompleteMilestones} milestone(s) remaining.`;
      }
      if (incompleteMicroMilestones > 0) {
        message += ` ${incompleteMicroMilestones} micro-milestone(s) remaining.`;
      }
      
      return {
        unlockedMilestones: [],
        newLevel: userProgress.currentLevel,
        message
      };
    }
    
    // All milestones and micro-milestones for the level are completed - unlock next level
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
  return milestones.filter(milestone => isMilestoneUnlocked(milestone, userProgress, milestones));
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
    if (!isMilestoneUnlocked(milestone, userProgress, milestones)) {
      let reason = '';
      const milestoneLevel = milestone.level || 1;
      
      // Check if previous levels have incomplete milestones or micro-milestones
      if (milestoneLevel > 1) {
        for (let level = 1; level < milestoneLevel; level++) {
          const levelMilestones = milestones.filter(m => (m.level || 1) === level);
          
          const incompleteMilestones = levelMilestones.filter(m => 
            !userProgress.completedMilestones.includes(m.id)
          ).length;
          
          const incompleteMicroMilestones = levelMilestones.reduce((count, m) => {
            if (m.microMilestones) {
              return count + m.microMilestones.filter(
                micro => !userProgress.completedMicroMilestones.includes(micro.id)
              ).length;
            }
            return count;
          }, 0);
          
          if (incompleteMilestones > 0 || incompleteMicroMilestones > 0) {
            reason = `Complete all milestones and micro-milestones in Level ${level} first`;
            if (incompleteMilestones > 0) {
              reason += ` (${incompleteMilestones} milestone(s)`;
              if (incompleteMicroMilestones > 0) {
                reason += `, ${incompleteMicroMilestones} micro-milestone(s)`;
              }
              reason += ' remaining)';
            } else if (incompleteMicroMilestones > 0) {
              reason += ` (${incompleteMicroMilestones} micro-milestone(s) remaining)`;
            }
            break;
          }
        }
      }
      
      // If no reason found from level checks, check other conditions
      if (!reason) {
        // Check level requirement
        if (milestoneLevel > maxUnlockedLevel && milestoneLevel !== 1) {
          reason = `Complete all milestones and micro-milestones in Level ${milestoneLevel - 1} to unlock`;
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
      }
      
      if (reason) {
        lockedMilestones.push({ milestone, reason });
      }
    }
  }
  
  return lockedMilestones;
}