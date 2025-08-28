export type LevelType = 'skill' | 'project' | 'position';

export interface LevelStructure {
  levelNumber: number;
  levelType: LevelType;
  milestones: string[]; // milestone IDs
  generatedAt: Date;
  completedAt?: Date;
}

export interface RoadmapWithLevels {
  id: string;
  candidateId: string;
  levels: {
    [levelNumber: string]: LevelStructure;
  };
  currentLevel: number;
  totalLevels: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_LEVEL_PROGRESSION_PATTERN: LevelType[] = [
  'skill',    // Level 1: Foundation skills
  'skill',    // Level 2: Advanced skills
  'project',  // Level 3: Apply skills in projects
  'skill',    // Level 4: New skill area
  'project',  // Level 5: Complex project
  'position', // Level 6: Career advancement
  'skill',    // Level 7: Specialized skills
  'project',  // Level 8: Portfolio project
  'project',  // Level 9: Advanced project
  'position', // Level 10: Senior position prep
];

export function getNextLevelType(currentLevel: number, customPattern?: LevelType[]): LevelType {
  const pattern = customPattern || DEFAULT_LEVEL_PROGRESSION_PATTERN;
  const index = (currentLevel - 1) % pattern.length;
  return pattern[index];
}

export const LEVEL_TYPE_CATEGORY_MAP: Record<LevelType, string[]> = {
  skill: ['technical', 'fundamental', 'soft', 'niche'],
  project: ['technical', 'niche'],
  position: ['career', 'soft']
};

export const LEVEL_TYPE_DESCRIPTIONS: Record<LevelType, string> = {
  skill: 'Focus on learning and mastering new skills through courses, certifications, and theoretical study',
  project: 'Apply your skills by building real-world projects and creating portfolio pieces',
  position: 'Prepare for career advancement through interview prep, networking, and job applications'
};

export const LEVEL_TYPE_ICONS: Record<LevelType, string> = {
  skill: '',
  project: '',
  position: ''
};

export function validateMilestoneForLevelType(
  milestoneCategory: string,
  levelType: LevelType
): boolean {
  const allowedCategories = LEVEL_TYPE_CATEGORY_MAP[levelType];
  return allowedCategories.includes(milestoneCategory);
}

export interface LevelTypeDistribution {
  skill: number;
  project: number;
  position: number;
}

export function calculateLevelTypeDistribution(
  levels: { [key: string]: LevelStructure }
): LevelTypeDistribution {
  const distribution: LevelTypeDistribution = {
    skill: 0,
    project: 0,
    position: 0
  };

  Object.values(levels).forEach(level => {
    distribution[level.levelType]++;
  });

  return distribution;
}

export function suggestNextLevelType(
  distribution: LevelTypeDistribution,
  currentLevel: number,
  userExperience: 'beginner' | 'intermediate' | 'advanced'
): LevelType {
  const total = distribution.skill + distribution.project + distribution.position;
  
  if (total === 0) {
    return 'skill'; // Start with skill for new users
  }

  const ratios = {
    skill: distribution.skill / total,
    project: distribution.project / total,
    position: distribution.position / total
  };

  // Suggested ratios based on experience
  const targetRatios = {
    beginner: { skill: 0.5, project: 0.35, position: 0.15 },
    intermediate: { skill: 0.35, project: 0.45, position: 0.2 },
    advanced: { skill: 0.25, project: 0.45, position: 0.3 }
  }[userExperience];

  // Find which type is most underrepresented
  let maxDiff = -1;
  let suggestedType: LevelType = 'skill';

  (Object.keys(targetRatios) as LevelType[]).forEach(type => {
    const diff = targetRatios[type] - ratios[type];
    if (diff > maxDiff) {
      maxDiff = diff;
      suggestedType = type;
    }
  });

  return suggestedType;
}