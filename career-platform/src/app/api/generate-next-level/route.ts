import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import { Milestone, ProfessionalField } from '@/types/user';
import { LevelType, getNextLevelType, LevelStructure } from '@/types/levelTypes';
import { generateTypedRoadmapPrompt } from '@/prompts/typedRoadmapPrompt';
import { validateMilestonesForLevelType, ensureLevelTypeConsistency } from '@/utils/levelValidation';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-next-level-v2]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-next-level-v2:ERROR]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[API:generate-next-level-v2:WARN]', ...args);
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000,
  maxRetries: 2,
});

async function getLevelStructure(db: any, candidateId: string): Promise<{ [key: string]: LevelStructure }> {
  const levelDoc = await db.collection('levelStructures').doc(candidateId).get();
  if (levelDoc.exists) {
    return levelDoc.data()?.levels || {};
  }
  return {};
}

async function updateLevelStructure(
  db: any,
  candidateId: string,
  levelNumber: number,
  levelType: LevelType,
  milestoneIds: string[]
): Promise<void> {
  const levelStructureRef = db.collection('levelStructures').doc(candidateId);
  
  const levelData: LevelStructure = {
    levelNumber,
    levelType,
    milestones: milestoneIds,
    generatedAt: new Date()
  };
  
  const existingDoc = await levelStructureRef.get();
  
  if (existingDoc.exists) {
    await levelStructureRef.update({
      [`levels.${levelNumber}`]: levelData,
      currentLevel: levelNumber,
      totalLevels: levelNumber,
      updatedAt: new Date()
    });
  } else {
    await levelStructureRef.set({
      candidateId,
      levels: {
        [levelNumber.toString()]: levelData
      },
      currentLevel: levelNumber,
      totalLevels: levelNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const { roadmapId, candidateId, currentLevel } = await request.json();
    
    debug.log('Generating next typed level:', { roadmapId, candidateId, currentLevel });
    
    if (!roadmapId || !candidateId) {
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
    const nextLevel = (currentLevel || existingMilestones.length) + 1;
    
    // Get level structure to determine pattern
    const levelStructures = await getLevelStructure(db, candidateId);
    
    // Determine next level type based on pattern
    const nextLevelType = getNextLevelType(nextLevel);
    debug.log(`Next level ${nextLevel} will be type: ${nextLevelType}`);
    
    // Get candidate profile
    const candidateDoc = await db.collection('users').doc(candidateId).get();
    const candidateData = candidateDoc.exists ? candidateDoc.data() : {};
    const resumeAnalysis = candidateData?.resumeAnalysis || {};
    
    // Call OpenAI with typed prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach creating level-based career roadmaps. Each level has a specific type (skill, project, or position) and all milestones must match that type."
        },
        {
          role: "user",
          content: generateTypedRoadmapPrompt(
            targetCompanies.map((c: any) => `${c.name} (${c.position})`).join(', '),
            resumeAnalysis,
            professionalField,
            nextLevelType,
            nextLevel
          )
        }
      ],
      max_completion_tokens: 15000  // Significantly increased for GPT-5 reasoning
    });
    
    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    
    const parsedResponse = JSON.parse(response);
    
    // Process milestones
    let newMilestones = parsedResponse.milestones.map((milestone: any) => ({
      ...milestone,
      id: milestone.id || uuidv4(),
      level: nextLevel,
      levelType: nextLevelType,
      completed: false,
      professionalField,
      createdAt: new Date()
    }));
    
    // Validate milestones
    const validation = validateMilestonesForLevelType(newMilestones, nextLevelType);
    if (!validation.isValid) {
      debug.warn('Milestone validation failed:', validation.errors);
      // Ensure consistency
      newMilestones = ensureLevelTypeConsistency(newMilestones, nextLevelType);
    }
    
    // Update roadmap with new milestones
    const updatedMilestones = [...existingMilestones, ...newMilestones];
    
    await db.collection('roadmaps').doc(roadmapId).update({
      milestones: updatedMilestones,
      updatedAt: new Date()
    });
    
    // Update level structure
    const milestoneIds = newMilestones.map((m: Milestone) => m.id);
    await updateLevelStructure(db, candidateId, nextLevel, nextLevelType, milestoneIds);
    
    // Update user progress
    await db.collection('userProgress').doc(candidateId).update({
      levelsUnlocked: nextLevel,
      updatedAt: new Date()
    });
    
    const totalDuration = performance.now() - requestStartTime;
    debug.log(`Generated ${newMilestones.length} milestones for level ${nextLevel} (${nextLevelType}) in ${Math.round(totalDuration)}ms`);
    
    return NextResponse.json({
      success: true,
      milestones: newMilestones,
      level: nextLevel,
      levelType: nextLevelType,
      _debug: {
        processingTime: Math.round(totalDuration),
        validationWarnings: validation.warnings
      }
    });
    
  } catch (error) {
    debug.error('Error generating next level:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate next level', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}