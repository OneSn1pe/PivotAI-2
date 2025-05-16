import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone } from '@/types/user';

// Add debug logging
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[API:generate-roadmap]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[API:generate-roadmap:ERROR]', ...args);
  }
};

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined');
}

// Initialize OpenAI with API key and timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout for API calls
  maxRetries: 2,  // Built-in retries for transient errors
});

// Add type for OpenAI completion
type OpenAICompletion = {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
};

// Helper function to safely parse JSON
function safeJsonParse(text: string): { data: any; error: Error | null } {
  try {
    return { data: JSON.parse(text), error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Add retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelayMs = 1000): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OpenAI API request timed out after 60s'));
        }, 60000); // 60 second client-side timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'OpenAI API request timed out after 60s') {
        console.error('Client-side timeout reached:', error.message);
        throw error; // Don't retry on client-side timeouts
      }
      
      // Only retry on rate limit errors
      if (error.status === 429 && retries < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retries);
        console.log(`Rate limited (429), retrying in ${delay}ms (retry ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // Other errors or max retries reached, rethrow
        throw error;
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  debug.log('Starting roadmap generation request');

  try {
    // Verify Firebase is initialized properly
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    // Get request body
    const body = await request.json();
    const { resumeAnalysis, targetCompanies, candidateId } = body;

    // Validate inputs
    if (!resumeAnalysis) {
      return NextResponse.json(
        { error: 'Resume analysis is required' },
        { status: 400 }
      );
    }

    if (!targetCompanies || !Array.isArray(targetCompanies) || targetCompanies.length === 0) {
      return NextResponse.json(
        { error: 'At least one target company is required' },
        { status: 400 }
      );
    }

    // Validate candidateId is provided
    if (!candidateId) {
      throw new Error('candidateId is required to generate a roadmap');
    }

    // Check if targetCompanies is provided and valid
    let companiesForRoadmap = targetCompanies;

    // If no target companies were provided or the array is empty, fetch from user profile
    if (!companiesForRoadmap || companiesForRoadmap.length === 0) {
      console.log('No target companies provided, attempting to fetch from user profile');
      
      if (!candidateId) {
        throw new Error('Cannot generate roadmap: No target companies provided and no candidateId to fetch them');
      }
      
      // Fetch the user profile to get target companies
      const userDoc = await getDoc(doc(db as Firestore, 'users', candidateId));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      companiesForRoadmap = userData.targetCompanies || [];
      
      console.log(`Found ${companiesForRoadmap.length} target companies in user profile`);
      
      // If still no target companies, use a default
      if (companiesForRoadmap.length === 0) {
        console.log('No target companies found in user profile, using default');
        companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
      }
    }

    debug.log('Input validation passed, proceeding with OpenAI call');

    // Call OpenAI API with timeout handling
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a career coach specializing in helping candidates prepare for roles at top companies.`
          },
          {
            role: "user",
            content: `Create a personalized career roadmap for a candidate targeting positions at the following companies: ${companiesForRoadmap.map((c: TargetCompany) => `${c.name} (${c.position})`).join(', ')} within the next 1-2 years.

Return a structured JSON roadmap with these components:
{
  "milestones": [
    {
      "id": "${uuidv4()}",
      "title": "Milestone name",
      "description": "Detailed description with actionable steps",
      "skills": ["skill1", "skill2"],
      "timeframe": "1-3 months",
      "completed": false,
      "resources": [
        {
          "title": "Resource name",
          "url": "resource_url",
          "type": "course/book/project/article/documentation"
        }
      ]
    },
    ...
  ],
  "candidateGapAnalysis": {
    "currentStrengths": ["strength1", ...],
    "criticalGaps": ["gap1", ...]
  },
  "targetRoleRequirements": ["requirement1", ...],
  "successMetrics": ["metric1", ...]
}

Prioritize high-impact skills and experiences that specifically align with the target companies' known requirements for the positions. Focus on achievable milestones within the 1-2 year timeframe.

Candidate's current profile:
- Skills: ${JSON.stringify(resumeAnalysis.skills)}
- Experience: ${JSON.stringify(resumeAnalysis.experience)}
- Education: ${JSON.stringify(resumeAnalysis.education)}
- Strengths: ${JSON.stringify(resumeAnalysis.strengths)}
- Weaknesses: ${JSON.stringify(resumeAnalysis.weaknesses)}

Guidelines:
- Create exactly 5 milestones
- Each milestone needs a unique ID
- Include 2-3 specific resources per milestone
- Resources should be high-quality, free or low-cost, and directly relevant
- Resource types can be: article, video, course, book, or documentation
- Prefer official documentation and well-known learning platforms
- Return ONLY valid JSON with no additional text or formatting`
          }
        ]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API request timed out after 55s')), 55000)
      )
    ]) as OpenAICompletion;

    debug.log('OpenAI API call completed successfully');

    // Parse the response
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const { data, error } = safeJsonParse(content);
    if (error) {
      throw new Error('Failed to parse OpenAI response');
    }

    debug.log('Successfully parsed OpenAI response');

    // Validate and structure the response
    const roadmap: CareerRoadmap = {
      id: candidateId,
      candidateId: candidateId,
      milestones: Array.isArray(data.milestones) ? data.milestones.map((m: any) => ({
        ...m,
        id: m.id || uuidv4(),
        completed: false
      })) : [],
      candidateGapAnalysis: data.candidateGapAnalysis || {
        currentStrengths: [],
        criticalGaps: []
      },
      targetRoleRequirements: Array.isArray(data.targetRoleRequirements) ? data.targetRoleRequirements : [],
      successMetrics: Array.isArray(data.successMetrics) ? data.successMetrics : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    debug.log('Roadmap structure created, proceeding with Firestore operations');

    // Check if a roadmap already exists for this candidate
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    // Delete all existing roadmaps for this candidate
    if (!roadmapSnapshot.empty) {
      debug.log(`Deleting ${roadmapSnapshot.size} existing roadmaps for candidateId:`, candidateId);
      
      const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
        deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
      );
      
      await Promise.all(deletePromises);
    }
    
    // Store in Firestore
    const docRef = await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);
    roadmap.id = docRef.id;
    
    const endTime = Date.now();
    debug.log(`Roadmap generation completed in ${endTime - startTime}ms`);
    
    return NextResponse.json({ data: roadmap });
  } catch (error: any) {
    const endTime = Date.now();
    debug.error('Error generating roadmap:', error);
    debug.error(`Request failed after ${endTime - startTime}ms`);

    // Enhanced error response
    return NextResponse.json(
      { 
        error: 'Failed to generate roadmap',
        details: error.message,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      },
      { status: error.message.includes('timed out') ? 504 : 500 }
    );
  }
}