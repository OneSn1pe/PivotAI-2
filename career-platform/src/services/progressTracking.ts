import { db } from '@/config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { UserProgress, Achievement, Milestone } from '@/types/user';


export class ProgressTrackingService {
  // Update user's current level based on completed milestones
  static async updateUserLevel(userId: string, roadmapMilestones: any[]): Promise<{ leveledUp: boolean; newLevel: number; oldLevel: number }> {
    const progress = await this.getUserProgress(userId);
    const oldLevel = progress.currentLevel;
    
    // Calculate the highest level where ALL milestones AND micro-milestones are completed
    let highestCompletedLevel = 0;
    
    // Group milestones by level
    const milestonesByLevel = roadmapMilestones.reduce((acc, milestone) => {
      const level = milestone.level || 1;
      if (!acc[level]) acc[level] = [];
      acc[level].push(milestone);
      return acc;
    }, {} as Record<number, any[]>);
    
    // Check each level to find the highest completed one
    const levels = Object.keys(milestonesByLevel).map(Number).sort((a, b) => a - b);
    
    for (const level of levels) {
      const levelMilestones = milestonesByLevel[level];
      
      // Check if all regular milestones are completed
      const allMilestonesCompleted = levelMilestones.every((m: any) => 
        progress.completedMilestones.includes(m.id)
      );
      
      // Check if all micro-milestones are completed
      const allMicroMilestonesCompleted = levelMilestones.every((m: any) => {
        // If milestone has micro-milestones, check if they're all completed
        if (m.microMilestones && m.microMilestones.length > 0) {
          return m.microMilestones.every((micro: any) => 
            progress.completedMicroMilestones.includes(micro.id)
          );
        }
        // If no micro-milestones, consider them as completed
        return true;
      });
      
      if (allMilestonesCompleted && allMicroMilestonesCompleted && levelMilestones.length > 0) {
        highestCompletedLevel = level;
      } else {
        // Once we find an incomplete level, stop checking higher levels
        break;
      }
    }
    
    // Update the current level if it has changed
    const newLevel = Math.max(1, highestCompletedLevel);
    
    if (newLevel !== oldLevel) {
      const progressRef = doc(db, 'userProgress', userId);
      await updateDoc(progressRef, {
        currentLevel: newLevel,
        maxUnlockedLevel: Math.max(newLevel + 1, progress.maxUnlockedLevel || 1)
      });
      
      return { leveledUp: newLevel > oldLevel, newLevel, oldLevel };
    }
    
    return { leveledUp: false, newLevel: oldLevel, oldLevel };
  }

  // Get or create user progress
  static async getUserProgress(userId: string): Promise<UserProgress> {
    const progressRef = doc(db, 'userProgress', userId);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const data = progressDoc.data();
      return {
        ...data,
        lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
      } as UserProgress;
    }

    // Create initial progress
    const initialProgress: UserProgress = {
      userId,
      currentLevel: 1,
      maxUnlockedLevel: 1,
      completedMilestones: [],
      completedMicroMilestones: [],
      achievements: [],
      streakDays: 0,
      lastActiveDate: new Date(),
      skillProficiencies: {},
    };

