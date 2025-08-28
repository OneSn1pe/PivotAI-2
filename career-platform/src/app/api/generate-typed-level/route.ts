import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import { Milestone, ProfessionalField } from '@/types/user';
import { PROMPT_CONSTANTS } from '@/constants/promptConstants';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-typed-level]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-typed-level:ERROR]', ...args);
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minute timeout
  maxRetries: 2,
});

// Level type specific prompts
const generateSkillLevelPrompt = (
  level: number,
  focus: string,
  targetCompanies: string[],
  previousCompletions: string[],
  professionalField: string
) => `Generate Level ${level} skill-focused milestones.

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

JSON Structure:
{
  "milestones": [{
    "id": "unique-id",
    "title": "Skill-focused title",
    "description": "Learning-oriented description",
    "category": "technical|fundamental|soft|niche",
    "levelType": "skill",
    "skills": ["skill1", "skill2"],
    "timeframe": "2-3 months",
    "difficulty": ${Math.min(level, 5)},
    "priority": "medium|high",
    "estimatedHours": ${40 + (level * 10)},
    "level": ${level},
    "successCriteria": ["Can explain X", "Understands Y", "Demonstrates Z"],
    "skillAttributes": {
      "learningObjectives": ["Master concept X", "Apply technique Y"],
      "theoreticalDepth": "intermediate",
      "practiceType": "guided",
      "assessmentType": "exercise",
      "prerequisiteKnowledge": ["Basic programming"],
      "outputSkills": ["Advanced React", "State management"],
      "knowledgeType": "practical",
      "retentionActivities": ["Daily practice", "Code reviews"]
    },
    "resources": [
      {
        "title": "Resource name",
        "url": "https://actual-url.com",
        "type": "course|book|documentation",
        "estimatedTime": "2 weeks",
        "cost": "free|paid"
      }
    ]
  }]
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

const generateProjectLevelPrompt = (
  level: number,
  focus: string,
  targetCompanies: string[],
  previousCompletions: string[],
  professionalField: string
) => `Generate Level ${level} project-focused milestones.

Focus Area: ${focus}
Target Companies: ${targetCompanies.join(', ')}
Professional Field: ${professionalField}

Previous Completions:
${previousCompletions.join('\n')}

Create 3-5 milestones that:
- Apply previously learned skills through hands-on projects
- Build portfolio pieces relevant to ${targetCompanies.join(', ')}
- Include real-world scenarios and challenges
- Demonstrate practical competency

