import { Milestone, MilestoneCategory } from '@/types/user';
import { LevelType, LEVEL_TYPE_CATEGORY_MAP } from '@/types/levelTypes';

export class LevelValidationError extends Error {
  constructor(
    public levelType: LevelType,
    public invalidMilestones: Array<{ milestone: Milestone; reason: string }>
  ) {
    super(`Level validation failed for ${levelType} level`);
    this.name = 'LevelValidationError';
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    milestoneId: string;
    milestoneTitle: string;
    reason: string;
  }>;
  warnings: Array<{
    milestoneId: string;
    milestoneTitle: string;
    reason: string;
  }>;
}

export function validateMilestonesForLevelType(
  milestones: Milestone[],
  levelType: LevelType
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const allowedCategories = LEVEL_TYPE_CATEGORY_MAP[levelType];

  milestones.forEach(milestone => {
    // Check if milestone category matches level type
    if (!allowedCategories.includes(milestone.category)) {
      result.isValid = false;
      result.errors.push({
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        reason: `Category "${milestone.category}" is not allowed for ${levelType} level. Allowed categories: ${allowedCategories.join(', ')}`
      });
    }

    // Validate skill-specific requirements
    if (levelType === 'skill') {
      if (milestone.projectAttributes && milestone.projectAttributes.deliverables.length > 0) {
        result.isValid = false;
        result.errors.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Skill levels should not contain project deliverables'
        });
      }
      if (milestone.positionAttributes) {
        result.isValid = false;
        result.errors.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Skill levels should not contain position-related activities'
        });
      }
    }

    // Validate project-specific requirements
    if (levelType === 'project') {
      if (!milestone.projectAttributes || milestone.projectAttributes.deliverables.length === 0) {
        result.warnings.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Project levels should include specific deliverables'
        });
      }
      if (milestone.skillAttributes && milestone.skillAttributes.assessmentType === 'certification') {
        result.isValid = false;
        result.errors.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Project levels should not include certification-only milestones'
        });
      }
    }

    // Validate position-specific requirements
    if (levelType === 'position') {
      if (milestone.projectAttributes && milestone.projectAttributes.deliverables.length > 0) {
        result.warnings.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Position levels typically focus on career activities rather than project deliverables'
        });
      }
      if (!milestone.positionAttributes && milestone.category === 'career') {
        result.warnings.push({
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          reason: 'Career milestones in position levels should include position attributes'
        });
      }
    }
  });

  return result;
}

export function ensureLevelTypeConsistency(
  milestones: Milestone[],
  levelType: LevelType
): Milestone[] {
  const allowedCategories = LEVEL_TYPE_CATEGORY_MAP[levelType];
  
  return milestones.map(milestone => {
    // If category doesn't match, update it to the first allowed category
    if (!allowedCategories.includes(milestone.category)) {
      return {
        ...milestone,
        category: allowedCategories[0] as MilestoneCategory,
        levelType: levelType
      };
    }
    
    // Ensure levelType is set
    return {
      ...milestone,
      levelType: levelType
    };
  });
}

export function generateLevelTypePromptConstraints(levelType: LevelType): string {
  switch (levelType) {
    case 'skill':
      return `
CRITICAL CONSTRAINTS for SKILL level:
- ALL milestones must focus on LEARNING activities only
- Include: courses, tutorials, certifications, reading, studying
- EXCLUDE: building projects, creating portfolios, job applications
- Categories allowed: technical, fundamental, soft, niche
- Each milestone must have clear learning objectives
- Resources should be educational materials, not project templates
`;

    case 'project':
      return `
CRITICAL CONSTRAINTS for PROJECT level:
- ALL milestones must focus on BUILDING and CREATING
- Include: hands-on projects, portfolio pieces, open-source contributions
- EXCLUDE: pure learning activities, certifications without projects, job searching
- Categories allowed: technical, niche
- Each milestone must have concrete deliverables
- Resources should include project templates, deployment guides, not just tutorials
`;

    case 'position':
      return `
CRITICAL CONSTRAINTS for POSITION level:
- ALL milestones must focus on CAREER ADVANCEMENT
- Include: interview preparation, networking, job applications, personal branding
- EXCLUDE: learning new skills, building projects (unless for interviews)
- Categories allowed: career, soft
- Each milestone must contribute to job readiness
- Resources should include interview guides, job boards, networking strategies
`;
  }
}

export function getMilestoneTypeIndicators(milestone: Milestone): {
  isSkillMilestone: boolean;
  isProjectMilestone: boolean;
  isPositionMilestone: boolean;
} {
  const title = milestone.title.toLowerCase();
  const description = milestone.description.toLowerCase();
  
  const skillIndicators = [
    'learn', 'study', 'course', 'tutorial', 'certification', 'understand',
    'master', 'foundation', 'fundamental', 'theory', 'concept'
  ];
  
  const projectIndicators = [
    'build', 'create', 'develop', 'implement', 'deploy', 'portfolio',
    'application', 'website', 'tool', 'api', 'contribute', 'open-source'
  ];
  
  const positionIndicators = [
    'interview', 'job', 'position', 'role', 'career', 'network',
    'resume', 'linkedin', 'application', 'salary', 'negotiation'
  ];
  
  const content = `${title} ${description}`;
  
  return {
    isSkillMilestone: skillIndicators.some(indicator => content.includes(indicator)),
    isProjectMilestone: projectIndicators.some(indicator => content.includes(indicator)),
    isPositionMilestone: positionIndicators.some(indicator => content.includes(indicator))
  };
}