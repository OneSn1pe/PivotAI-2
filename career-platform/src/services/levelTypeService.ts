import { Milestone, ProfessionalField } from '@/types/user';
import { LevelType, getNextLevelType } from '@/types/levelTypes';
import { validateMilestonesForLevelType } from '@/utils/levelValidation';
import { LEVEL_TYPE_FEATURES, shouldEnableLevelTypes, getApiEndpoint } from '@/config/levelTypeConfig';

export class LevelTypeService {
  private userId: string;
  private enabled: boolean;

  constructor(userId: string) {
    this.userId = userId;
    this.enabled = shouldEnableLevelTypes(userId);
  }

  /**
   * Generate a roadmap with level types
   */
  async generateRoadmap(
    resumeAnalysis: any,
    targetCompanies: any[],
    candidateId: string
  ): Promise<any> {
    const endpoint = '/api/generate-roadmap';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeAnalysis,
        targetCompanies,
        candidateId
      })
    });

    const data = await response.json();

    // Add type information to response
    if (data.milestones) {
      data.levelType = data.levelType || 'skill'; // Default to skill for level 1
      data._levelTypesEnabled = true;
    }

    return data;
  }

  /**
   * Generate next level with type enforcement
   */
  async generateNextLevel(
    roadmapId: string,
    candidateId: string,
    currentLevel: number
  ): Promise<any> {
    const endpoint = '/api/generate-next-level';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roadmapId,
        candidateId,
        currentLevel
      })
    });

    const data = await response.json();

    // Add level type information
    if (data.milestones) {
      const nextLevelType = getNextLevelType(currentLevel + 1);
      data.levelType = data.levelType || nextLevelType;
      data._levelTypesEnabled = true;
    }

    return data;
  }

  /**
   * Validate milestones for level type consistency
   */
  validateMilestones(milestones: Milestone[], levelType: LevelType): boolean {
    if (!this.enabled) {
      return true; // Always valid if feature is disabled
    }

    const validation = validateMilestonesForLevelType(milestones, levelType);
    
    if (!validation.isValid && LEVEL_TYPE_FEATURES.enforceValidation) {
      console.error('Level type validation failed:', validation.errors);
      return false;
    }

    if (validation.warnings.length > 0) {
      console.warn('Level type validation warnings:', validation.warnings);
    }

    return true;
  }

  /**
   * Get the display information for a level type
   */
  getLevelTypeDisplay(levelType: LevelType): { icon: string; label: string; description: string } | null {
    if (!this.enabled || !LEVEL_TYPE_FEATURES.showInUI) {
      return null;
    }

    const displays = {
      skill: {
        icon: '📚',
        label: 'Skill Level',
        description: 'Focus on learning and mastering new skills'
      },
      project: {
        icon: '🛠️',
        label: 'Project Level',
        description: 'Apply skills through hands-on projects'
      },
      position: {
        icon: '🎯',
        label: 'Position Level',
        description: 'Prepare for career advancement'
      }
    };

    return displays[levelType];
  }

  /**
   * Check if a milestone matches its level type
   */
  isMilestoneValidForLevelType(milestone: Milestone, levelType: LevelType): boolean {
    if (!this.enabled) {
      return true;
    }

    const validation = validateMilestonesForLevelType([milestone], levelType);
    return validation.isValid;
  }

  /**
   * Get suggested next level type based on user progress
   */
  suggestNextLevelType(currentLevel: number, completedMilestones: Milestone[]): LevelType {
    if (!this.enabled) {
      return 'skill'; // Default fallback
    }

    return getNextLevelType(currentLevel + 1);
  }

  /**
   * Check if level types are enabled for this user
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get feature flags for debugging
   */
  getFeatureFlags(): typeof LEVEL_TYPE_FEATURES {
    return LEVEL_TYPE_FEATURES;
  }
}

// Singleton instance management
let serviceInstances: Map<string, LevelTypeService> = new Map();

export function getLevelTypeService(userId: string): LevelTypeService {
  if (!serviceInstances.has(userId)) {
    serviceInstances.set(userId, new LevelTypeService(userId));
  }
  return serviceInstances.get(userId)!;
}

// Clear service cache (useful for testing)
export function clearLevelTypeServiceCache(): void {
  serviceInstances.clear();
}