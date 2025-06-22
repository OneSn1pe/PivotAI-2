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
  Timestamp,
  deleteField 
} from 'firebase/firestore';
import { UserProgress, Achievement, Milestone } from '@/types/user';


export class ProgressTrackingService {
  // Update user's current level based on completed milestones
  static async updateUserLevel(userId: string, roadmapMilestones: any[]): Promise<{ leveledUp: boolean; newLevel: number; oldLevel: number }> {
    const progress = await this.getUserProgress(userId);
    const oldLevel = progress.levelsUnlocked || 1;
    
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
    
    // The next unlocked level is one higher than the highest completed level
    // This allows users to see and work on the next level's milestones
    const nextUnlockedLevel = highestCompletedLevel + 1;
    const currentLevel = progress.levelsUnlocked || 1;
    const newLevel = Math.max(currentLevel, nextUnlockedLevel);
    
    if (newLevel !== oldLevel) {
      const progressRef = doc(db, 'userProgress', userId);
      await updateDoc(progressRef, {
        levelsUnlocked: newLevel
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
      
      // Handle migration from old format
      let levelsUnlocked = data.levelsUnlocked;
      
      // Migrate from array to single number
      if (Array.isArray(levelsUnlocked)) {
        levelsUnlocked = levelsUnlocked.length > 0 ? Math.max(...levelsUnlocked) : 1;
        
        // Update the document with new format
        await updateDoc(progressRef, {
          levelsUnlocked
        });
      }
      
      // Migrate from old currentLevel/maxUnlockedLevel format
      if (!levelsUnlocked && (data.currentLevel || data.maxUnlockedLevel)) {
        levelsUnlocked = data.currentLevel || 1;
        
        // Update the document with new format and remove old fields
        await updateDoc(progressRef, {
          levelsUnlocked,
          currentLevel: deleteField(),
          maxUnlockedLevel: deleteField()
        });
      }
      
      return {
        ...data,
        levelsUnlocked: levelsUnlocked || 1,
        lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
      } as UserProgress;
    }

    // Create initial progress
    const initialProgress: UserProgress = {
      userId,
      levelsUnlocked: 1,
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

    // Note: Level updates should ONLY happen through updateUserLevel method
    // This ensures proper validation that all milestones in previous levels are complete

    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, updateData);

    // Check for milestone achievements
    const achievement = await this.checkMilestoneAchievements(
      userId, 
      updateData.completedMilestones?.length || progress.completedMilestones.length,
      updateData.completedMicroMilestones?.length || progress.completedMicroMilestones.length
    );

    return { 
      achievement: achievement || undefined
    };
  }

  // Uncomplete a milestone
  static async uncompleteMilestone(userId: string, milestoneId: string, isMicro: boolean = false): Promise<void> {
    const progress = await this.getUserProgress(userId);

    const arrayField = isMicro ? 'completedMicroMilestones' : 'completedMilestones';
    const completedArray = isMicro ? progress.completedMicroMilestones : progress.completedMilestones;

    if (!completedArray.includes(milestoneId)) {
      return; // Already not completed
    }

    const updateData: any = {
      [arrayField]: completedArray.filter(id => id !== milestoneId),
    };

    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, updateData);
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