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

// Constants for leveling system
const XP_PER_LEVEL = 1000;
const XP_MULTIPLIER = 1.2;
const MILESTONE_XP = 500;
const MICRO_MILESTONE_XP = 100;
const DAILY_LOGIN_XP = 50;

export class ProgressTrackingService {
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
      currentXP: 0,
      totalXP: 0,
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
  static async updateDailyActivity(userId: string): Promise<{ streakDays: number; xpGained: number }> {
    const progressRef = doc(db, 'userProgress', userId);
    const progress = await this.getUserProgress(userId);

    const now = new Date();
    const lastActive = new Date(progress.lastActiveDate);
    const daysSinceLastActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = progress.streakDays;
    let xpGained = 0;

    if (daysSinceLastActive === 0) {
      // Already logged in today
      return { streakDays: newStreak, xpGained: 0 };
    } else if (daysSinceLastActive === 1) {
      // Consecutive day
      newStreak += 1;
      xpGained = DAILY_LOGIN_XP;
    } else {
      // Streak broken
      newStreak = 1;
      xpGained = DAILY_LOGIN_XP;
    }

    // Update progress
    await updateDoc(progressRef, {
      streakDays: newStreak,
      lastActiveDate: serverTimestamp(),
      currentXP: progress.currentXP + xpGained,
      totalXP: progress.totalXP + xpGained,
    });

    // Check for streak achievements
    await this.checkStreakAchievements(userId, newStreak);

    return { streakDays: newStreak, xpGained };
  }

  // Complete a milestone
  static async completeMilestone(userId: string, milestoneId: string, isMicro: boolean = false): Promise<{
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
    achievement?: Achievement;
  }> {
    const progress = await this.getUserProgress(userId);
    const xpGained = isMicro ? MICRO_MILESTONE_XP : MILESTONE_XP;

    const arrayField = isMicro ? 'completedMicroMilestones' : 'completedMilestones';
    const completedArray = isMicro ? progress.completedMicroMilestones : progress.completedMilestones;

    if (completedArray.includes(milestoneId)) {
      return { xpGained: 0, leveledUp: false };
    }

    const newXP = progress.currentXP + xpGained;
    const newTotalXP = progress.totalXP + xpGained;
    const currentLevelXP = this.getXPForLevel(progress.currentLevel);
    
    let leveledUp = false;
    let newLevel = progress.currentLevel;

    if (newXP >= currentLevelXP) {
      leveledUp = true;
      newLevel = progress.currentLevel + 1;
    }

    const updateData: any = {
      [arrayField]: [...completedArray, milestoneId],
      currentXP: leveledUp ? newXP - currentLevelXP : newXP,
      totalXP: newTotalXP,
    };

    if (leveledUp) {
      updateData.currentLevel = newLevel;
      updateData.maxUnlockedLevel = Math.max(progress.maxUnlockedLevel, newLevel);
    }

    const progressRef = doc(db, 'userProgress', userId);
    await updateDoc(progressRef, updateData);

    // Check for milestone achievements
    const achievement = await this.checkMilestoneAchievements(
      userId, 
      updateData.completedMilestones?.length || progress.completedMilestones.length,
      updateData.completedMicroMilestones?.length || progress.completedMicroMilestones.length
    );

    return { xpGained, leveledUp, newLevel: leveledUp ? newLevel : undefined, achievement: achievement || undefined };
  }

  // Get XP required for a specific level
  static getXPForLevel(level: number): number {
    return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level - 1));
  }

  // Calculate level progress
  static calculateLevelProgress(progress: UserProgress): {
    currentLevelXP: number;
    nextLevelXP: number;
    percentage: number;
  } {
    const nextLevelXP = this.getXPForLevel(progress.currentLevel);
    const percentage = (progress.currentXP / nextLevelXP) * 100;

    return {
      currentLevelXP: progress.currentXP,
      nextLevelXP,
      percentage: Math.min(percentage, 100),
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
    xpGained: number;
    averageXPPerDay: number;
  }> {
    const progress = await this.getUserProgress(userId);
    
    // For now, return calculated stats based on current progress
    // In a real implementation, you'd query activity logs
    const totalActiveDays = Math.min(progress.streakDays, days);
    const milestonesCompleted = progress.completedMilestones.length;
    const xpGained = progress.totalXP;
    const averageXPPerDay = totalActiveDays > 0 ? Math.round(xpGained / totalActiveDays) : 0;

    return {
      totalActiveDays,
      milestonesCompleted,
      xpGained,
      averageXPPerDay,
    };
  }
}