JSON Structure:
{
  "milestones": [{
    "id": "unique-id",
    "title": "Project-focused title",
    "description": "Project description with deliverables",
    "category": "technical|career",
    "levelType": "project",
    "skills": ["applied-skill1", "applied-skill2"],
    "timeframe": "1-2 months",
    "difficulty": ${Math.min(level, 5)},
    "priority": "high|critical",
    "estimatedHours": ${60 + (level * 15)},
    "level": ${level},
    "successCriteria": ["Deployed working application", "Documented architecture", "Passed tests"],
    "projectAttributes": {
      "projectScope": "personal",
      "deliverables": [{
        "type": "application",
        "description": "Full-stack web app with authentication",
        "technologies": ["React", "Node.js", "PostgreSQL"],
        "demonstratesSkills": ["Frontend", "Backend", "Database design"]
      }],
      "complexity": "moderate",
      "realWorldApplication": "E-commerce platform for small businesses",
      "portfolioValue": "high",
      "collaborationType": "solo",
      "deployment": true,
      "userTesting": true,
      "documentationRequired": true
    },
    "resources": [
      {
        "title": "Project guide or reference",
        "url": "https://actual-url.com",
        "type": "project|tutorial|documentation",
        "estimatedTime": "1 week",
        "cost": "free"
      }
    ]
  }]
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

const generatePositionLevelPrompt = (
  level: number,
  focus: string,
  targetCompanies: string[],
  previousCompletions: string[],
  professionalField: string
) => `Generate Level ${level} position-focused milestones.

Focus Area: ${focus}
Target Companies: ${targetCompanies.join(', ')}
Professional Field: ${professionalField}

Previous Completions:
${previousCompletions.join('\n')}

Create 3-5 milestones that:
- Prepare for specific role transitions
- Develop leadership and strategic thinking
- Build industry connections and visibility
- Practice interview and job search skills

JSON Structure:
{
  "milestones": [{
    "id": "unique-id",
    "title": "Position-focused title",
    "description": "Career advancement description",
    "category": "career|soft",
    "levelType": "position",
    "skills": ["leadership", "strategy", "communication"],
    "timeframe": "2-4 months",
    "difficulty": ${Math.min(level, 5)},
    "priority": "critical",
    "estimatedHours": ${80 + (level * 20)},
    "level": ${level},
    "successCriteria": ["Completed mock interviews", "Updated portfolio", "Expanded network"],
    "positionAttributes": {
      "targetRole": "Senior Software Engineer",
      "seniorityLevel": "senior",
      "preparationAreas": {
        "technical": ["System design", "Architecture patterns"],
        "behavioral": ["Leadership examples", "Conflict resolution"],
        "leadership": ["Team management", "Mentoring"],
        "domain": ["Industry knowledge", "Business acumen"]
      },
      "interviewComponents": ["coding", "system-design", "behavioral"],
      "networkingGoals": ["Connect with 10 professionals", "Attend 2 industry events"],
      "personalBranding": {
        "linkedinOptimization": true,
        "portfolioUpdate": true,
        "resumeTailoring": true,
        "coverLetterTemplates": true
      },
      "negotiationPrep": ["Research salary ranges", "Practice negotiation tactics"],
      "targetCompanies": ${JSON.stringify(targetCompanies.map((c: any) => c.name))},
      "expectedSalaryRange": "$120k-$180k"
    },
    "resources": [
      {
        "title": "Career resource",
        "url": "https://actual-url.com",
        "type": "workshop|webinar|certification",
        "estimatedTime": "3 weeks",
        "cost": "paid"
      }
    ]
  }]
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const { 
      roadmapId, 
      candidateId, 
      currentLevel,
      levelType,
      focus,
      reasoning,
      expectedOutcome 
    } = await request.json();
    
    debug.log('Generating typed level:', { 
      roadmapId, 
      candidateId, 
      currentLevel, 
      levelType,
      focus 
    });
    
    // Validate inputs
    if (!roadmapId || !candidateId || !levelType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get Firebase Admin Firestore instance
    let db;
    try {
      db = getAdminFirestore();
    } catch (error) {
      return handleFirebaseError(error);
    }
    
    // Get existing roadmap
    const roadmapDoc = await db.collection('roadmaps').doc(roadmapId).get();
    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data() || {};
    const existingMilestones = roadmapData.milestones || [];
    const targetCompanies = roadmapData.targetCompanies || [];
    const professionalField = roadmapData.professionalField || 'computer-science';
    const nextLevel = currentLevel + 1;
    
    // Get previous completions for context
    const previousCompletions = existingMilestones
      .filter((m: Milestone) => m.level < nextLevel)
      .map((m: Milestone) => `- ${m.title}`)
      .slice(-10); // Last 10 completions for context
    
    // Select appropriate prompt based on level type
    let prompt;
    switch (levelType) {
      case 'skill':
        prompt = generateSkillLevelPrompt(
          nextLevel,
          focus,
          targetCompanies.map((c: any) => c.name),
          previousCompletions,
          professionalField
        );
        break;
      case 'project':
        prompt = generateProjectLevelPrompt(
          nextLevel,
          focus,
          targetCompanies.map((c: any) => c.name),
          previousCompletions,
          professionalField
        );
        break;
      case 'position':
        prompt = generatePositionLevelPrompt(
          nextLevel,
          focus,
          targetCompanies.map((c: any) => c.name),
          previousCompletions,
          professionalField
        );
        break;
      default:
        throw new Error(`Invalid level type: ${levelType}`);
    }
    
    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: PROMPT_CONSTANTS.SYSTEM_MESSAGES.CAREER_COACH
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 6000  // Increased for GPT-5 reasoning
    });

    const openaiDuration = performance.now() - openaiStartTime;
    debug.log(`OpenAI call completed in ${Math.round(openaiDuration)}ms`);

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse response
    let parsedResponse;
    try {
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      debug.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from AI');
    }
    
    // Process milestones and ensure unique IDs
    const idSet = new Set<string>(existingMilestones.map((m: any) => m.id));
    const newMilestones = parsedResponse.milestones.map((milestone: any) => {
      let milestoneId = milestone.id;
      if (!milestoneId || idSet.has(milestoneId)) {
        milestoneId = uuidv4();
        debug.log(`Generated new ID for milestone: ${milestone.title}`);
      }
      idSet.add(milestoneId);
      
      return {
        ...milestone,
        id: milestoneId,
        level: nextLevel,
        levelType,
        createdAt: new Date(),
        professionalField: professionalField as ProfessionalField
      };
    });
    
    // Update roadmap with new milestones
    await db.collection('roadmaps').doc(roadmapId).update({
      milestones: [...existingMilestones, ...newMilestones],
      lastUpdated: new Date(),
      maxLevel: nextLevel
    });
    
    const totalDuration = performance.now() - requestStartTime;
    debug.log(`Typed level generated successfully in ${Math.round(totalDuration)}ms`);
    
    return NextResponse.json({
      success: true,
      level: nextLevel,
      levelType,
      focus,
      reasoning,
      expectedOutcome,
      milestones: newMilestones,
      _debug: {
        processingTime: Math.round(totalDuration),
        openaiTime: Math.round(openaiDuration),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error generating typed level after ${Math.round(totalDuration)}ms:`, error);
    
    return handleFirebaseError(error);
  }
}