    await setDoc(progressRef, {
      ...initialProgress,
      lastActiveDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return initialProgress;
  }

  // Update streak and daily login
  static async updateDailyActivity(userId: string): Promise<{ streakDays: number }> {
    const progressRef = doc(db, 'userProgress', userId);
    const progress = await this.getUserProgress(userId);

    const now = new Date();
    const lastActive = new Date(progress.lastActiveDate);
    const daysSinceLastActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = progress.streakDays;

    if (daysSinceLastActive === 0) {
      // Already logged in today
      return { streakDays: newStreak };
    } else if (daysSinceLastActive === 1) {
      // Consecutive day
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    // Update progress
    await updateDoc(progressRef, {
      streakDays: newStreak,
      lastActiveDate: serverTimestamp(),
    });

    // Check for streak achievements
    await this.checkStreakAchievements(userId, newStreak);

    return { streakDays: newStreak };
  }

  // Complete a milestone
  static async completeMilestone(userId: string, milestoneId: string, isMicro: boolean = false, milestoneLevel?: number): Promise<{
    achievement?: Achievement;
    leveledUp?: boolean;
    newLevel?: number;
  }> {
    const progress = await this.getUserProgress(userId);

    const arrayField = isMicro ? 'completedMicroMilestones' : 'completedMilestones';
    const completedArray = isMicro ? progress.completedMicroMilestones : progress.completedMilestones;

    if (completedArray.includes(milestoneId)) {
      return {};
    }

    const updateData: any = {
      [arrayField]: [...completedArray, milestoneId],
    };

    // If this is a regular milestone and we have the level, check if we need to update currentLevel
    let leveledUp = false;
    let newLevel = progress.currentLevel;
    
    if (!isMicro && milestoneLevel) {
      // We need to check if all milestones for this level are now completed
      // This would require fetching the roadmap to check, so we'll do a simpler check
      // The proper level calculation should happen in a separate function that has access to all milestones
      updateData.currentLevel = milestoneLevel;
      
      if (milestoneLevel > progress.currentLevel) {
        leveledUp = true;
        newLevel = milestoneLevel;
      }
    }

    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, updateData);

    // Check for milestone achievements
    const achievement = await this.checkMilestoneAchievements(
      userId, 
      updateData.completedMilestones?.length || progress.completedMilestones.length,
      updateData.completedMicroMilestones?.length || progress.completedMicroMilestones.length
    );

    return { 
      achievement: achievement || undefined,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined
    };
  }


  // Check and award streak achievements
  private static async checkStreakAchievements(userId: string, streakDays: number): Promise<Achievement | null> {
    const streakMilestones = [3, 7, 14, 30, 50, 100];
    
    for (const milestone of streakMilestones) {
      if (streakDays === milestone) {
        return await this.awardAchievement(userId, {
          id: `streak_${milestone}`,
          title: `${milestone}-Day Streak!`,
          description: `Maintained a ${milestone}-day learning streak`,
          icon: '🔥',
          category: 'streak',
          rarity: milestone >= 50 ? 'legendary' : milestone >= 30 ? 'epic' : milestone >= 14 ? 'rare' : 'common',
        });
      }
    }
    
    return null;
  }

  // Check and award milestone achievements
  private static async checkMilestoneAchievements(
    userId: string, 
    milestonesCount: number,
    microMilestonesCount: number
  ): Promise<Achievement | null> {
    const totalCount = milestonesCount + Math.floor(microMilestonesCount / 5); // 5 micro = 1 regular
    const milestoneCounts = [1, 5, 10, 25, 50, 100];
    
    for (const count of milestoneCounts) {
      if (totalCount === count) {
        return await this.awardAchievement(userId, {
          id: `milestones_${count}`,
          title: `${count} Milestones Completed!`,
          description: `Completed ${count} career milestones`,
          icon: '🎯',
          category: 'progress',
          rarity: count >= 50 ? 'legendary' : count >= 25 ? 'epic' : count >= 10 ? 'rare' : 'common',
        });
      }
    }
    
    return null;
  }

  // Award achievement
  private static async awardAchievement(
    userId: string, 
    achievementData: Omit<Achievement, 'unlockedAt'>
  ): Promise<Achievement> {
    const achievement: Achievement = {
      ...achievementData,
      unlockedAt: new Date(),
    };

    // Save to achievements collection
    const achievementRef = doc(collection(db, 'achievements'));
    await setDoc(achievementRef, {
      ...achievement,
      userId,
      awardedAt: serverTimestamp(),
    });

    // Update user's achievement list
    const progressRef = doc(db, 'userProgress', userId);
    const progress = await this.getUserProgress(userId);
    
    if (!progress.achievements.includes(achievement.id)) {
      await updateDoc(progressRef, {
        achievements: [...progress.achievements, achievement.id],
      });
    }

    return achievement;
  }

  // Get user achievements
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(achievementsQuery);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      unlockedAt: doc.data().awardedAt?.toDate() || new Date(),
    } as Achievement));
  }

  // Update skill proficiency
  static async updateSkillProficiency(
    userId: string, 
    skill: string, 
    proficiency: number
  ): Promise<void> {
    const progressRef = doc(db, 'userProgress', userId);
    const progress = await this.getUserProgress(userId);

    await updateDoc(progressRef, {
      skillProficiencies: {
        ...progress.skillProficiencies,
        [skill]: Math.min(100, Math.max(0, proficiency)),
      },
    });
  }

  // Get activity stats for a user
  static async getActivityStats(userId: string, days: number = 30): Promise<{
    totalActiveDays: number;
    milestonesCompleted: number;
  }> {
    const progress = await this.getUserProgress(userId);
    
    // For now, return calculated stats based on current progress
    // In a real implementation, you'd query activity logs
    const totalActiveDays = Math.min(progress.streakDays, days);
    const milestonesCompleted = progress.completedMilestones.length;

    return {
      totalActiveDays,
      milestonesCompleted,
    };
  }
}