import { PROMPT_CONSTANTS } from '@/constants/promptConstants';
import { LevelType, LEVEL_TYPE_DESCRIPTIONS } from '@/types/levelTypes';
import { generateLevelTypePromptConstraints } from '@/utils/levelValidation';

export const generateTypedRoadmapPrompt = (
  companies: string,
  resumeAnalysis: any,
  professionalField: string,
  levelType: LevelType,
  levelNumber: number = 1
) => `Create a Level ${levelNumber} career roadmap with ${levelType.toUpperCase()} focus for a candidate targeting: ${companies}

THIS IS A ${levelType.toUpperCase()} LEVEL: ${LEVEL_TYPE_DESCRIPTIONS[levelType]}

${generateLevelTypePromptConstraints(levelType)}

Generate 3-5 ${levelType}-focused milestones with this JSON structure:
{
  "milestones": [{
    "id": "unique-id",
    "title": "Milestone name",
    "description": "Actionable description",
    "category": "${levelType === 'skill' ? 'technical|fundamental|soft|niche' : levelType === 'project' ? 'technical|niche' : 'career|soft'}",
    "skills": ["skill1", "skill2"],
    "timeframe": "1-3 months",
    "completed": false,
    "difficulty": 1-5,
    "priority": "low|medium|high|critical",
    "estimatedHours": 20-100,
    "level": ${levelNumber},
    "levelType": "${levelType}",
    "successCriteria": ["criterion1", "criterion2"],
    ${getLevelTypeSpecificAttributes(levelType)},
    "resources": [{
      "title": "Resource name",
      "url": "https://actual-url.com",
      "type": "${getLevelTypeResourceTypes(levelType)}",
      "estimatedTime": "2 weeks",
      "cost": "free|paid"
    }]
  }],
  "candidateGapAnalysis": {
    "currentStrengths": ["strength1"],
    "criticalGaps": ["gap1"]
  }
}

Candidate profile:
Skills: ${JSON.stringify(resumeAnalysis.skills)}
Experience: ${JSON.stringify(resumeAnalysis.experience)}
Strengths: ${JSON.stringify(resumeAnalysis.strengths)}
Weaknesses: ${JSON.stringify(resumeAnalysis.weaknesses)}

CRITICAL Requirements for ${levelType.toUpperCase()} level:
- ALL milestones must be ${levelType}-focused (no mixing types)
- Level ${levelNumber} milestones only
- ${PROMPT_CONSTANTS.MILESTONE_REQUIREMENTS.RESOURCES_PER_MILESTONE} resources per milestone
- Include success criteria specific to ${levelType} activities
- ${PROMPT_CONSTANTS.RESOURCE_QUALITY}
- ${PROMPT_CONSTANTS.JSON_FORMAT}

${getLevelTypeExamples(levelType)}`;

function getLevelTypeSpecificAttributes(levelType: LevelType): string {
  switch (levelType) {
    case 'skill':
      return `"skillAttributes": {
      "learningObjectives": ["objective1", "objective2"],
      "theoreticalDepth": "beginner|intermediate|advanced",
      "practiceType": "guided|self-directed|mentored",
      "assessmentType": "quiz|exercise|certification",
      "outputSkills": ["skill1", "skill2"]
    }`;
    
    case 'project':
      return `"projectAttributes": {
      "projectScope": "personal|team|open-source",
      "deliverables": [{
        "type": "application|library|api",
        "description": "What will be built",
        "technologies": ["tech1", "tech2"],
        "demonstratesSkills": ["skill1"]
      }],
      "complexity": "simple|moderate|complex",
      "portfolioValue": "high|medium|low",
      "deployment": true
    }`;
    
    case 'position':
      return `"positionAttributes": {
      "targetRole": "Specific role title",
      "seniorityLevel": "entry|junior|mid|senior",
      "preparationAreas": {
        "technical": ["area1"],
        "behavioral": ["area1"]
      },
      "interviewComponents": ["coding", "system-design"],
      "networkingGoals": ["goal1"],
      "targetCompanies": ["company1"]
    }`;
  }
}

function getLevelTypeResourceTypes(levelType: LevelType): string {
  switch (levelType) {
    case 'skill':
      return 'course|tutorial|book|certification|documentation';
    case 'project':
      return 'project|tutorial|documentation|tool|template';
    case 'position':
      return 'article|course|workshop|webinar|tool';
  }
}

function getLevelTypeExamples(levelType: LevelType): string {
  switch (levelType) {
    case 'skill':
      return `Example SKILL milestones:
- "Master React Advanced Patterns" (learning React concepts)
- "Complete AWS Solutions Architect Certification" (certification prep)
- "Deep Dive into System Design Principles" (theoretical learning)`;
    
    case 'project':
      return `Example PROJECT milestones:
- "Build Full-Stack E-commerce Platform" (complete application)
- "Contribute to Open Source React Library" (community contribution)
- "Create Portfolio Website with CMS" (personal branding project)`;
    
    case 'position':
      return `Example POSITION milestones:
- "Prepare for Senior Engineer Interviews" (interview readiness)
- "Build Professional Network in Target Industry" (networking)
- "Optimize LinkedIn and Resume for ATS" (job search optimization)`;
  }
}