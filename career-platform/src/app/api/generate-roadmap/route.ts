import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import type { Firestore } from 'firebase-admin/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone, ProfessionalField } from '@/types/user';
import { PROMPT_CONSTANTS } from '@/constants/promptConstants';
import { generateTypedRoadmapPrompt } from '@/prompts/typedRoadmapPrompt';
import { LevelType, RoadmapWithLevels, LevelStructure, getNextLevelType } from '@/types/levelTypes';
import { validateMilestonesForLevelType, ensureLevelTypeConsistency } from '@/utils/levelValidation';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-roadmap-v2]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-roadmap-v2:ERROR]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[API:generate-roadmap-v2:WARN]', ...args);
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 300000,
  maxRetries: 3,
});

// Helper function to determine initial level type
async function determineInitialLevelType(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[]
): Promise<LevelType> {
  // Simple heuristic for initial level type
  const experienceYears = resumeAnalysis.experience?.length || 0;
  const hasProjects = resumeAnalysis.experience?.some(exp => {
    // Ensure exp is a string before calling toLowerCase
    if (typeof exp !== 'string') {
      console.warn('Non-string experience entry found:', exp);
      return false;
    }
    const expLower = exp.toLowerCase();
    return expLower.includes('project') || 
           expLower.includes('built') ||
           expLower.includes('developed');
  });
  
  let levelType: LevelType;
  
  // Beginners start with skills
  if (experienceYears < 2 || !hasProjects) {
    levelType = 'skill';
  }
  // Mid-level might benefit from projects
  else if (experienceYears < 5) {
    levelType = 'project';
  }
  // Senior level might focus on position advancement
  else {
    levelType = 'position';
  }
  
  // Log level type determination
  console.log('[Crackd Analytics] Initial level type determined (v2 fallback):', {
    method: 'heuristic',
    experienceYears,
    hasProjects,
    determinedType: levelType,
    targetCompanies: targetCompanies.map(tc => tc.name),
    timestamp: new Date().toISOString()
  });
  
  return levelType;
}

// Helper to store level structure in new format
async function storeLevelStructure(
  db: Firestore,
  candidateId: string,
  levelNumber: number,
  levelType: LevelType,
  milestoneIds: string[]
): Promise<void> {
  const levelStructureRef = db.collection('levelStructures').doc(candidateId);
  
  const levelData: { [key: string]: LevelStructure } = {
    [levelNumber.toString()]: {
      levelNumber,
      levelType,
      milestones: milestoneIds,
      generatedAt: new Date()
    }
  };
  
  const existingDoc = await levelStructureRef.get();
  
  if (existingDoc.exists) {
    await levelStructureRef.update({
      [`levels.${levelNumber}`]: levelData[levelNumber.toString()],
      updatedAt: new Date()
    });
  } else {
    await levelStructureRef.set({
      candidateId,
      levels: levelData,
      currentLevel: 1,
      totalLevels: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  debug.log('POST request received');
  
  let db: Firestore;
  
  try {
    // Initialize Admin Firestore
    try {
      db = getAdminFirestore();
    } catch (error) {
      debug.error('Failed to initialize Firebase Admin:', error);
      return handleFirebaseError(error);
    }
    
    const { resumeAnalysis, targetCompanies, candidateId } = await request.json();

    if (!candidateId) {
      throw new Error('candidateId is required to generate a roadmap');
    }

    debug.log(`Processing roadmap generation for candidate: ${candidateId}`);

    // Determine professional field
    let professionalField: ProfessionalField = 'computer-science';
    if (resumeAnalysis?.professionalField) {
      professionalField = resumeAnalysis.professionalField;
    }

    // Determine initial level type
    const levelType = await determineInitialLevelType(resumeAnalysis, targetCompanies || []);
    debug.log(`Determined initial level type: ${levelType}`);

    // Get target companies
    let companiesForRoadmap = targetCompanies;
    if (!companiesForRoadmap || companiesForRoadmap.length === 0) {
      const userDoc = await db.collection('users').doc(candidateId).get();
      if (userDoc.exists) {
        companiesForRoadmap = userDoc.data()?.targetCompanies || [];
      }
      if (companiesForRoadmap.length === 0) {
        companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
      }
    }

    // Call OpenAI with typed roadmap prompt
    debug.log('Calling OpenAI with model gpt-5');
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: PROMPT_CONSTANTS.SYSTEM_MESSAGES.CAREER_COACH
        },
        {
          role: "user",
          content: generateTypedRoadmapPrompt(
            companiesForRoadmap.map((c: TargetCompany) => `${c.name} (${c.position})`).join(', '),
            resumeAnalysis,
            professionalField,
            levelType,
            1 // Level 1
          )
        }
      ],
      max_completion_tokens: 8000,  // Increased to allow for reasoning + output
    });

    debug.log('OpenAI response received:', {
      choices: completion.choices?.length,
      usage: completion.usage,
      model: completion.model
    });

    // Parse milestones
    const content = completion.choices[0]?.message?.content;
    
    // Check if response was truncated
    if (completion.choices[0]?.finish_reason === 'length') {
      debug.warn('Response was truncated due to token limit. Attempting to parse partial response.');
    }
    
    if (!content || content.trim() === '') {
      debug.error('No content in OpenAI response:', {
        response: completion,
        messageContent: content,
        finishReason: completion.choices[0]?.finish_reason
      });
      throw new Error(`No content in OpenAI response. Finish reason: ${completion.choices[0]?.finish_reason}`);
    }
    
    const jsonMatch = content.match(/({[\s\S]*})/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Process milestones
    let milestones = parsedResponse.milestones.map((milestone: any) => ({
      ...milestone,
      id: milestone.id || uuidv4(),
      completed: false,
      professionalField,
      level: 1,
      levelType: levelType
    }));

    // Validate milestones match level type
    const validation = validateMilestonesForLevelType(milestones, levelType);
    if (!validation.isValid) {
      debug.warn('Milestone validation failed:', validation.errors);
      // Ensure consistency
      milestones = ensureLevelTypeConsistency(milestones, levelType);
    }

    // Delete existing roadmaps
    const roadmapSnapshot = await db.collection('roadmaps')
      .where('candidateId', '==', candidateId)
      .get();
    
    if (!roadmapSnapshot.empty) {
      const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
        roadmapDoc.ref.delete()
      );
      await Promise.all(deletePromises);
    }

    // Reset user progress
    const userProgressRef = db.collection('userProgress').doc(candidateId);
    await userProgressRef.set({
      userId: candidateId,
      levelsUnlocked: 1,
      completedMilestones: [],
      completedMicroMilestones: [],
      achievements: [],
      streakDays: 0,
      lastActiveDate: new Date(),
      skillProficiencies: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Store level structure
    const milestoneIds = milestones.map((m: Milestone) => m.id);
    await storeLevelStructure(db, candidateId, 1, levelType, milestoneIds);

    // Create roadmap
    const roadmap: CareerRoadmap & { levelType?: LevelType } = {
      id: uuidv4(),
      candidateId: candidateId.toString(),
      professionalField,
      milestones,
      createdAt: new Date(),
      updatedAt: new Date(),
      levelType // Include level type in response
    };
    
    // Store in Firestore
    const docRef = await db.collection('roadmaps').add(roadmap);
    roadmap.id = docRef.id;
    
    debug.log('Created new typed roadmap for candidateId:', candidateId);
    
    return NextResponse.json({
      ...roadmap,
      _debug: {
        levelType,
        validationWarnings: validation.warnings
      }
    });
    
  } catch (error) {
    debug.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}