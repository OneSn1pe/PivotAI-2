import { Milestone, LegacyMilestone, MilestoneCategory, categorizeMilestone, migrateLegacyMilestone } from '@/types/user';

/**
 * Check if a milestone object has the new categorization format
 */
export const hasNewFormat = (milestone: any): milestone is Milestone => {
  return milestone && typeof milestone.category === 'string' && milestone.attributes !== undefined;
};

/**
 * Check if a milestone object has the legacy format
 */
export const hasLegacyFormat = (milestone: any): milestone is LegacyMilestone => {
  return milestone && typeof milestone.skillType === 'string' && milestone.attributes === undefined;
};

/**
 * Migrate a roadmap's milestones from legacy format to new categorized format
 */
export const migrateRoadmapMilestones = (milestones: any[]): Milestone[] => {
  return milestones.map((milestone, index) => {
    try {
      // If already in new format, ensure all required fields are present
      if (hasNewFormat(milestone)) {
        return {
          ...milestone,
          // Ensure required fields have defaults
          difficulty: milestone.difficulty || 3,
          priority: milestone.priority || 'medium',
          attributes: milestone.attributes || {},
          successCriteria: milestone.successCriteria || ['Complete all learning resources'],
          tasks: milestone.tasks || [],
        } as Milestone;
      }

      // If in legacy format, migrate
      if (hasLegacyFormat(milestone)) {
        return migrateLegacyMilestone(milestone);
      }

      // If unknown format, try to create a basic milestone
      const basicMilestone: LegacyMilestone = {
        id: milestone.id || `milestone-${index}`,
        title: milestone.title || 'Untitled Milestone',
        description: milestone.description || 'No description provided',
        skills: Array.isArray(milestone.skills) ? milestone.skills : [],
        timeframe: milestone.timeframe || 'No timeframe specified',
        completed: !!milestone.completed,
        skillType: milestone.skillType || 'technical',
        resources: Array.isArray(milestone.resources) ? milestone.resources : [],
        createdAt: milestone.createdAt || new Date(),
      };

      return migrateLegacyMilestone(basicMilestone);
    } catch (error) {
      console.error(`Error migrating milestone ${index}:`, error);
      
      // Return a fallback milestone
      return {
        id: `fallback-${index}`,
        title: 'Milestone (Error)',
        description: 'This milestone could not be processed properly',
        category: 'fundamental' as MilestoneCategory,
        skills: [],
        timeframe: 'Unknown',
        completed: false,
        difficulty: 1,
        priority: 'low',
        attributes: {},
        resources: [],
        successCriteria: ['Contact support for assistance'],
      } as Milestone;
    }
  });
};

/**
 * Get milestone statistics by category
 */
export const getMilestoneStats = (milestones: Milestone[]) => {
  const stats = {
    technical: { total: 0, completed: 0 },
    fundamental: { total: 0, completed: 0 },
    niche: { total: 0, completed: 0 },
    soft: { total: 0, completed: 0 },
  };

  milestones.forEach(milestone => {
    const category = milestone.category || categorizeMilestone(milestone);
    stats[category].total++;
    if (milestone.completed) {
      stats[category].completed++;
    }
  });

  return stats;
};

/**
 * Filter milestones by category
 */
export const filterMilestonesByCategory = (
  milestones: Milestone[], 
  category: MilestoneCategory | 'all'
): Milestone[] => {
  if (category === 'all') {
    return milestones;
  }
  
  return milestones.filter(milestone => {
    const milestoneCategory = milestone.category || categorizeMilestone(milestone);
    return milestoneCategory === category;
  });
};

/**
 * Sort milestones by priority and difficulty
 */
export const sortMilestonesByImportance = (milestones: Milestone[]): Milestone[] => {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  
  return [...milestones].sort((a, b) => {
    // First sort by priority
    const aPriorityValue = priorityOrder[a.priority || 'medium'];
    const bPriorityValue = priorityOrder[b.priority || 'medium'];
    
    if (aPriorityValue !== bPriorityValue) {
      return bPriorityValue - aPriorityValue; // Higher priority first
    }
    
    // Then by difficulty (harder tasks first within same priority)
    const aDifficulty = a.difficulty || 3;
    const bDifficulty = b.difficulty || 3;
    
    return bDifficulty - aDifficulty;
  });
};

/**
 * Calculate total estimated hours for milestones
 */
export const calculateTotalHours = (milestones: Milestone[]): number => {
  return milestones.reduce((total, milestone) => {
    return total + (milestone.estimatedHours || 0);
  }, 0);
};

