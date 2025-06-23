import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getAdminFirestore, handleFirebaseError } from '@/utils/api-firebase';
import { Milestone, ProfessionalField } from '@/types/user';
import { PROMPT_CONSTANTS } from '@/constants/promptConstants';

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
    
    // Create prompt for next level generation
    const prompt = `Generate Level ${nextLevel} milestones building on previous progress.

Previous completions:
${existingMilestones.filter((m: Milestone) => m.level < nextLevel).map((m: Milestone) => `- ${m.title}`).join('\n')}

Create 3-5 milestones that advance toward: ${targetCompanies.map((c: any) => c.name).join(', ')}

Use this JSON structure (same as Level 1 but more advanced content):
{
  "milestones": [{
    "id": "unique-id",
    "title": "Milestone Title",
    "description": "Description",
    "category": "technical|fundamental|niche|soft|career",
    "skills": ["skill1"],
    "timeframe": "2-3 months",
    "completed": false,
    "difficulty": ${Math.min(nextLevel, 5)},
    "priority": "medium|high",
    "estimatedHours": ${40 + (nextLevel * 10)},
    "level": ${nextLevel},
    "successCriteria": ["criterion1"],
    "professionalField": "${professionalField}",
    "attributes": {},
    "resources": [{
      "title": "Resource name",
      "url": "https://actual-url.com",
      "type": "course|book|documentation",
      "estimatedTime": "2 weeks",
      "cost": "free|paid"
    }]
  }]
}

${PROMPT_CONSTANTS.JSON_FORMAT}`;

    // Call OpenAI
    const openaiStartTime = performance.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.7,
      max_tokens: 2000
    });

    const openaiDuration = performance.now() - openaiStartTime;
    debug.log(`OpenAI call completed in ${Math.round(openaiDuration)}ms`);

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Log raw response for debugging
    debug.log('Raw OpenAI response:', responseText.substring(0, 200) + '...');
    
    // Parse response - handle potential formatting issues
    let parsedResponse;
    try {
      // Clean up response text - remove any markdown code blocks if present
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      debug.error('Failed to parse OpenAI response:', parseError);
      debug.error('Response text:', responseText);
      throw new Error('Invalid response format from AI');
    }
    
    // Validate response structure
    if (!parsedResponse || !parsedResponse.milestones || !Array.isArray(parsedResponse.milestones)) {
      debug.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response structure from AI - missing milestones array');
    }
    
    // Process milestones and ensure unique IDs
    // First, collect all existing milestone IDs to avoid duplicates
    const idSet = new Set<string>(existingMilestones.map((m: any) => m.id));
    const newMilestones = parsedResponse.milestones.map((milestone: any) => {
      // Generate a unique ID if missing or duplicate
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
    
  } catch (error: any) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error generating next level after ${Math.round(totalDuration)}ms:`, error);
    
    // Return more specific error information
    if (error.message && error.message.includes('Invalid response')) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    // Use the centralized error handler for other errors
    return handleFirebaseError(error);
  }
}