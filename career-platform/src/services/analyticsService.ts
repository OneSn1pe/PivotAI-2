import { UserProgress, Milestone, Achievement, MicroMilestone } from '@/types/user';

export interface ProgressInsights {
  trends: {
    levelProgression: { date: Date; level: number }[];
    streakPatterns: { date: Date; streak: number }[];
    milestoneCompletion: { date: Date; completed: number }[];
  };
  
  skillGaps: {
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: 'high' | 'medium' | 'low';
    recommendedActions: string[];
  }[];
  
  recommendations: Recommendation[];
  
  goalPrediction: {
    estimatedLevelUpDate: Date;
    confidenceScore: number;
    daysToNextLevel: number;
    requiredDailyMilestones: number;
  };
  
  performanceMetrics: {
    completionRate: number;
    streakConsistency: number;
    learningVelocity: number;
  };
  
  patterns: {
    mostProductiveDays: string[];
    optimalLearningTime: string;
    strengths: string[];
    improvementAreas: string[];
  };
}

export interface Recommendation {
  id: string;
  type: 'milestone' | 'skill' | 'achievement' | 'habit' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: {
    levelProgression: number;
    skillImprovement: string[];
  };
  actionItems: string[];
  estimatedTimeCommitment: string;
  deadline?: Date;
}

export interface AnalyticsData {
  milestoneCompletions: {
    milestoneId: string;
    completedAt: Date;
    timeToComplete: number; // in days
    difficulty: number;
  }[];
  
  learningActivity: {
    date: Date;
    milestonesCompleted: number;
    timeSpent: number; // in minutes
    sessionQuality: number; // 1-5 rating
  }[];
  
  skillProgression: {
    skill: string;
    assessments: {
      date: Date;
      proficiency: number; // 0-100
      confidenceScore: number;
    }[];
  }[];
}

