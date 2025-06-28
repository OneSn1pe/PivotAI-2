import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import { Milestone } from '@/types/user';
import { PROMPT_CONSTANTS } from '@/constants/promptConstants';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:determine-level-type]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:determine-level-type:ERROR]', ...args);
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 1 minute timeout
  maxRetries: 2,
});

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const { roadmapId, candidateId, currentLevel } = await request.json();
    
    debug.log('Determining level type:', { roadmapId, candidateId, currentLevel });
    
    // Validate inputs
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
    
    // Get candidate profile for context
    const candidateDoc = await db.collection('users').doc(candidateId).get();
    const candidateData = candidateDoc.exists ? candidateDoc.data() : {};
    const resumeAnalysis = candidateData?.resumeAnalysis || {};
    
    // Get user progress
    const userProgressDoc = await db.collection('userProgress').doc(candidateId).get();
    const userProgress = userProgressDoc.exists ? userProgressDoc.data() : {};
    
    // Analyze completion patterns
    const completedMilestones = existingMilestones.filter((m: Milestone) => 
      userProgress.completedMilestones?.includes(m.id)
    );
    
    const recentCompletions = completedMilestones
      .filter((m: Milestone) => m.level >= currentLevel - 2)
      .map((m: Milestone) => ({
        title: m.title,
        category: m.category,
        levelType: m.levelType || 'skill'
      }));
    
    // Create prompt for level type determination
    const prompt = `Analyze the user's progress and determine what type of level they need next.

User Profile:
- Current Level: ${currentLevel}
- Target Companies: ${targetCompanies.map((c: any) => c.name).join(', ')}
- Professional Field: ${professionalField}
- Key Skills: ${resumeAnalysis.skills?.slice(0, 10).join(', ')}
- Experience Level: ${resumeAnalysis.experience?.length || 0} roles

Recent Completions:
${recentCompletions.map((m: any) => `- ${m.title} (${m.levelType || 'skill'} focus)`).join('\n')}

Level Types:
1. "skill" - Focus on learning new technical or soft skills
2. "project" - Apply skills through hands-on projects and portfolio building
3. "position" - Prepare for specific role transitions and career advancement

Based on their progress pattern and career goals, determine the most beneficial level type for Level ${nextLevel}.

Consider:
- Have they recently completed several skill-focused levels? (suggest project)
- Are they approaching a career transition point? (suggest position)
- Do they need to fill skill gaps? (suggest skill)
- What will best prepare them for their target companies?

Return JSON:
{
  "levelType": "skill" | "project" | "position",
  "reasoning": "Brief explanation of why this type was chosen",
  "focus": "Specific focus area for this level",
  "expectedOutcome": "What the user will achieve"
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach specializing in personalized learning paths. Analyze user progress patterns to recommend the most effective next steps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
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
    
    const totalDuration = performance.now() - requestStartTime;
    debug.log(`Level type determined successfully in ${Math.round(totalDuration)}ms`);
    
    return NextResponse.json({
      success: true,
      levelType: parsedResponse.levelType,
      reasoning: parsedResponse.reasoning,
      focus: parsedResponse.focus,
      expectedOutcome: parsedResponse.expectedOutcome,
      nextLevel,
      _debug: {
        processingTime: Math.round(totalDuration),
        openaiTime: Math.round(openaiDuration),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error determining level type after ${Math.round(totalDuration)}ms:`, error);
    
    return handleFirebaseError(error);
  }
}