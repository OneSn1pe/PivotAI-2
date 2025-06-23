import { PROMPT_CONSTANTS } from '@/constants/promptConstants';

export const generateRoadmapPrompt = (
  companies: string,
  resumeAnalysis: any,
  professionalField: string
) => `Create a Level 1 career roadmap for a candidate targeting: ${companies}

Generate 3-5 foundational milestones with this JSON structure:
{
  "milestones": [{
    "id": "unique-id",
    "title": "Milestone name",
    "description": "Actionable description",
    "category": "technical|fundamental|niche|soft|career",
    "skills": ["skill1", "skill2"],
    "timeframe": "1-3 months",
    "completed": false,
    "difficulty": 1-5,
    "priority": "low|medium|high|critical",
    "estimatedHours": 20-100,
    "level": 1,
    "successCriteria": ["criterion1", "criterion2"],
    "attributes": {
      "career": {
        "targetRole": "Role title",
        "experienceRequired": "X years",
        "keyResponsibilities": ["resp1", "resp2"],
        "skillRequirements": {
          "technical": ["skill1"],
          "soft": ["skill1"]
        },
        "careerImpact": "stepping-stone|destination",
        "marketDemand": "high|medium|low"
      }
    },
    "resources": [{
      "title": "Resource name",
      "url": "https://actual-url.com",
      "type": "course|book|documentation",
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

Requirements:
- Level 1 milestones only (foundational skills)
- ${PROMPT_CONSTANTS.MILESTONE_REQUIREMENTS.RESOURCES_PER_MILESTONE} resources per milestone
- Include success criteria
- ${PROMPT_CONSTANTS.RESOURCE_QUALITY}
- ${PROMPT_CONSTANTS.JSON_FORMAT}

${PROMPT_CONSTANTS.RESOURCE_EXAMPLES}`;