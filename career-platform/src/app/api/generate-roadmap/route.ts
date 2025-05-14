import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone } from '@/types/user';

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
  timeout: 30000, // 30 second timeout
  maxRetries: 2,  // Retry twice on transient errors
});

// Helper function to truncate large objects for API calls
function truncateForAPI(obj: any, maxLength = 4000): any {
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
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelayMs = 1000): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timed out after 25s'));
        }, 25000); // 25 second client-side timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'Operation timed out after 25s') {
        debug.error('Client-side timeout reached:', error.message);
        throw error; // Don't retry on client-side timeouts
      }
      
      // Only retry on rate limit errors or network issues
      if ((error.status === 429 || error.code === 'ECONNRESET') && retries < maxRetries) {
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

    const { resumeAnalysis, targetCompanies, candidateId } = await request.json();

    // Validate candidateId is provided
    if (!candidateId) {
      throw new Error('candidateId is required to generate a roadmap');
    }

    debug.log(`Processing roadmap generation for candidate: ${candidateId}`);

    // Check if targetCompanies is provided and valid
    let companiesForRoadmap = targetCompanies;

    // If no target companies were provided or the array is empty, fetch from user profile
    if (!companiesForRoadmap || companiesForRoadmap.length === 0) {
      debug.log('No target companies provided, attempting to fetch from user profile');
      
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
      
      debug.log(`Found ${companiesForRoadmap.length} target companies in user profile`);
      
      // If still no target companies, use a default
      if (companiesForRoadmap.length === 0) {
        debug.log('No target companies found in user profile, using default');
        companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
      }
    }

    // Truncate resume analysis to prevent large payloads
    const truncatedAnalysis = truncateForAPI(resumeAnalysis);
    debug.log('Calling OpenAI API...');
    const openaiStartTime = performance.now();

    // Call OpenAI with retry logic and proper error handling
    let completion;
    try {
      completion = await withRetry(async () => {
        return await openai.chat.completions.create({
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
- Skills: ${JSON.stringify(truncatedAnalysis.skills)}
- Experience: ${JSON.stringify(truncatedAnalysis.experience)}
- Education: ${JSON.stringify(truncatedAnalysis.education)}
- Strengths: ${JSON.stringify(truncatedAnalysis.strengths)}
- Weaknesses: ${JSON.stringify(truncatedAnalysis.weaknesses)}

Guidelines:
- Create exactly 5 milestones
- Each milestone needs a unique ID
- Include 2-3 specific resources per milestone
- Resources should be high-quality, free or low-cost, and directly relevant
- Resource types can be: article, video, course, book, or documentation
- Prefer official documentation and well-known learning platforms
- Return ONLY valid JSON with no additional text or formatting`
            }
          ],
          temperature: 0.2, // Lower temperature for more consistent output
          max_tokens: 2000, // Limit the response size
        });
      });
    } catch (openaiError: any) {
      debug.error('OpenAI API call failed:', openaiError);
      
      // Generate fallback roadmap when OpenAI fails
      debug.log('Generating fallback roadmap due to OpenAI error');
      
      // Return error response with fallback roadmap
      const fallbackRoadmap = createFallbackRoadmap(resumeAnalysis, candidateId);
      return NextResponse.json({
        ...fallbackRoadmap,
        _error: {
          message: 'Used fallback roadmap due to OpenAI timeout',
          details: openaiError.message || String(openaiError)
        }
      });
    }
    
    const openaiDuration = performance.now() - openaiStartTime;
    debug.log(`OpenAI response received (${Math.round(openaiDuration)}ms)`);

    // Parse the milestones from the OpenAI response
    let milestones;
    let candidateGapAnalysis;
    let targetRoleRequirements;
    let successMetrics;
    
    try {
      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      // Extract the JSON part from the response
      const jsonMatch = content.match(/({[\s\S]*})/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      
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
      targetRoleRequirements = parsedResponse.targetRoleRequirements;
      successMetrics = parsedResponse.successMetrics;
      
    } catch (error) {
      debug.error('Error parsing OpenAI response:', error);
      debug.log('Raw response content:', completion.choices[0].message.content?.substring(0, 200) + '...');
      
      // Fallback: generate synthetic milestones
      milestones = createFallbackMilestones(resumeAnalysis);
    }

    // Check if a roadmap already exists for this candidate
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    
    try {
      const roadmapSnapshot = await getDocs(roadmapQuery);
      
      // Delete all existing roadmaps for this candidate
      if (!roadmapSnapshot.empty) {
        debug.log(`Deleting ${roadmapSnapshot.size} existing roadmaps for candidateId:`, candidateId);
        
        const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
          deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
        );
        
        await Promise.all(deletePromises);
      }
    } catch (deleteError) {
      debug.error('Error deleting existing roadmaps:', deleteError);
      // Continue with creating new roadmap even if deletion fails
    }
    
    // Create a new roadmap document
    const roadmap: CareerRoadmap = {
      id: uuidv4(),
      candidateId: candidateId.toString(),
      milestones,
      createdAt: new Date(),
      updatedAt: new Date(),
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
          type: "documentation"
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
function createFallbackRoadmap(resumeAnalysis: ResumeAnalysis, candidateId: string): CareerRoadmap {
  return {
    id: uuidv4(),
    candidateId: candidateId.toString(),
    milestones: createFallbackMilestones(resumeAnalysis),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}