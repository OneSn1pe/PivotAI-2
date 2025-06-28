import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PROMPT_CONSTANTS } from '@/constants/promptConstants';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:analyze-initial-level-type]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:analyze-initial-level-type:ERROR]', ...args);
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
    const { resumeAnalysis, targetCompanies } = await request.json();
    
    debug.log('Analyzing initial level type from resume');
    
    // Validate inputs
    if (!resumeAnalysis) {
      return NextResponse.json(
        { error: 'Resume analysis is required' },
        { status: 400 }
      );
    }
    
    // Analyze resume characteristics
    const skills = resumeAnalysis.skills || [];
    const experience = resumeAnalysis.experience || [];
    const strengths = resumeAnalysis.strengths || [];
    const weaknesses = resumeAnalysis.weaknesses || [];
    
    // Calculate experience indicators
    const hasWorkExperience = experience.length > 0;
    const experienceYears = experience.length; // Rough estimate
    const hasProjects = experience.some((exp: string) => 
      exp.toLowerCase().includes('project') || 
      exp.toLowerCase().includes('built') ||
      exp.toLowerCase().includes('developed') ||
      exp.toLowerCase().includes('created')
    );
    
    // Skill analysis
    const skillCount = skills.length;
    const hasAdvancedSkills = skills.some((skill: string) => 
      skill.toLowerCase().includes('senior') ||
      skill.toLowerCase().includes('advanced') ||
      skill.toLowerCase().includes('expert') ||
      skill.toLowerCase().includes('lead')
    );
    
    // Gap analysis
    const hasSignificantGaps = weaknesses.length > 3;
    const needsFundamentals = skillCount < 5 && !hasWorkExperience;
    
    // Create prompt for initial level type determination
    const prompt = `Analyze this resume to determine what type of Level 1 the candidate needs MOST CRITICALLY to begin their journey.

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

Remember: This is their FIRST level. What is the MOST CRITICAL blocker preventing them from progressing toward their target companies?

Level Types:
- "skill": Build foundational knowledge (for beginners or major gaps)
- "project": Create portfolio pieces (for those with skills but no proof)
- "position": Career positioning (for experienced professionals pivoting)

Return JSON:
{
  "levelType": "skill" | "project" | "position",
  "reasoning": "Why this is the most critical starting point based on resume",
  "focus": "Specific area to focus on in Level 1",
  "expectedOutcome": "What completing this level will achieve",
  "criticalGap": "The primary blocker identified",
  "resumeProfile": "beginner" | "intermediate" | "experienced" | "career-changer"
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who analyzes resumes to determine the most critical starting point for career development. Focus on identifying the BIGGEST blocker to employment."
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
    debug.log(`Initial level type determined successfully in ${Math.round(totalDuration)}ms`);
    
    return NextResponse.json({
      success: true,
      levelType: parsedResponse.levelType,
      reasoning: parsedResponse.reasoning,
      focus: parsedResponse.focus,
      expectedOutcome: parsedResponse.expectedOutcome,
      criticalGap: parsedResponse.criticalGap,
      resumeProfile: parsedResponse.resumeProfile,
      _debug: {
        processingTime: Math.round(totalDuration),
        openaiTime: Math.round(openaiDuration),
        timestamp: new Date().toISOString(),
        resumeMetrics: {
          skillCount,
          hasWorkExperience,
          hasProjects,
          hasAdvancedSkills,
          hasSignificantGaps,
          needsFundamentals
        }
      }
    });
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error analyzing initial level type after ${Math.round(totalDuration)}ms:`, error);
    
    // Return a sensible default
    let defaultType = 'skill';
    
    // Try to parse request body if available to make a better default decision
    try {
      const body = await request.json();
      const hasExperience = body?.resumeAnalysis?.experience?.length > 0;
      const hasSkills = body?.resumeAnalysis?.skills?.length > 5;
      
      if (hasSkills && !hasExperience) {
        defaultType = 'project';
      } else if (hasExperience && hasSkills) {
        defaultType = 'position';
      }
    } catch {
      // If we can't parse the body, just use skill as default
      defaultType = 'skill';
    }
    
    return NextResponse.json({
      success: false,
      levelType: defaultType,
      reasoning: 'Failed to analyze resume, using default based on experience/skills',
      focus: 'General career development',
      expectedOutcome: 'Build foundation for career growth',
      criticalGap: 'Unable to determine',
      resumeProfile: 'unknown',
      _error: error.message || String(error)
    });
  }
}