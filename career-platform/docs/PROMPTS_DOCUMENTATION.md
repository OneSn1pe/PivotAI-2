# Crackd Platform - Complete Prompts Documentation

This document contains all AI prompts used throughout the Crackd platform, organized by functionality and API endpoint.

## Table of Contents

1. [Prompt Constants](#prompt-constants)
2. [Resume Analysis](#resume-analysis)
3. [Career Analysis](#career-analysis)
4. [Roadmap Generation](#roadmap-generation)
5. [Next Level Generation](#next-level-generation)
6. [Level Type Determination](#level-type-determination)
7. [Prompt Patterns](#prompt-patterns)

## Prompt Constants

**File:** `/src/constants/promptConstants.ts`

### System Messages
```typescript
RESUME_ANALYST: "You are an AI resume analyst. Extract structured information from resumes in JSON format."
CAREER_COACH: "You are an expert career coach specializing in personalized career development."
CAREER_ADVISOR: "You are an expert career advisor and job market analyst."
```

### Common Instructions
```typescript
JSON_FORMAT: "Return ONLY valid JSON with no additional text or formatting."
RESOURCE_QUALITY: "All resources must be real, verified URLs from reputable sources (Coursera, Udemy, official docs, etc.)."
FIELD_NAMES: "Use exact field names as specified in the JSON structure."
```

## Resume Analysis

**Endpoint:** `/api/analyze-resume`  
**Model:** `gpt-4o`  
**Purpose:** Extract structured information from uploaded resumes

### System Prompt
```
You are an AI resume analyst. Extract structured information from resumes in JSON format.
```

### User Prompt Template
```
Analyze the following resume and extract key information:

${resumeText}

Extract and return JSON with this structure:
{
  "skills": [technical and soft skills],
  "experience": [work experiences],
  "education": [educational qualifications],
  "strengths": [key strengths],
  "weaknesses": [areas for improvement],
  "recommendations": [recommended job roles]
}

Use exact field names as specified in the JSON structure. For missing fields, use empty arrays.
```

## Career Analysis

**Endpoint:** `/api/analyze-career`  
**Model:** `gpt-4o`  
**Purpose:** Analyze career paths and provide job recommendations

### System Prompt
```
You are an expert career advisor and job market analyst. Analyze the user's profile and provide detailed job recommendations in a structured JSON format.

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "title": "Job Title",
      "matchScore": 85,
      "description": "Brief role description",
      "requiredSkills": ["skill1", "skill2"],
      "matchingSkills": ["skill1", "skill2"],
      "gapSkills": ["skill3", "skill4"],
      "salaryRange": "$XX0k - $XX0k",
      "seniorityLevel": "Senior/Mid-level/Junior",
      "growthPotential": "High/Medium/Low"
    }
  ],
  "careerPath": {
    "current": "Current Role",
    "shortTerm": ["Role 1", "Role 2"],
    "longTerm": ["Role 3", "Role 4"]
  },
  "insights": {
    "strengths": ["strength 1", "strength 2"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "industryTrends": ["trend 1", "trend 2"]
  }
}
```

## Roadmap Generation

### Version 1 - Basic Roadmap

**Endpoint:** `/api/generate-roadmap`  
**Model:** `gpt-4o`  
**Purpose:** Generate Level 1 career roadmap without level types

#### System Prompt
```
You are an expert career coach specializing in personalized career development.
```

#### User Prompt Template
```
Create a Level 1 career roadmap for a candidate targeting: ${companies}

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
- 3 resources per milestone
- Include success criteria
- All resources must be real, verified URLs
- Return ONLY valid JSON
```

### Version 2 - Typed Roadmap

**Endpoint:** `/api/generate-roadmap/route-v2`  
**Model:** `gpt-4o`  
**Purpose:** Generate typed roadmap with level types (skill/project/position)

#### System Prompt
```
You are an expert career coach specializing in personalized career development.
```

#### User Prompt Template
```
Create a Level ${levelNumber} career roadmap with ${levelType.toUpperCase()} focus for a candidate targeting: ${companies}

THIS IS A ${levelType.toUpperCase()} LEVEL: ${LEVEL_TYPE_DESCRIPTIONS[levelType]}

${generateLevelTypePromptConstraints(levelType)}

Generate 3-5 ${levelType}-focused milestones with this JSON structure:
[JSON structure with level-type specific attributes]

Candidate profile:
[Resume analysis details]

CRITICAL Requirements for ${levelType.toUpperCase()} level:
- ALL milestones must be ${levelType}-focused (no mixing types)
- Level ${levelNumber} milestones only
- 3 resources per milestone
- Include success criteria specific to ${levelType} activities
- All resources must be real, verified URLs
- Return ONLY valid JSON

${getLevelTypeExamples(levelType)}
```

## Next Level Generation

### Version 1 - Basic Next Level

**Endpoint:** `/api/generate-next-level`  
**Model:** `gpt-4o`  
**Purpose:** Generate next level milestones without level types

#### System Prompt
```
You are an expert career counselor specializing in creating progressive, level-based career development roadmaps.
```

#### User Prompt Template
```
You are an expert career counselor creating Level ${nextLevel} milestones for a candidate's career roadmap.

CANDIDATE PROFILE:
${JSON.stringify(resumeAnalysis, null, 2)}

TARGET COMPANIES:
${JSON.stringify(targetCompanies, null, 2)}

PROFESSIONAL FIELD: ${professionalField}

PREVIOUS LEVELS COMPLETED:
${existingMilestones.filter((m: Milestone) => m.level < nextLevel).map((m: Milestone) => `Level ${m.level}: ${m.title}`).join('\n')}

Generate 3-5 milestones for Level ${nextLevel} that:
1. Build upon the skills from previous levels
2. Progressively move the candidate closer to their target roles
3. Include a mix of technical skills, career progression, and soft skills
4. Are appropriately challenging for this level

Return ONLY valid JSON in this format:
[JSON structure specification]
```

### Version 2 - Typed Next Level

**Endpoint:** `/api/generate-next-level/route-v2`  
**Model:** `gpt-4o`  
**Purpose:** Generate next level with specific level type

Uses the same `generateTypedRoadmapPrompt` function as Roadmap V2.

## Level Type Determination

### Determine Next Level Type

**Endpoint:** `/api/determine-level-type`  
**Model:** `gpt-4o`  
**Purpose:** Analyze progress and determine what type of level to generate next

#### System Prompt
```
You are an expert career coach who analyzes resumes to identify critical gaps preventing candidates from reaching their target roles. Focus on the MOST IMPORTANT blocker.
```

#### User Prompt Template
```
Analyze the user's resume and progress to determine the MOST CRITICAL level type they need next.

Resume Analysis:
- Skills: ${resumeAnalysis.skills?.join(', ') || 'None listed'}
- Experience: ${resumeAnalysis.experience?.join('; ') || 'No experience listed'}
- Strengths: ${resumeAnalysis.strengths?.join(', ') || 'None identified'}
- Weaknesses/Gaps: ${resumeAnalysis.weaknesses?.join(', ') || 'None identified'}
- Experience Years: ${experienceYears}
- Has Portfolio Projects: ${hasProjects ? 'Yes' : 'No'}

Current Status:
- Level: ${currentLevel}
- Target Companies: ${targetCompanies.map((c: any) => `${c.name} (${c.position})`).join(', ')}
- Professional Field: ${professionalField}

Recent Progress:
${recentCompletions}

Level Type Distribution: ${JSON.stringify(levelTypeCounts)}

CRITICAL DECISION FACTORS:
1. If user has NO EXPERIENCE and weak skills → "skill" (build foundation)
2. If user has skills but NO PORTFOLIO → "project" (need proof of ability)
3. If user approaching job search or career transition → "position" (interview prep)
4. If major skill gaps for target companies → "skill" (fill critical gaps)
5. If too many consecutive same type → switch type (avoid monotony)

Level Types:
- "skill": Learn new technical/soft skills (for knowledge gaps)
- "project": Build portfolio and apply skills (for proof of ability)
- "position": Career positioning and job prep (for role transitions)

Return JSON:
{
  "levelType": "skill" | "project" | "position",
  "reasoning": "Explain the critical gap this addresses",
  "focus": "Specific area to address the gap",
  "expectedOutcome": "How this moves them closer to target companies",
  "criticalGap": "The main blocker identified from resume"
}
```

### Analyze Initial Level Type

**Endpoint:** `/api/analyze-initial-level-type`  
**Model:** `gpt-4o`  
**Purpose:** Determine the best level type for a candidate's first level

#### System Prompt
```
You are an expert career coach who analyzes resumes to determine the most critical starting point for career development. Focus on identifying the BIGGEST blocker to employment.
```

#### User Prompt Template
```
Analyze this resume to determine what type of Level 1 the candidate needs MOST CRITICALLY to begin their journey.

Resume Profile:
- Skills (${skillCount} total): ${skills.slice(0, 10).join(', ') || 'None listed'}
- Work Experience (${experience.length} roles): ${experience.slice(0, 3).join('; ') || 'No experience'}
- Strengths: ${strengths.join(', ') || 'None identified'}
- Weaknesses/Gaps: ${weaknesses.join(', ') || 'None identified'}
- Has Portfolio/Projects: ${hasProjects ? 'Yes' : 'No'}
- Experience Level: ${hasWorkExperience ? `${experienceYears} roles` : 'Entry level'}

Target Companies: ${targetCompanies?.map((c: any) => `${c.name} (${c.position})`).join(', ') || 'Not specified'}

CRITICAL ANALYSIS for Level 1:
- If NO EXPERIENCE + FEW SKILLS → Start with "skill" (must build foundation first)
- If HAS SKILLS but NO PORTFOLIO → Start with "project" (need to prove abilities)
- If EXPERIENCED but CHANGING CAREERS → Start with "position" (leverage existing experience)
- If MANY WEAKNESSES identified → Start with "skill" (address fundamental gaps)

Level Types:
- "skill": Build foundational knowledge (for beginners or major gaps)
- "project": Create portfolio pieces (for those with skills but no proof)
- "position": Career positioning (for experienced professionals pivoting)

Return JSON:
{
  "levelType": "skill" | "project" | "position",
  "reasoning": "Why this is the most critical starting point",
  "focus": "Specific area to focus on in Level 1",
  "expectedOutcome": "What completing this level will achieve",
  "criticalGap": "The primary blocker identified",
  "resumeProfile": "beginner" | "intermediate" | "experienced" | "career-changer"
}
```

## Typed Level Generation

**Endpoint:** `/api/generate-typed-level`  
**Model:** `gpt-4o`  
**Purpose:** Generate specific typed level (skill/project/position)

### Skill Level Prompt
```
Generate Level ${level} skill-focused milestones.

Focus Area: ${focus}
Target Companies: ${targetCompanies.join(', ')}
Professional Field: ${professionalField}

Previous Completions:
${previousCompletions.join('\n')}

Create 3-5 milestones that:
- Focus on acquiring new technical or soft skills
- Include comprehensive learning resources
- Build foundational knowledge needed for ${targetCompanies.join(', ')}
- Progress logically from previous skills

[JSON structure with skill-specific attributes]
```

### Project Level Prompt
```
Generate Level ${level} project-focused milestones.

Focus Area: ${focus}
Target Companies: ${targetCompanies.join(', ')}
Professional Field: ${professionalField}

Previous Completions:
${previousCompletions.join('\n')}

Create 3-5 milestones that:
- Focus on building real projects for portfolio
- Include hands-on implementation work
- Demonstrate skills relevant to ${targetCompanies.join(', ')}
- Result in deployable/showable deliverables

[JSON structure with project-specific attributes]
```

### Position Level Prompt
```
Generate Level ${level} position-focused milestones.

Focus Area: ${focus}
Target Companies: ${targetCompanies.join(', ')}
Professional Field: ${professionalField}

Previous Completions:
${previousCompletions.join('\n')}

Create 3-5 milestones that:
- Focus on career advancement and job preparation
- Include networking and interview preparation
- Target specific roles at ${targetCompanies.join(', ')}
- Enhance professional presence and readiness

[JSON structure with position-specific attributes]
```

## Level Type Constraints

### Skill Level Constraints
```
CRITICAL CONSTRAINTS for SKILL level:
- ALL milestones must focus on LEARNING activities only
- Include: courses, tutorials, certifications, reading, studying
- EXCLUDE: building projects, creating portfolios, job applications
- Categories allowed: technical, fundamental, soft, niche
- Each milestone must have clear learning objectives
- Resources should be educational materials, not project templates
```

### Project Level Constraints
```
CRITICAL CONSTRAINTS for PROJECT level:
- ALL milestones must focus on BUILDING and CREATING
- Include: hands-on projects, portfolio pieces, open-source contributions
- EXCLUDE: pure learning activities, certifications without projects, job searching
- Categories allowed: technical, niche
- Each milestone must have concrete deliverables
- Resources should include project templates, deployment guides, not just tutorials
```

### Position Level Constraints
```
CRITICAL CONSTRAINTS for POSITION level:
- ALL milestones must focus on CAREER ADVANCEMENT
- Include: interview preparation, networking, job applications, personal branding
- EXCLUDE: learning new skills, building projects (unless for interviews)
- Categories allowed: career, soft
- Each milestone must contribute to job readiness
- Resources should include interview guides, job boards, networking strategies
```

## Prompt Patterns

### Common Patterns Across All Prompts

1. **Role Definition**: Every prompt starts with defining the AI's role as an expert
2. **JSON-Only Output**: All prompts explicitly require "Return ONLY valid JSON"
3. **Structured Output**: Detailed JSON schemas provided for consistent responses
4. **Context Inclusion**: Resume analysis and candidate profile always included
5. **Real Resources**: Emphasis on verified, real URLs from reputable sources
6. **Level Awareness**: Prompts maintain awareness of progression and previous completions
7. **Field-Specific**: Adaptation based on professional field (CS, Engineering, Medicine, etc.)
8. **Gap Analysis**: Focus on identifying and addressing critical career blockers

### Best Practices Implemented

1. **Clear Instructions**: Unambiguous requirements with examples
2. **Validation Rules**: Constraints to ensure appropriate content for each level type
3. **Progressive Difficulty**: Level-appropriate challenge scaling
4. **Personalization**: Heavy use of candidate data for tailored responses
5. **Quality Control**: Multiple validation points for resource quality and relevance

## Usage Notes

- All prompts use OpenAI's `gpt-4o` model
- Temperature settings typically at 0.7 for balanced creativity
- Maximum tokens vary by endpoint (typically 2000-4000)
- All API routes include retry logic with exponential backoff
- Timeouts configured based on operation complexity (60s-300s)

## Future Improvements

1. **Dynamic Prompt Templates**: Allow admin customization of prompt templates
2. **A/B Testing**: Test different prompt variations for effectiveness
3. **Feedback Loop**: Incorporate user feedback to refine prompts
4. **Multi-language Support**: Translate prompts for international users
5. **Industry-Specific Prompts**: More specialized prompts for niche fields