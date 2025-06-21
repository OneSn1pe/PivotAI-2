import { Achievement, UserProgress, Milestone, MicroMilestone, AchievementCategory, ProfessionalField } from '@/types/user';

export interface AchievementTrigger {
  type: 'milestone_count' | 'streak_days' | 'level_reached' | 'category_completion' | 'skill_mastery' | 'time_based' | 'special_event';
  condition: {
    value?: number;
    category?: string;
    skill?: string;
    timeframe?: string;
    comparison?: 'gte' | 'lte' | 'eq';
  };
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  trigger: AchievementTrigger;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  hidden?: boolean; // Achievement not visible until unlocked
  prerequisites?: string[]; // Other achievement IDs required
  fieldSpecific?: ProfessionalField[]; // Only available for certain fields
}

export class AchievementEngine {
  private static readonly ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
    // Progress-based achievements
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first milestone',
      icon: '',
      category: 'progress',
      trigger: { type: 'milestone_count', condition: { value: 1, comparison: 'gte' } },
      rarity: 'common'
    },
    {
      id: 'milestone_master',
      title: 'Milestone Master',
      description: 'Complete 5 milestones',
      icon: '',
      category: 'progress',
      trigger: { type: 'milestone_count', condition: { value: 5, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'achievement_hunter',
      title: 'Achievement Hunter',
      description: 'Complete 10 milestones',
      icon: '',
      category: 'progress',
      trigger: { type: 'milestone_count', condition: { value: 10, comparison: 'gte' } },
      rarity: 'rare'
    },
    {
      id: 'dedication_champion',
      title: 'Dedication Champion',
      description: 'Complete 25 milestones',
      icon: '',
      category: 'progress',
      trigger: { type: 'milestone_count', condition: { value: 25, comparison: 'gte' } },
      rarity: 'epic'
    },

    // Level-based achievements
    {
      id: 'level_up',
      title: 'Level Up!',
      description: 'Reach level 5',
      icon: '',
      category: 'progress',
      trigger: { type: 'level_reached', condition: { value: 5, comparison: 'gte' } },
      rarity: 'common'
    },
    {
      id: 'expert_level',
      title: 'Expert Level',
      description: 'Reach level 10',
      icon: '',
      category: 'progress',
      trigger: { type: 'level_reached', condition: { value: 10, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'master_professional',
      title: 'Master Professional',
      description: 'Reach level 15',
      icon: '',
      category: 'progress',
      trigger: { type: 'level_reached', condition: { value: 15, comparison: 'gte' } },
      rarity: 'rare'
    },
    {
      id: 'legendary_expert',
      title: 'Legendary Expert',
      description: 'Reach level 20',
      icon: '',
      category: 'progress',
      trigger: { type: 'level_reached', condition: { value: 20, comparison: 'gte' } },
      rarity: 'legendary'
    },


    // Streak-based achievements
    {
      id: 'getting_started',
      title: 'Getting Started',
      description: 'Maintain a 3-day learning streak',
      icon: '',
      category: 'streak',
      trigger: { type: 'streak_days', condition: { value: 3, comparison: 'gte' } },
      rarity: 'common'
    },
    {
      id: 'week_warrior',
      title: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      icon: '',
      category: 'streak',
      trigger: { type: 'streak_days', condition: { value: 7, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'dedication_master',
      title: 'Dedication Master',
      description: 'Maintain a 30-day learning streak',
      icon: '',
      category: 'streak',
      trigger: { type: 'streak_days', condition: { value: 30, comparison: 'gte' } },
      rarity: 'rare'
    },
    {
      id: 'unstoppable_force',
      title: 'Unstoppable Force',
      description: 'Maintain a 100-day learning streak',
      icon: '',
      category: 'streak',
      trigger: { type: 'streak_days', condition: { value: 100, comparison: 'gte' } },
      rarity: 'legendary'
    },

    // Category-specific achievements
    {
      id: 'technical_specialist',
      title: 'Technical Specialist',
      description: 'Complete 5 technical milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'technical', value: 5, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'foundation_builder',
      title: 'Foundation Builder',
      description: 'Complete 5 fundamental milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'fundamental', value: 5, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'niche_expert',
      title: 'Niche Expert',
      description: 'Complete 3 niche milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'niche', value: 3, comparison: 'gte' } },
      rarity: 'rare'
    },
    {
      id: 'people_person',
      title: 'People Person',
      description: 'Complete 5 soft skill milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'soft', value: 5, comparison: 'gte' } },
      rarity: 'uncommon'
    },
    {
      id: 'career_climber',
      title: 'Career Climber',
      description: 'Complete 3 career milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'career', value: 3, comparison: 'gte' } },
      rarity: 'rare'
    },

    // Field-specific achievements
    {
      id: 'code_wizard',
      title: 'Code Wizard',
      description: 'Master programming fundamentals',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'technical', value: 10, comparison: 'gte' } },
      rarity: 'epic',
      fieldSpecific: ['computer-science']
    },
    {
      id: 'engineering_excellence',
      title: 'Engineering Excellence',
      description: 'Complete comprehensive engineering milestone set',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'technical', value: 8, comparison: 'gte' } },
      rarity: 'rare',
      fieldSpecific: ['engineering']
    },
    {
      id: 'medical_professional',
      title: 'Medical Professional',
      description: 'Complete clinical competency milestones',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'fundamental', value: 8, comparison: 'gte' } },
      rarity: 'epic',
      fieldSpecific: ['medicine']
    },
    {
      id: 'business_leader',
      title: 'Business Leader',
      description: 'Develop comprehensive business acumen',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'soft', value: 8, comparison: 'gte' } },
      rarity: 'rare',
      fieldSpecific: ['business']
    },
    {
      id: 'legal_expert',
      title: 'Legal Expert',
      description: 'Master legal research and analysis',
      icon: '',
      category: 'skill',
      trigger: { type: 'category_completion', condition: { category: 'fundamental', value: 10, comparison: 'gte' } },
      rarity: 'epic',
      fieldSpecific: ['law']
    },

    // Special achievements
    {
      id: 'early_adopter',
      title: 'Early Adopter',
      description: 'One of the first users to try the leveling system',
      icon: '',
      category: 'special',
      trigger: { type: 'special_event', condition: {} },
      rarity: 'uncommon',
      hidden: true
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Complete all tasks in 5 milestones',
      icon: '',
      category: 'special',
      trigger: { type: 'special_event', condition: {} },
      rarity: 'rare',
      hidden: true
    },
    {
      id: 'speed_runner',
      title: 'Speed Runner',
      description: 'Complete a milestone in record time',
      icon: '',
      category: 'special',
      trigger: { type: 'special_event', condition: {} },
      rarity: 'uncommon',
      hidden: true
    },
    {
      id: 'renaissance_learner',
      title: 'Renaissance Learner',
      description: 'Complete milestones across all categories',
      icon: '',
      category: 'special',
      trigger: { type: 'special_event', condition: {} },
      rarity: 'epic'
    }
  ];

  /**
   * Check for new achievements based on user progress
   */
  static async checkForNewAchievements(
    userId: string,
    progress: UserProgress,
    context: {
      milestonesCompleted?: Milestone[];
      microMilestonesCompleted?: MicroMilestone[];
      leveledUp?: boolean;
      professionalField?: ProfessionalField;
    } = {}
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    const existingAchievementIds = progress.achievements;

    // Get available achievements for the user's field
    const availableAchievements = this.getAvailableAchievements(
      context.professionalField || 'computer-science',
      existingAchievementIds
    );

    // Check each achievement definition
    for (const definition of availableAchievements) {
      if (this.shouldAwardAchievement(definition, progress, context)) {
        const achievement = await this.awardAchievement(userId, definition);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  /**
   * Get available achievements for a user
   */
  static getAvailableAchievements(
    professionalField: ProfessionalField,
    existingAchievementIds: string[]
  ): AchievementDefinition[] {
    return this.ACHIEVEMENT_DEFINITIONS.filter(def => {
      // Skip already earned achievements
      if (existingAchievementIds.includes(def.id)) return false;

      // Check field restrictions
      if (def.fieldSpecific && !def.fieldSpecific.includes(professionalField)) return false;

      // Check prerequisites
      if (def.prerequisites) {
        const hasAllPrerequisites = def.prerequisites.every(prereqId => 
          existingAchievementIds.includes(prereqId)
        );
        if (!hasAllPrerequisites) return false;
      }

      return true;
    });
  }

  /**
   * Check if an achievement should be awarded
   */
  static shouldAwardAchievement(
    definition: AchievementDefinition,
    progress: UserProgress,
    context: any
  ): boolean {
    const trigger = definition.trigger;

    switch (trigger.type) {
      case 'milestone_count':
        const milestoneCount = progress.completedMilestones.length;
        return this.compareValues(milestoneCount, trigger.condition.value!, trigger.condition.comparison || 'gte');


      case 'streak_days':
        return this.compareValues(progress.streakDays, trigger.condition.value!, trigger.condition.comparison || 'gte');

      case 'level_reached':
        return this.compareValues(progress.currentLevel, trigger.condition.value!, trigger.condition.comparison || 'gte');

      case 'category_completion':
        const categoryCount = this.getCategoryCompletionCount(
          progress,
          trigger.condition.category!,
          context.milestonesCompleted || []
        );
        return this.compareValues(categoryCount, trigger.condition.value!, trigger.condition.comparison || 'gte');

      case 'skill_mastery':
        const skillLevel = progress.skillProficiencies[trigger.condition.skill!] || 0;
        return this.compareValues(skillLevel, trigger.condition.value!, trigger.condition.comparison || 'gte');

      case 'special_event':
        // Special events are handled manually
        return false;

      default:
        return false;
    }
  }

  /**
   * Compare values based on comparison operator
   */
  static compareValues(actual: number, target: number, comparison: string): boolean {
    switch (comparison) {
      case 'gte': return actual >= target;
      case 'lte': return actual <= target;
      case 'eq': return actual === target;
      default: return false;
    }
  }

  /**
   * Get completion count for a specific category
   */
  static getCategoryCompletionCount(
    progress: UserProgress,
    category: string,
    allMilestones: Milestone[]
  ): number {
    // In a real implementation, this would query the actual milestone data
    // For now, estimate based on completed milestone count and category distribution
    const totalCompleted = progress.completedMilestones.length;
    
    // Rough estimate: technical and fundamental are 40% each, others 20% combined
    const categoryWeights: { [key: string]: number } = {
      'technical': 0.3,
      'fundamental': 0.3,
      'niche': 0.15,
      'soft': 0.15,
      'career': 0.1
    };

    const weight = categoryWeights[category] || 0.2;
    return Math.floor(totalCompleted * weight);
  }

  /**
   * Award an achievement to a user
   */
  static async awardAchievement(
    userId: string,
    definition: AchievementDefinition
  ): Promise<Achievement> {
    const achievement: Achievement = {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      unlockedAt: new Date(),
      category: definition.category
    };

    // In a real implementation, this would save to the database
    console.log(`Achievement awarded to ${userId}:`, achievement);

    return achievement;
  }

  /**
   * Trigger special achievements
   */
  static async triggerSpecialAchievement(
    userId: string,
    achievementId: string,
    progress: UserProgress
  ): Promise<Achievement | null> {
    const definition = this.ACHIEVEMENT_DEFINITIONS.find(def => def.id === achievementId);
    
    if (!definition || definition.trigger.type !== 'special_event') {
      return null;
    }

    // Check if user already has this achievement
    if (progress.achievements.includes(achievementId)) {
      return null;
    }

    return await this.awardAchievement(userId, definition);
  }

  /**
   * Get achievement progress for display
   */
  static getAchievementProgress(
    progress: UserProgress,
    professionalField: ProfessionalField,
    earnedAchievements: Achievement[] = []
  ): {
    earned: Achievement[];
    available: {
      definition: AchievementDefinition;
      progress: number;
      target: number;
      progressText: string;
    }[];
    hidden: number;
  } {
    const existingIds = progress.achievements;
    const availableDefinitions = this.getAvailableAchievements(professionalField, existingIds);
    
    const available = availableDefinitions
      .filter(def => !def.hidden)
      .map(def => {
        const progressInfo = this.getProgressForAchievement(def, progress);
        return {
          definition: def,
          progress: progressInfo.current,
          target: progressInfo.target,
          progressText: progressInfo.text
        };
      })
      .sort((a, b) => (b.progress / b.target) - (a.progress / a.target)); // Sort by completion percentage

    const hiddenCount = availableDefinitions.filter(def => def.hidden).length;

    return {
      earned: earnedAchievements,
      available,
      hidden: hiddenCount
    };
  }

  /**
   * Get progress information for a specific achievement
   */
  static getProgressForAchievement(
    definition: AchievementDefinition,
    progress: UserProgress
  ): { current: number; target: number; text: string } {
    const trigger = definition.trigger;

    switch (trigger.type) {
      case 'milestone_count':
        return {
          current: progress.completedMilestones.length,
          target: trigger.condition.value!,
          text: `${progress.completedMilestones.length}/${trigger.condition.value} milestones`
        };


      case 'streak_days':
        return {
          current: progress.streakDays,
          target: trigger.condition.value!,
          text: `${progress.streakDays}/${trigger.condition.value} days`
        };

      case 'level_reached':
        return {
          current: progress.currentLevel,
          target: trigger.condition.value!,
          text: `Level ${progress.currentLevel}/${trigger.condition.value}`
        };

      case 'category_completion':
        const categoryCount = this.getCategoryCompletionCount(progress, trigger.condition.category!, []);
        return {
          current: categoryCount,
          target: trigger.condition.value!,
          text: `${categoryCount}/${trigger.condition.value} ${trigger.condition.category} milestones`
        };

      default:
        return {
          current: 0,
          target: 1,
          text: 'Special achievement'
        };
    }
  }

  /**
   * Get achievement statistics
   */
  static getAchievementStats(achievements: Achievement[]): {
    totalEarned: number;
    totalAvailable: number;
    completionRate: number;
    rareAchievements: number;
    recentAchievements: Achievement[];
  } {
    const totalAvailable = this.ACHIEVEMENT_DEFINITIONS.length;
    const totalEarned = achievements.length;
    const completionRate = totalAvailable > 0 ? (totalEarned / totalAvailable) * 100 : 0;
    
    const rareAchievements = achievements.filter(achievement => {
      const definition = this.ACHIEVEMENT_DEFINITIONS.find(def => def.id === achievement.id);
      return definition && ['rare', 'epic', 'legendary'].includes(definition.rarity);
    }).length;

    const recentAchievements = achievements
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 5);

    return {
      totalEarned,
      totalAvailable,
      completionRate: Math.round(completionRate),
      rareAchievements,
      recentAchievements
    };
  }
}