export class AnalyticsService {
  /**
   * Track milestone completion with detailed metrics
   */
  static async trackMilestoneCompletion(
    userId: string,
    milestoneId: string,
    timeToComplete: number,
    difficulty: number
  ): Promise<void> {
    try {
      const completionData = {
        userId,
        milestoneId,
        completedAt: new Date(),
        timeToComplete,
        difficulty,
        // Additional context
        sessionData: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: Date.now(),
        }
      };
      
      // In a real implementation, this would save to analytics database
      console.log('Tracking milestone completion:', completionData);
      
      // Store in localStorage for development
      if (typeof window !== 'undefined') {
        const existingData = JSON.parse(localStorage.getItem('analytics_milestones') || '[]');
        existingData.push(completionData);
        localStorage.setItem('analytics_milestones', JSON.stringify(existingData));
      }
    } catch (error) {
      console.error('Error tracking milestone completion:', error);
    }
  }

  /**
   * Track daily learning activity
   */
  static async trackLearningActivity(
    userId: string,
    milestonesCompleted: number,
    timeSpent: number,
    sessionQuality: number = 3
  ): Promise<void> {
    try {
      const activityData = {
        userId,
        date: new Date(),
        milestonesCompleted,
        timeSpent,
        sessionQuality
      };
      
      // Store in localStorage for development
      if (typeof window !== 'undefined') {
        const existingData = JSON.parse(localStorage.getItem('analytics_activity') || '[]');
        existingData.push(activityData);
        localStorage.setItem('analytics_activity', JSON.stringify(existingData));
      }
    } catch (error) {
      console.error('Error tracking learning activity:', error);
    }
  }

  /**
   * Generate comprehensive progress insights
   */
  static async generateProgressInsights(
    userId: string,
    userProgress: UserProgress,
    milestones: Milestone[]
  ): Promise<ProgressInsights> {
    try {
      // Load analytics data (in real implementation, from database)
      const milestoneData = this.loadMilestoneData();
      const activityData = this.loadActivityData();
      
      // Generate trends
      const trends = this.analyzeTrends(activityData);
      
      // Analyze skill gaps
      const skillGaps = this.analyzeSkillGaps(userProgress, milestones);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(userProgress, milestones, trends);
      
      // Predict goal completion
      const goalPrediction = this.predictGoalCompletion(userProgress, trends);
      
      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(activityData, userProgress);
      
      // Identify patterns
      const patterns = this.identifyLearningPatterns(activityData, milestoneData);

      return {
        trends,
        skillGaps,
        recommendations,
        goalPrediction,
        performanceMetrics,
        patterns
      };
    } catch (error) {
      console.error('Error generating progress insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(
    userProgress: UserProgress,
    milestones: Milestone[]
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];
      
      // Milestone-based recommendations
      const incompleteMilestones = milestones.filter(m => 
        !userProgress.completedMilestones.includes(m.id) &&
        (!m.prerequisites || m.prerequisites.every(prereq => 
          userProgress.completedMilestones.includes(prereq)
        ))
      );
      
      // Prioritize by difficulty and level
      const prioritizedMilestones = incompleteMilestones
        .sort((a, b) => (a.level || 1) - (b.level || 1))
        .slice(0, 3);
      
      prioritizedMilestones.forEach(milestone => {
        recommendations.push({
          id: `milestone-${milestone.id}`,
          type: 'milestone',
          priority: milestone.priority as any || 'medium',
          title: `Complete "${milestone.title}"`,
          description: `This milestone will advance your ${milestone.category} skills and help you progress in your career.`,
          expectedImpact: {
            levelProgression: 0.1,
            skillImprovement: milestone.skills || []
          },
          actionItems: [
            'Review milestone requirements',
            'Allocate dedicated time for completion',
            'Track progress daily'
          ],
          estimatedTimeCommitment: milestone.timeframe || '1-2 weeks'
        });
      });

      // Streak-based recommendations
      if (userProgress.streakDays < 7) {
        recommendations.push({
          id: 'build-streak',
          type: 'habit',
          priority: 'high',
          title: 'Build a 7-Day Learning Streak',
          description: 'Consistent daily learning will unlock streak bonuses and improve retention.',
          expectedImpact: {
            levelProgression: 0.15,
            skillImprovement: ['consistency', 'discipline']
          },
          actionItems: [
            'Set a daily learning reminder',
            'Complete at least one micro-milestone daily',
            'Track your progress in the app'
          ],
          estimatedTimeCommitment: '15-30 minutes daily'
        });
      }

      // Skill gap recommendations
      const lowProficiencySkills = Object.entries(userProgress.skillProficiencies || {})
        .filter(([_, proficiency]) => proficiency < 50)
        .slice(0, 2);

      lowProficiencySkills.forEach(([skill, proficiency]) => {
        recommendations.push({
          id: `skill-${skill}`,
          type: 'skill',
          priority: 'medium',
          title: `Improve ${skill} Skills`,
          description: `Your ${skill} proficiency is at ${proficiency}%. Focus on this skill to unlock advanced opportunities.`,
          expectedImpact: {
            levelProgression: 0.2,
            skillImprovement: [skill]
          },
          actionItems: [
            `Find milestones focusing on ${skill}`,
            'Practice with real-world projects',
            'Complete skill-specific challenges'
          ],
          estimatedTimeCommitment: '2-3 weeks'
        });
      });

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze learning trends from activity data
   */
  private static analyzeTrends(activityData: any[]): ProgressInsights['trends'] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Generate mock trend data for the last 30 days
    const trends = {
      levelProgression: [] as { date: Date; level: number }[],
      streakPatterns: [] as { date: Date; streak: number }[],
      milestoneCompletion: [] as { date: Date; completed: number }[]
    };

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      
      trends.levelProgression.push({
        date,
        level: Math.floor(i / 10) + 1
      });
      
      trends.streakPatterns.push({
        date,
        streak: Math.max(0, Math.random() > 0.3 ? i % 7 + 1 : 0)
      });
      
      trends.milestoneCompletion.push({
        date,
        completed: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
      });
    }

    return trends;
  }

  /**
   * Analyze skill gaps and areas for improvement
   */
  private static analyzeSkillGaps(
    userProgress: UserProgress,
    milestones: Milestone[]
  ): ProgressInsights['skillGaps'] {
    const skillGaps: ProgressInsights['skillGaps'] = [];
    
    // Analyze skills from milestones
    const allSkills = new Set<string>();
    milestones.forEach(milestone => {
      milestone.skills?.forEach(skill => allSkills.add(skill));
    });

    allSkills.forEach(skill => {
      const currentLevel = userProgress.skillProficiencies[skill] || 0;
      const targetLevel = 80; // Target proficiency
      
      if (currentLevel < targetLevel) {
        skillGaps.push({
          skill,
          currentLevel,
          targetLevel,
          priority: currentLevel < 30 ? 'high' : currentLevel < 60 ? 'medium' : 'low',
          recommendedActions: [
            `Complete milestones focusing on ${skill}`,
            `Practice ${skill} through hands-on projects`,
            `Join study groups or courses for ${skill}`
          ]
        });
      }
    });

    return skillGaps.slice(0, 5); // Return top 5 skill gaps
  }

  /**
   * Generate personalized recommendations based on data analysis
   */
  private static async generateRecommendations(
    userProgress: UserProgress,
    milestones: Milestone[],
    trends: ProgressInsights['trends']
  ): Promise<Recommendation[]> {
    return this.getRecommendations(userProgress, milestones);
  }

  /**
   * Predict when user will reach next level
   */
  private static predictGoalCompletion(
    userProgress: UserProgress,
    trends: ProgressInsights['trends']
  ): ProgressInsights['goalPrediction'] {
    const recentMilestones = trends.milestoneCompletion.slice(-7); // Last 7 days
    const averageDailyMilestones = recentMilestones.reduce((sum, day) => sum + day.completed, 0) / recentMilestones.length;
    
    // Estimate days to next level based on milestone completion rate
    const milestonesNeededForNextLevel = 3; // Estimate milestones needed per level
    const daysToNextLevel = Math.ceil(milestonesNeededForNextLevel / Math.max(averageDailyMilestones, 0.1));
    const estimatedLevelUpDate = new Date(Date.now() + daysToNextLevel * 24 * 60 * 60 * 1000);
    
    // Confidence based on consistency
    const milestoneVariance = this.calculateVariance(recentMilestones.map(day => day.completed));
    const confidenceScore = Math.max(0.1, Math.min(0.9, 1 - (milestoneVariance / 4)));

    return {
      estimatedLevelUpDate,
      confidenceScore,
      daysToNextLevel,
      requiredDailyMilestones: Math.ceil(milestonesNeededForNextLevel / 7) // Target milestones for next week
    };
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(
    activityData: any[],
    userProgress: UserProgress
  ): ProgressInsights['performanceMetrics'] {
    const recentActivity = activityData.slice(-30); // Last 30 days
    
    const averageDailyMilestones = recentActivity.length > 0
      ? recentActivity.reduce((sum, day) => sum + (day.milestonesCompleted || 0), 0) / recentActivity.length
      : 0;

    const completionRate = userProgress.completedMilestones.length > 0
      ? (userProgress.completedMilestones.length / (userProgress.completedMilestones.length + 5)) * 100
      : 0;

    const streakConsistency = userProgress.streakDays / 30; // Consistency over 30 days

    const learningVelocity = averageDailyMilestones; // Milestone completion rate

    return {
      completionRate: Math.round(completionRate),
      streakConsistency: Math.round(streakConsistency * 100),
      learningVelocity: Math.round(learningVelocity * 10) / 10 // Rounded to 1 decimal
    };
  }

  /**
   * Identify learning patterns and habits
   */
  private static identifyLearningPatterns(
    activityData: any[],
    milestoneData: any[]
  ): ProgressInsights['patterns'] {
    // Mock pattern analysis
    return {
      mostProductiveDays: ['Tuesday', 'Wednesday', 'Thursday'],
      optimalLearningTime: 'Morning (9-11 AM)',
      strengths: ['Consistency', 'Technical Skills', 'Problem Solving'],
      improvementAreas: ['Time Management', 'Advanced Concepts', 'Practical Application']
    };
  }

  /**
   * Helper methods
   */
  private static loadMilestoneData(): any[] {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('analytics_milestones') || '[]');
    }
    return [];
  }

  private static loadActivityData(): any[] {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('analytics_activity') || '[]');
    }
    return [];
  }

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private static getDefaultInsights(): ProgressInsights {
    return {
      trends: {
        levelProgression: [],
        streakPatterns: [],
        milestoneCompletion: []
      },
      skillGaps: [],
      recommendations: [],
      goalPrediction: {
        estimatedLevelUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        confidenceScore: 0.5,
        daysToNextLevel: 7,
        requiredDailyMilestones: 1
      },
      performanceMetrics: {
        completionRate: 0,
        streakConsistency: 0,
        learningVelocity: 0
      },
      patterns: {
        mostProductiveDays: [],
        optimalLearningTime: 'Not enough data',
        strengths: [],
        improvementAreas: []
      }
    };
  }
}