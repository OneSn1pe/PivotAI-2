import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone } from '@/types/user';

// Enable Edge Runtime for improved performance with longer running functions
export const runtime = 'edge';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:generate-roadmap]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:generate-roadmap:ERROR]', ...args);
  }
};

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined');
}

// Initialize OpenAI with proper timeout settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000, // Reduced from 60000 to avoid Vercel's own timeout
  maxRetries: 3,  // Increased from 2 to improve reliability
});

// Helper function to truncate large objects for API calls
function truncateForAPI(obj: any, maxLength = 2000): any {
  if (typeof obj === 'string') {
    return obj.length <= maxLength ? obj : obj.substring(0, maxLength) + '...';
  } else if (Array.isArray(obj)) {
    return obj.map(item => truncateForAPI(item, maxLength));
  } else if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = truncateForAPI(obj[key], maxLength);
    }
    return result;
  }
  return obj;
}

// Add retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelayMs = 1000): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      // Create a timeout promise with shorter timeout to ensure we respond before Vercel's limit
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timed out after 40s'));
        }, 40000); // 40 second client-side timeout (reduced from 60s)
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Enhanced error logging
      debug.error(`API call error (attempt ${retries+1}/${maxRetries+1}):`, 
        error.status || error.code || 'unknown',
        error.message || 'No error message');
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'Operation timed out after 40s') {
        debug.error('Client-side timeout reached:', error.message);
        throw error; // Don't retry on client-side timeouts
      }
      
      // Retry on more error types: rate limits, connection issues, and server errors
      if ((error.status === 429 || error.status >= 500 || error.code === 'ECONNRESET') && retries < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retries);
        debug.log(`API error, retrying in ${delay}ms (retry ${retries + 1}/${maxRetries})`);
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
  const requestStartTime = performance.now();
  debug.log('POST request received');
  
  try {
    // Verify Firebase is initialized properly
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    // Parse request body safely
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        details: parseError instanceof Error ? parseError.message : String(parseError) 
      }, { status: 400 });
    }

    const { resumeAnalysis, targetCompanies, candidateId } = requestData;

    // Validate candidateId is provided
    if (!candidateId) {
      return NextResponse.json({ 
        error: 'Missing candidateId', 
        details: 'candidateId is required to generate a roadmap' 
      }, { status: 400 });
    }

    debug.log(`Processing roadmap generation for candidate: ${candidateId}`);

    // Check if targetCompanies is provided and valid
    let companiesForRoadmap = targetCompanies;

    // If no target companies were provided or the array is empty, fetch from user profile
    if (!companiesForRoadmap || companiesForRoadmap.length === 0) {
      debug.log('No target companies provided, attempting to fetch from user profile');
      
      if (!candidateId) {
        return NextResponse.json({ 
          error: 'Missing data', 
          details: 'No target companies provided and no candidateId to fetch them'
        }, { status: 400 });
      }
      
      try {
        // Fetch the user profile to get target companies
        const userDoc = await getDoc(doc(db as Firestore, 'users', candidateId));
        
        if (!userDoc.exists()) {
          return NextResponse.json({ 
            error: 'User not found', 
            details: 'User profile not found' 
          }, { status: 404 });
        }
        
        const userData = userDoc.data();
        companiesForRoadmap = userData.targetCompanies || [];
        
        debug.log(`Found ${companiesForRoadmap.length} target companies in user profile`);
        
        // If still no target companies, use a default
        if (companiesForRoadmap.length === 0) {
          debug.log('No target companies found in user profile, using default');
          companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
        }
      } catch (userFetchError) {
        debug.error('Error fetching user profile:', userFetchError);
        return NextResponse.json({ 
          error: 'Database Error', 
          details: 'Failed to fetch user profile'
        }, { status: 500 });
      }
    }

    // Truncate resume analysis to prevent large payloads
    const truncatedAnalysis = truncateForAPI(resumeAnalysis);
    debug.log('Calling OpenAI API...');
    const openaiStartTime = performance.now();

    // Call OpenAI with retry logic and proper error handling
    let completion;
    let milestones: Milestone[] = [];
    let candidateGapAnalysis: any = null;
    let targetRoleRequirements: string[] = [];
    let successMetrics: string[] = [];
    let openaiDuration = 0;
    
    try {
      completion = await withRetry(async () => {
        // Use a more concise prompt to reduce token usage and processing time
        return await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a career coach creating personalized roadmaps. Return only valid JSON with no additional text.`
            },
            {
              role: "user",
              content: `Create a career roadmap for a candidate targeting: ${companiesForRoadmap.map((c: TargetCompany) => 
                `${c.name} (${c.position})`).join(', ')} within the next 1-2 years.

Format the response as JSON with:
{
  "milestones": [
    {
      "id": "${uuidv4()}",
      "title": "Milestone name",
      "description": "Brief description with key steps",
      "skills": ["skill1", "skill2"],
      "timeframe": "1-3 months",
      "completed": false,
      "resources": [
        {
          "title": "Resource name",
          "url": "resource_url",
          "type": "course/book/project/article"
        }
      ]
    }
  ],
  "candidateGapAnalysis": {
    "currentStrengths": ["strength1", "strength2"],
    "criticalGaps": ["gap1", "gap2"]
  },
  "targetRoleRequirements": ["req1", "req2"],
  "successMetrics": ["metric1", "metric2"]
}

Candidate profile:
- Skills: ${JSON.stringify(truncatedAnalysis.skills || [])}
- Experience: ${JSON.stringify(truncatedAnalysis.experience || [])}
- Education: ${JSON.stringify(truncatedAnalysis.education || [])}
- Strengths: ${JSON.stringify(truncatedAnalysis.strengths || [])}
- Weaknesses: ${JSON.stringify(truncatedAnalysis.weaknesses || [])}

Create exactly 5 milestones with 2-3 resources each.`
            }
          ],
          temperature: 0.1, // Lower temperature for more deterministic outputs
          max_tokens: 1800, // Reduced token count
          response_format: { type: 'json_object' } // Ensure JSON format
        });
      });
      
      openaiDuration = performance.now() - openaiStartTime;
      debug.log(`OpenAI response received (${Math.round(openaiDuration)}ms)`);
    } catch (openaiError: any) {
      debug.error('OpenAI API call failed:', openaiError);
      
      // Generate fallback roadmap when OpenAI fails
      debug.log('Generating fallback roadmap due to OpenAI error');
      
      // Return error response with fallback roadmap
      const fallbackRoadmap = createFallbackRoadmap(resumeAnalysis, candidateId);
      return NextResponse.json({
        ...fallbackRoadmap,
        _error: {
          message: 'Used fallback roadmap due to API timeout or error',
          details: openaiError.message || String(openaiError)
        }
      });
    }

    // Parse the milestones from the OpenAI response
    try {
      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      // Handle JSON response more robustly
      let parsedResponse;
      try {
        // Try direct JSON parsing first (preferred with response_format: json_object)
        parsedResponse = JSON.parse(content);
      } catch (directParseError) {
        // Fallback: try to extract JSON using regex if direct parsing fails
        const jsonMatch = content.match(/({[\s\S]*})/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
      
      if (!parsedResponse.milestones || !Array.isArray(parsedResponse.milestones)) {
        throw new Error('Invalid milestones structure in response');
      }
      
      // Ensure each milestone has a unique ID
      milestones = parsedResponse.milestones.map((milestone: any) => ({
        ...milestone,
        id: milestone.id || uuidv4(),
        completed: false // Always start with uncompleted milestones for new roadmap
      }));
      
      // Extract additional analysis components if available
      candidateGapAnalysis = parsedResponse.candidateGapAnalysis;
      targetRoleRequirements = parsedResponse.targetRoleRequirements || [];
      successMetrics = parsedResponse.successMetrics || [];
      
    } catch (parseError) {
      debug.error('Error parsing OpenAI response:', parseError);
      debug.log('Raw response content:', completion.choices[0].message.content?.substring(0, 200) + '...');
      
      // Fallback: generate synthetic milestones
      milestones = createFallbackMilestones(resumeAnalysis);
    }

    // Check if a roadmap already exists for this candidate
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId),
      limit(5) // Add limit to optimize query
    );
    
    try {
      const roadmapSnapshot = await getDocs(roadmapQuery);
      
      // Delete all existing roadmaps for this candidate
      if (!roadmapSnapshot.empty) {
        debug.log(`Deleting ${roadmapSnapshot.size} existing roadmaps for candidateId:`, candidateId);
        
        const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
          deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
        );
        
        // Set a timeout for deletion to avoid blocking the response
        const deletionTimeout = new Promise((resolve) => {
          setTimeout(() => {
            debug.log('Deletion timeout reached, continuing with response');
            resolve(null);
          }, 3000); // 3 second timeout for deletion
        });
        
        // Race the deletion against the timeout
        await Promise.race([Promise.all(deletePromises), deletionTimeout]);
      }
    } catch (deleteError) {
      debug.error('Error deleting existing roadmaps:', deleteError);
      // Continue with creating new roadmap even if deletion fails
    }
    
    // Create a new roadmap document
    const roadmap = {
      id: uuidv4(),
      candidateId: candidateId.toString(),
      milestones,
      createdAt: new Date(),
      updatedAt: new Date(),
      candidateGapAnalysis,
      targetRoleRequirements,
      successMetrics
    };
    
    // Store in Firestore
    try {
      const docRef = await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);
      roadmap.id = docRef.id; // Ensure we return the document ID from Firestore
      
      debug.log('Created new roadmap for candidateId:', candidateId);
      
      const totalDuration = performance.now() - requestStartTime;
      debug.log(`Total request processed in ${Math.round(totalDuration)}ms`);
      
      return NextResponse.json({
        ...roadmap,
        _debug: {
          processingTime: Math.round(totalDuration),
          openaiTime: Math.round(openaiDuration)
        }
      });
    } catch (firestoreError) {
      debug.error('Error storing roadmap in Firestore:', firestoreError);
      
      // Return the generated roadmap even if storage fails
      return NextResponse.json({
        ...roadmap,
        _error: {
          message: 'Generated roadmap but failed to store in database',
          details: firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
        }
      });
    }
  } catch (error) {
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Error generating roadmap after ${Math.round(totalDuration)}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate roadmap', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to create fallback milestones when OpenAI fails
function createFallbackMilestones(resumeAnalysis: ResumeAnalysis): Milestone[] {
  return [
    {
      id: uuidv4(),
      title: "Skill Development",
      description: "Focus on developing core skills needed for target roles",
      skills: resumeAnalysis?.skills?.slice(0, 3) || ["Technical Skills", "Communication", "Problem Solving"],
      timeframe: "1-3 months",
      completed: false,
      resources: [
        {
          title: "Online Learning Platform",
          url: "https://www.coursera.org",
          type: "course"
        },
        {
          title: "Skill Assessment Tool",
          url: "https://www.linkedin.com/learning",
          type: "course"
        }
      ]
    },
    {
      id: uuidv4(),
      title: "Portfolio Building",
      description: "Create portfolio showcasing your abilities",
      skills: ["Project Management", "Documentation"],
      timeframe: "2-4 months",
      completed: false,
      resources: [
        {
          title: "Portfolio Best Practices",
          url: "https://github.com/readme/guides",
          type: "article"
        },
        {
          title: "GitHub Guides",
          url: "https://guides.github.com",
          type: "article"
        }
      ]
    },
    {
      id: uuidv4(),
      title: "Networking",
      description: "Expand professional network in target industry",
      skills: ["Communication", "Networking"],
      timeframe: "3-6 months",
      completed: false,
      resources: [
        {
          title: "LinkedIn Networking Guide",
          url: "https://www.linkedin.com/help/linkedin/answer/a566195",
          type: "article"
        },
        {
          title: "Industry Events Calendar",
          url: "https://www.meetup.com",
          type: "article"
        }
      ]
    },
    {
      id: uuidv4(),
      title: "Interview Preparation",
      description: "Prepare for interviews at target companies",
      skills: ["Interview Skills", "Technical Knowledge"],
      timeframe: "1-2 months",
      completed: false,
      resources: [
        {
          title: "Practice Interview Questions",
          url: "https://www.interviewcake.com",
          type: "article"
        },
        {
          title: "Mock Interview Platform",
          url: "https://www.pramp.com",
          type: "course"
        }
      ]
    },
    {
      id: uuidv4(),
      title: "Application Submission",
      description: "Apply to target positions with customized materials",
      skills: ["Resume Writing", "Cover Letter Writing"],
      timeframe: "1-2 months",
      completed: false,
      resources: [
        {
          title: "Resume Templates",
          url: "https://www.resume.io",
          type: "article"
        },
        {
          title: "Job Application Tracker",
          url: "https://www.notion.so/templates/job-hunt-tracker",
          type: "article"
        }
      ]
    }
  ];
}

// Helper function to create a complete fallback roadmap
function createFallbackRoadmap(resumeAnalysis: ResumeAnalysis, candidateId: string): any {
  return {
    id: uuidv4(),
    candidateId: candidateId.toString(),
    milestones: createFallbackMilestones(resumeAnalysis),
    createdAt: new Date(),
    updatedAt: new Date(),
    candidateGapAnalysis: {
      currentStrengths: resumeAnalysis?.strengths?.slice(0, 3) || ["Technical skills", "Communication"],
      criticalGaps: resumeAnalysis?.weaknesses?.slice(0, 3) || ["Industry experience", "Leadership"]
    },
    targetRoleRequirements: ["Technical proficiency", "Communication skills", "Problem-solving ability"],
    successMetrics: ["Portfolio completion", "Interview requests", "Offer acceptance"]
  };
}