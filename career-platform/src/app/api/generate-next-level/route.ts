import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Milestone, ProfessionalField } from '@/types/user';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-next-level]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-next-level:ERROR]', ...args);
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minute timeout
  maxRetries: 2,
});

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const { roadmapId, candidateId, currentLevel } = await request.json();
    
    debug.log('Generating next level:', { roadmapId, candidateId, currentLevel });
    
    // Validate inputs
    if (!roadmapId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get existing roadmap
    const roadmapDoc = await getDoc(doc(db, 'roadmaps', roadmapId));
    if (!roadmapDoc.exists()) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      );
    }
    
    const roadmapData = roadmapDoc.data();
    const existingMilestones = roadmapData.milestones || [];
    const targetCompanies = roadmapData.targetCompanies || [];
    const professionalField = roadmapData.professionalField || 'computer-science';
    const nextLevel = (currentLevel || existingMilestones.length) + 1;
    
    // Get candidate profile for context
    const candidateDoc = await getDoc(doc(db, 'users', candidateId));
    const candidateData = candidateDoc.exists() ? candidateDoc.data() : {};
    const resumeAnalysis = candidateData.resumeAnalysis || {};
    
    // Create prompt for next level generation
    const prompt = `You are an expert career counselor creating Level ${nextLevel} milestones for a candidate's career roadmap.

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
{
  "milestones": [
    {
      "id": "unique-id",
      "title": "Milestone Title",
      "description": "Detailed description",
      "professionalField": "${professionalField}",
      "category": "technical|fundamental|niche|soft|career",
      "subcategory": "specific-subcategory",
      "skills": ["skill1", "skill2"],
      "timeframe": "X weeks/months",
      "completed": false,
      "difficulty": 1-5,
      "priority": "low|medium|high|critical",
      "estimatedHours": 40,
      "level": ${nextLevel},
      "successCriteria": ["criterion1", "criterion2"],
      "attributes": {
        // Field-specific attributes based on category
      },
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://actual-url.com",
          "type": "course|book|documentation|etc",
          "estimatedTime": "2 weeks",
          "cost": "free|paid|freemium",
          "description": "Brief description"
        }
      ]
    }
  ]
}`;

    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert career counselor specializing in creating progressive, level-based career development roadmaps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const openaiDuration = performance.now() - openaiStartTime;
    debug.log(`OpenAI call completed in ${Math.round(openaiDuration)}ms`);

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      debug.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from AI');
    }
    
    // Process milestones
    const newMilestones = parsedResponse.milestones.map((milestone: any) => ({
      ...milestone,
      id: milestone.id || uuidv4(),
      level: nextLevel,
      createdAt: new Date(),
      professionalField: professionalField as ProfessionalField
    }));
    
    // Update roadmap with new milestones
    await updateDoc(doc(db, 'roadmaps', roadmapId), {
      milestones: [...existingMilestones, ...newMilestones],
      lastUpdated: new Date(),
      maxLevel: nextLevel
    });
    
    const totalDuration = performance.now() - requestStartTime;
    debug.log(`Next level generated successfully in ${Math.round(totalDuration)}ms`);
    
    return NextResponse.json({
      success: true,
      level: nextLevel,
      milestones: newMilestones,
      _debug: {
        processingTime: Math.round(totalDuration),
        openaiTime: Math.round(openaiDuration),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error generating next level after ${Math.round(totalDuration)}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate next level', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}