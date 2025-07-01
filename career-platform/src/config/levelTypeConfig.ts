import { LevelType } from '@/types/levelTypes';

// Feature flag to enable/disable level type enforcement
export const LEVEL_TYPE_FEATURES = {
  // Master switch for level type system
  enabled: process.env.NEXT_PUBLIC_LEVEL_TYPES_ENABLED === 'true' || false,
  
  // Enforce type validation on generation
  enforceValidation: process.env.NEXT_PUBLIC_ENFORCE_LEVEL_TYPE_VALIDATION === 'true' || false,
  
  // Show level type in UI
  showInUI: process.env.NEXT_PUBLIC_SHOW_LEVEL_TYPES === 'true' || false,
  
  // Use v2 endpoints
  useV2Endpoints: process.env.NEXT_PUBLIC_USE_V2_ENDPOINTS === 'true' || false
};

// Configuration for gradual rollout
export const LEVEL_TYPE_ROLLOUT = {
  // Percentage of new users to enable for (0-100)
  newUserPercentage: parseInt(process.env.NEXT_PUBLIC_LEVEL_TYPE_ROLLOUT_PERCENTAGE || '0'),
  
  // Specific user IDs to enable for testing
  testUserIds: process.env.NEXT_PUBLIC_LEVEL_TYPE_TEST_USERS?.split(',') || [],
  
  // Enable for all users after this date
  fullRolloutDate: process.env.NEXT_PUBLIC_LEVEL_TYPE_FULL_ROLLOUT_DATE 
    ? new Date(process.env.NEXT_PUBLIC_LEVEL_TYPE_FULL_ROLLOUT_DATE)
    : null
};

// Check if level types should be enabled for a user
export function shouldEnableLevelTypes(userId: string): boolean {
  // If feature is disabled globally, return false
  if (!LEVEL_TYPE_FEATURES.enabled) {
    return false;
  }
  
  // Check if user is in test group
  if (LEVEL_TYPE_ROLLOUT.testUserIds.includes(userId)) {
    return true;
  }
  
  // Check if full rollout date has passed
  if (LEVEL_TYPE_ROLLOUT.fullRolloutDate && new Date() >= LEVEL_TYPE_ROLLOUT.fullRolloutDate) {
    return true;
  }
  
  // Check percentage rollout (using simple hash of userId)
  const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const userPercentage = userHash % 100;
  
  return userPercentage < LEVEL_TYPE_ROLLOUT.newUserPercentage;
}

// Get the appropriate API endpoint based on feature flags
export function getApiEndpoint(baseEndpoint: string, userId?: string): string {
  if (LEVEL_TYPE_FEATURES.useV2Endpoints && userId && shouldEnableLevelTypes(userId)) {
    return `${baseEndpoint}/route-v2`;
  }
  return baseEndpoint;
}

// Default progression patterns for different user types
export const USER_TYPE_PATTERNS: Record<string, LevelType[]> = {
  beginner: [
    'skill', 'skill', 'project', 'skill', 'project', 'position'
  ],
  intermediate: [
    'skill', 'project', 'project', 'skill', 'position', 'project'
  ],
  advanced: [
    'project', 'skill', 'position', 'project', 'position', 'skill'
  ],
  career_changer: [
    'skill', 'skill', 'skill', 'project', 'project', 'position'
  ]
};

// Map categories to their primary level type
export const CATEGORY_TO_LEVEL_TYPE: Record<string, LevelType> = {
  'technical': 'skill',
  'fundamental': 'skill',
  'soft': 'skill',
  'niche': 'project',
  'career': 'position'
};

// Validation rules for milestone attributes by level type
export const LEVEL_TYPE_VALIDATION_RULES = {
  skill: {
    requiredAttributes: ['skillAttributes'],
    forbiddenAttributes: ['projectAttributes.deliverables', 'positionAttributes.targetRole'],
    requiredResourceTypes: ['course', 'tutorial', 'book', 'certification', 'documentation']
  },
  project: {
    requiredAttributes: ['projectAttributes', 'projectAttributes.deliverables'],
    forbiddenAttributes: ['skillAttributes.assessmentType:certification', 'positionAttributes.interviewComponents'],
    requiredResourceTypes: ['project', 'tutorial', 'documentation', 'tool']
  },
  position: {
    requiredAttributes: ['positionAttributes'],
    forbiddenAttributes: ['projectAttributes.deliverables', 'skillAttributes.learningObjectives'],
    requiredResourceTypes: ['article', 'course', 'workshop', 'webinar']
  }
};