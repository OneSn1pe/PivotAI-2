import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-next-level]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-next-level:ERROR]', ...args);
  }
};

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const { roadmapId, candidateId, currentLevel } = await request.json();
    
    debug.log('Processing next level generation:', { roadmapId, candidateId, currentLevel });
    
    // Validate inputs
    if (!roadmapId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Step 1: Determine level type
    debug.log('Step 1: Determining level type...');
    const levelTypeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/determine-level-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roadmapId,
        candidateId,
        currentLevel
      })
    });
    
    if (!levelTypeResponse.ok) {
      const error = await levelTypeResponse.json();
      debug.error('Failed to determine level type:', error);
      throw new Error(error.error || 'Failed to determine level type');
    }
    
    const levelTypeData = await levelTypeResponse.json();
    debug.log('Level type determined:', {
      levelType: levelTypeData.levelType,
      focus: levelTypeData.focus,
      reasoning: levelTypeData.reasoning
    });
    
    // Step 2: Generate typed level content
    debug.log('Step 2: Generating typed level content...');
    const typedLevelResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-typed-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roadmapId,
        candidateId,
        currentLevel,
        levelType: levelTypeData.levelType,
        focus: levelTypeData.focus,
        reasoning: levelTypeData.reasoning,
        expectedOutcome: levelTypeData.expectedOutcome
      })
    });
    
    if (!typedLevelResponse.ok) {
      const error = await typedLevelResponse.json();
      debug.error('Failed to generate typed level:', error);
      throw new Error(error.error || 'Failed to generate typed level');
    }
    
    const typedLevelData = await typedLevelResponse.json();
    
    const totalDuration = performance.now() - requestStartTime;
    debug.log(`Next level generated successfully in ${Math.round(totalDuration)}ms`);
    
    // Return combined result
    return NextResponse.json({
      success: true,
      level: typedLevelData.level,
      levelType: typedLevelData.levelType,
      focus: typedLevelData.focus,
      reasoning: typedLevelData.reasoning,
      expectedOutcome: typedLevelData.expectedOutcome,
      milestones: typedLevelData.milestones,
      _debug: {
        processingTime: Math.round(totalDuration),
        levelTypeTime: levelTypeData._debug?.processingTime,
        contentGenerationTime: typedLevelData._debug?.processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error in next level generation after ${Math.round(totalDuration)}ms:`, error);
    
    return handleFirebaseError(error);
  }
}