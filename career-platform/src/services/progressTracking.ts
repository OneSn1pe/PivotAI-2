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
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = progress.streakDays;
    let xpGained = 0;

    if (daysDiff === 1) {
      // Consecutive day
      newStreak += 1;
      xpGained = DAILY_LOGIN_XP * (1 + (newStreak / 10)); // Bonus for longer streaks
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1;
      xpGained = DAILY_LOGIN_XP;
    } else if (daysDiff === 0) {
      // Same day login, no XP
      return { streakDays: newStreak, xpGained: 0 };
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

    // Check if already completed
    const completedList = isMicro ? progress.completedMicroMilestones : progress.completedMilestones;
    if (completedList.includes(milestoneId)) {
      return { xpGained: 0, leveledUp: false };
    }

    // Calculate new XP and level
    const newTotalXP = progress.totalXP + xpGained;
    const newCurrentXP = progress.currentXP + xpGained;
    const currentLevelThreshold = this.getXPForLevel(progress.currentLevel);
    
    let leveledUp = false;
    let newLevel = progress.currentLevel;

    if (newCurrentXP >= currentLevelThreshold) {
      leveledUp = true;
      newLevel = progress.currentLevel + 1;
    }

    // Update progress
    const updateData: any = {
      totalXP: newTotalXP,
      currentXP: leveledUp ? newCurrentXP - currentLevelThreshold : newCurrentXP,
      lastActiveDate: serverTimestamp(),
    };

    if (leveledUp) {
      updateData.currentLevel = newLevel;
      updateData.maxUnlockedLevel = Math.max(newLevel, progress.maxUnlockedLevel);
    }

    if (isMicro) {
      updateData.completedMicroMilestones = [...progress.completedMicroMilestones, milestoneId];
    } else {
      updateData.completedMilestones = [...progress.completedMilestones, milestoneId];
    }

    await updateDoc(doc(db, 'userProgress', userId), updateData);

    // Check for achievements
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

  // Calculate total XP for current level progress
  static calculateLevelProgress(progress: UserProgress): {
    percentage: number;
    currentLevelXP: number;
    requiredXP: number;
  } {
    const requiredXP = this.getXPForLevel(progress.currentLevel);
    const percentage = (progress.currentXP / requiredXP) * 100;

    return {
      percentage,
      currentLevelXP: progress.currentXP,
      requiredXP,
    };
  }

  // Check and award streak achievements
  static async checkStreakAchievements(userId: string, streakDays: number): Promise<Achievement | null> {
    const achievements: { days: number; achievement: Achievement }[] = [
      {
        days: 3,
        achievement: {
          id: 'streak_3',
          title: 'Getting Started',
          description: 'Maintain a 3-day learning streak',
          icon: '🔥',
          category: 'streak',
          unlockedAt: new Date(),
          rarity: 'common',
        },
      },
      {
        days: 7,
        achievement: {
          id: 'streak_7',
          title: 'Week Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: '🔥',
          category: 'streak',
          unlockedAt: new Date(),
          rarity: 'uncommon',
        },
      },
      {
        days: 30,
        achievement: {
          id: 'streak_30',
          title: 'Consistency Champion',
          description: 'Maintain a 30-day learning streak',
          icon: '🔥',
          category: 'streak',
          unlockedAt: new Date(),
          rarity: 'rare',
        },
      },
      {
        days: 100,
        achievement: {
          id: 'streak_100',
          title: 'Legendary Learner',
          description: 'Maintain a 100-day learning streak',
          icon: '🔥',
          category: 'streak',
          unlockedAt: new Date(),
          rarity: 'legendary',
        },
      },
    ];

    for (const { days, achievement } of achievements) {
      if (streakDays === days) {
        await this.awardAchievement(userId, achievement);
        return achievement;
      }
    }

    return null;
  }

  // Check and award milestone achievements
  static async checkMilestoneAchievements(
    userId: string, 
    milestonesCount: number, 
    microMilestonesCount: number
  ): Promise<Achievement | null> {
    const totalCount = milestonesCount + microMilestonesCount;
    
    const achievements: { count: number; achievement: Achievement }[] = [
      {
        count: 1,
        achievement: {
          id: 'first_milestone',
          title: 'First Steps',
          description: 'Complete your first milestone',
          icon: '🏁',
          category: 'progress',
          unlockedAt: new Date(),
          rarity: 'common',
        },
      },
      {
        count: 10,
        achievement: {
          id: 'milestone_10',
          title: 'Making Progress',
          description: 'Complete 10 milestones',
          icon: '🏃',
          category: 'progress',
          unlockedAt: new Date(),
          rarity: 'uncommon',
        },
      },
      {
        count: 50,
        achievement: {
          id: 'milestone_50',
          title: 'Milestone Master',
          description: 'Complete 50 milestones',
          icon: '🏆',
          category: 'progress',
          unlockedAt: new Date(),
          rarity: 'rare',
        },
      },
    ];

    for (const { count, achievement } of achievements) {
      if (totalCount === count) {
        await this.awardAchievement(userId, achievement);
        return achievement;
      }
    }

    return null;
  }

  // Award an achievement
  static async awardAchievement(userId: string, achievement: Achievement): Promise<void> {
    const achievementRef = doc(db, 'achievements', `${userId}_${achievement.id}`);
    
    // Check if already awarded
    const existingDoc = await getDoc(achievementRef);
    if (existingDoc.exists()) return;

    // Save achievement
    await setDoc(achievementRef, {
      ...achievement,
      userId,
      awardedAt: serverTimestamp(),
    });

    // Update user's achievement list
    const progressRef = doc(db, 'userProgress', userId);
    const progress = await this.getUserProgress(userId);
    
    await updateDoc(progressRef, {
      achievements: [...progress.achievements, achievement.id],
    });
  }

  // Get all user achievements
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
    // In a full implementation, you'd track daily activity in a separate collection
    const totalActiveDays = Math.min(days, progress.streakDays);
    const milestonesCompleted = progress.completedMilestones.length + progress.completedMicroMilestones.length;
    const xpGained = progress.totalXP;
    const averageXPPerDay = totalActiveDays > 0 ? xpGained / totalActiveDays : 0;

    return {
      totalActiveDays,
      milestonesCompleted,
      xpGained,
      averageXPPerDay,
    };
  }
}