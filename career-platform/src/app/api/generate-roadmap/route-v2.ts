import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
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
  const hasProjects = resumeAnalysis.experience?.some(exp => 
    exp.toLowerCase().includes('project') || 
    exp.toLowerCase().includes('built') ||
    exp.toLowerCase().includes('developed')
  );
  
  // Beginners start with skills
  if (experienceYears < 2 || !hasProjects) {
    return 'skill';
  }
  
  // Mid-level might benefit from projects
  if (experienceYears < 5) {
    return 'project';
  }
  
  // Senior level might focus on position advancement
  return 'position';
}

// Helper to store level structure in new format
async function storeLevelStructure(
  candidateId: string,
  levelNumber: number,
  levelType: LevelType,
  milestoneIds: string[]
): Promise<void> {
  const levelStructureRef = doc(db as Firestore, 'levelStructures', candidateId);
  
  const levelData: { [key: string]: LevelStructure } = {
    [levelNumber.toString()]: {
      levelNumber,
      levelType,
      milestones: milestoneIds,
      generatedAt: new Date()
    }
  };
  
  const existingDoc = await getDoc(levelStructureRef);
  
  if (existingDoc.exists()) {
    await updateDoc(levelStructureRef, {
      [`levels.${levelNumber}`]: levelData[levelNumber.toString()],
      updatedAt: new Date()
    });
  } else {
    await setDoc(levelStructureRef, {
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
  
  try {
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
      const userDoc = await getDoc(doc(db as Firestore, 'users', candidateId));
      if (userDoc.exists()) {
        companiesForRoadmap = userDoc.data().targetCompanies || [];
      }
      if (companiesForRoadmap.length === 0) {
        companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
      }
    }

    // Call OpenAI with typed roadmap prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.2,
      max_tokens: 3000,
    });

    // Parse milestones
    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content in OpenAI response');
    
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
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    if (!roadmapSnapshot.empty) {
      const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
        deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
      );
      await Promise.all(deletePromises);
    }

    // Reset user progress
    const userProgressRef = doc(db as Firestore, 'userProgress', candidateId);
    await setDoc(userProgressRef, {
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
    await storeLevelStructure(candidateId, 1, levelType, milestoneIds);

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
    const docRef = await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);
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