import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import { Milestone, TargetCompany } from '@/types/user';
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
      userProgress?.completedMilestones?.includes(m.id)
    );
    
    const recentCompletions = completedMilestones
      .filter((m: Milestone) => m.level >= currentLevel - 2)
      .map((m: Milestone) => ({
        title: m.title,
        category: m.category,
        levelType: m.levelType || 'skill'
      }));
    
    // Count level types in recent completions
    const levelTypeCounts = recentCompletions.reduce((acc: any, m: any) => {
      acc[m.levelType] = (acc[m.levelType] || 0) + 1;
      return acc;
    }, {});
    
    // Analyze experience level from resume
    const experienceYears = resumeAnalysis.experience?.length || 0;
    const hasProjects = resumeAnalysis.experience?.some((exp: string) => 
      exp.toLowerCase().includes('project') || 
      exp.toLowerCase().includes('built') ||
      exp.toLowerCase().includes('developed')
    );
    
    // Check for critical gaps
    const hasSkillGaps = resumeAnalysis.weaknesses?.length > 0;
    const needsPortfolio = !hasProjects && currentLevel < 3;
    const readyForCareerMove = currentLevel >= 5 || experienceYears >= 2;
    
    // Create enhanced prompt for level type determination
    const prompt = `Analyze the user's resume and progress to determine the MOST CRITICAL level type they need next.

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
${recentCompletions.length > 0 ? recentCompletions.map((m: any) => `- ${m.title} (${m.levelType} focus)`).join('\n') : '- No recent completions (new user)'}

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

Analyze the resume deeply. What is the SINGLE MOST CRITICAL thing blocking this user from their target companies?

Return JSON:
{
  "levelType": "skill" | "project" | "position",
  "reasoning": "Explain the critical gap this addresses based on resume analysis",
  "focus": "Specific area to address the gap",
  "expectedOutcome": "How this moves them closer to target companies",
  "criticalGap": "The main blocker identified from resume"
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who analyzes resumes to identify critical gaps preventing candidates from reaching their target roles. Focus on the MOST IMPORTANT blocker."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 500
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
    
    // Log level type determination
    console.log('[Crackd Analytics] Level type determined via AI:', {
      method: 'openai-determination',
      nextLevel,
      determinedType: parsedResponse.levelType,
      reasoning: parsedResponse.reasoning,
      criticalGap: parsedResponse.criticalGap,
      targetCompanies: targetCompanies.map((tc: TargetCompany) => tc.name),
      previousLevels: levelTypeCounts,
      duration: Math.round(totalDuration),
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      levelType: parsedResponse.levelType,
      reasoning: parsedResponse.reasoning,
      focus: parsedResponse.focus,
      expectedOutcome: parsedResponse.expectedOutcome,
      criticalGap: parsedResponse.criticalGap,
      nextLevel,
      _debug: {
        processingTime: Math.round(totalDuration),
        openaiTime: Math.round(openaiDuration),
        timestamp: new Date().toISOString(),
        resumeFactors: {
          hasSkillGaps,
          needsPortfolio,
          readyForCareerMove,
          experienceYears,
          hasProjects
        }
      }
    });
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error determining level type after ${Math.round(totalDuration)}ms:`, error);
    
    return handleFirebaseError(error);
  }
}