/**
 * Get milestones that are prerequisites for a given milestone
 */
export const getPrerequisites = (
  milestones: Milestone[], 
  milestoneId: string
): Milestone[] => {
  const milestone = milestones.find(m => m.id === milestoneId);
  if (!milestone?.prerequisites) {
    return [];
  }
  
  return milestones.filter(m => milestone.prerequisites!.includes(m.id));
};

/**
 * Get milestones that depend on a given milestone
 */
export const getDependentMilestones = (
  milestones: Milestone[], 
  milestoneId: string
): Milestone[] => {
  return milestones.filter(milestone => 
    milestone.prerequisites?.includes(milestoneId)
  );
};

/**
 * Validate milestone data structure
 */
export const validateMilestone = (milestone: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!milestone.id) errors.push('Missing required field: id');
  if (!milestone.title) errors.push('Missing required field: title');
  if (!milestone.description) errors.push('Missing required field: description');
  if (!milestone.category) errors.push('Missing required field: category');
  if (!Array.isArray(milestone.skills)) errors.push('Skills must be an array');
  if (!milestone.timeframe) errors.push('Missing required field: timeframe');
  if (typeof milestone.completed !== 'boolean') errors.push('Completed must be a boolean');
  if (!Array.isArray(milestone.resources)) errors.push('Resources must be an array');
  if (!Array.isArray(milestone.successCriteria)) errors.push('Success criteria must be an array');
  
  // Validate difficulty is between 1-5
  if (milestone.difficulty && (milestone.difficulty < 1 || milestone.difficulty > 5)) {
    errors.push('Difficulty must be between 1 and 5');
  }
  
  // Validate priority is valid
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (milestone.priority && !validPriorities.includes(milestone.priority)) {
    errors.push('Priority must be one of: low, medium, high, critical');
  }
  
  // Validate category is valid
  const validCategories = ['technical', 'fundamental', 'niche', 'soft'];
  if (milestone.category && !validCategories.includes(milestone.category)) {
    errors.push('Category must be one of: technical, fundamental, niche, soft');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a default milestone template
 */
export const createDefaultMilestone = (category: MilestoneCategory): Partial<Milestone> => {
  const baseTemplate = {
    title: '',
    description: '',
    category,
    skills: [],
    timeframe: '1-2 months',
    completed: false,
    difficulty: 3 as const,
    priority: 'medium' as const,
    estimatedHours: 40,
    attributes: {},
    resources: [],
    tasks: [],
    successCriteria: [],
  };

  // Category-specific defaults
  switch (category) {
    case 'technical':
      return {
        ...baseTemplate,
        attributes: {
          technical: {
            technologies: [],
            projectType: 'frontend',
            complexityLevel: 'intermediate',
            deliverables: [],
            learningPath: 'self-directed',
          }
        }
      };
    
    case 'fundamental':
      return {
        ...baseTemplate,
        attributes: {
          fundamental: {
            competencyArea: 'problem-solving',
            industryScope: 'tech-specific',
            careerStage: 'mid-level',
            conceptualAreas: [],
            theoreticalDepth: 'intermediate',
            applicationAreas: [],
            buildsUpon: [],
            enablesAdvancement: [],
            knowledgeType: 'conceptual',
          }
        }
      };
    
    case 'niche':
      return {
        ...baseTemplate,
        difficulty: 4,
        priority: 'medium',
        estimatedHours: 80,
        attributes: {
          niche: {
            specializationDomain: '',
            marketDemand: 'growing',
            expertiseLevel: 'working-knowledge',
            industryAdoption: 'early-adopter',
            competitorLandscape: 'moderate-competition',
            careerImpact: 'differentiator',
            learningCurve: 'steep',
            resourceAvailability: 'moderate',
            communitySize: 'medium',
            trendDirection: 'rising',
            longevityEstimate: '3-5 years',
          }
        }
      };
    
    case 'soft':
      return {
        ...baseTemplate,
        difficulty: 2,
        estimatedHours: 30,
        attributes: {
          soft: {
            skillCategory: 'communication',
            developmentMethod: 'practice-based',
            applicationScenarios: [],
            roleRelevance: 'all-roles',
            assessmentDifficulty: 'somewhat-subjective',
            measurementMethods: ['self-assessment'],
            behavioralMarkers: [],
            developmentTimeframe: 'months',
            improvementPattern: 'continuous',
          }
        }
      };
    
    default:
      return baseTemplate;
  }
}; 