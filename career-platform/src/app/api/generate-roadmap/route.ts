import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone, ProfessionalField } from '@/types/user';

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
  timeout: 60000, // 60 second timeout
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
          reject(new Error('Operation timed out after 60s'));
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
      if (error.message === 'Operation timed out after 60s') {
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

    // Determine professional field - prioritize user's explicit selection
    let professionalField: ProfessionalField = 'computer-science';
    
    // First, try to get the user's explicitly selected professional field
    try {
      const userDoc = await getDoc(doc(db as Firestore, 'users', candidateId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.professionalField) {
          professionalField = userData.professionalField;
          debug.log(`Using user's selected professional field: ${professionalField}`);
        } else {
          // Fallback to inferring from other sources
          if (resumeAnalysis?.professionalField) {
            professionalField = resumeAnalysis.professionalField;
            debug.log(`Using professional field from resume analysis: ${professionalField}`);
          } else if (targetCompanies && targetCompanies.length > 0 && targetCompanies[0].industry) {
            professionalField = targetCompanies[0].industry;
            debug.log(`Using professional field from first target company: ${professionalField}`);
          } else {
            debug.log(`Using default professional field: ${professionalField}`);
          }
        }
      }
    } catch (error) {
      debug.error('Error fetching user professional field, using default:', error);
    }

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
      "category": "technical|fundamental|niche|soft",
      "subcategory": "Optional specific classification",
      "skills": ["skill1", "skill2"],
      "timeframe": "1-3 months",
      "completed": false,
      "difficulty": 1-5,
      "priority": "low|medium|high|critical",
      "estimatedHours": 40,
      "successCriteria": ["criterion1", "criterion2"],
      "attributes": {
        "technical": {
          "technologies": ["React", "Node.js"],
          "projectType": "fullstack",
          "complexityLevel": "intermediate",
          "deliverables": [{"type": "deployed-app", "description": "Working application"}],
          "learningPath": "self-directed"
        }
      },
      "resources": [
        {
          "title": "Resource name",
          "url": "resource_url",
          "type": "course|book|project|article|documentation|certification",
          "estimatedTime": "2 weeks",
          "cost": "free|paid|freemium"
        }
      ],
      "tasks": [
        {
          "id": "task-1",
          "description": "Complete tutorial",
          "completed": false
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

Use the following guidance for milestone categories:
- "technical": Programming, software development, frameworks, databases, APIs, coding projects
- "fundamental": Problem-solving, system design, architecture, debugging, testing, core CS concepts
- "niche": Specialized technologies like blockchain, AI/ML, AR/VR, IoT, emerging technologies
- "soft": Communication, leadership, teamwork, emotional intelligence, time management, networking

For technical milestones, include detailed attributes like:
- technologies: specific tools/frameworks
- projectType: frontend/backend/fullstack/mobile/devops/data/ai-ml
- complexityLevel: beginner/intermediate/advanced/expert
- deliverables: what they should build/create

For fundamental milestones, focus on:
- competencyArea: problem-solving/analytical-thinking/research/documentation
- industryScope: universal/tech-specific/domain-specific
- conceptualAreas: key concepts being learned

For niche milestones, emphasize:
- specializationDomain: the specific niche area
- marketDemand: emerging/growing/stable
- careerImpact: differentiator/requirement/cutting-edge

For soft milestones, highlight:
- skillCategory: communication/leadership/teamwork/etc
- developmentMethod: practice-based/feedback-driven/mentorship
- applicationScenarios: where these skills apply

Candidate's current profile:
- Skills: ${JSON.stringify(truncatedAnalysis.skills)}
- Experience: ${JSON.stringify(truncatedAnalysis.experience)}
- Education: ${JSON.stringify(truncatedAnalysis.education)}
- Strengths: ${JSON.stringify(truncatedAnalysis.strengths)}
- Weaknesses: ${JSON.stringify(truncatedAnalysis.weaknesses)}

Guidelines:
- Create exactly 6 milestones (2 technical, 2 fundamental, 1 niche, 1 soft)
- Each milestone needs a unique ID
- Include exactly 3 specific resources per milestone
- Add 1-3 tasks per milestone for progress tracking
- Include success criteria for each milestone
- Estimate hours required (20-100 hours per milestone)
- Set appropriate difficulty (1-5) and priority levels
- Resources should be high-quality, free or low-cost, and directly relevant
- Prefer official documentation and well-known learning platforms
- CRITICAL: All resources must be real, verified, and from reputable sources - verify URLs exist and are accessible
- Return ONLY valid JSON with no additional text or formatting`
            }
          ],
          temperature: 0.2, // Lower temperature for more consistent output
          max_tokens: 3000, // Increased limit for 6 milestones
        });
      });
    } catch (openaiError: any) {
      debug.error('OpenAI API call failed:', openaiError);
      
      // Generate fallback roadmap when OpenAI fails
      debug.log('Generating fallback roadmap due to OpenAI error');
      
      // Return error response with fallback roadmap
      const fallbackRoadmap = createFallbackRoadmap(resumeAnalysis, candidateId, professionalField);
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
        completed: false, // Always start with uncompleted milestones for new roadmap
        professionalField
      }));
      
      // Extract additional analysis components if available
      candidateGapAnalysis = parsedResponse.candidateGapAnalysis;
      targetRoleRequirements = parsedResponse.targetRoleRequirements;
      successMetrics = parsedResponse.successMetrics;
      
    } catch (error) {
      debug.error('Error parsing OpenAI response:', error);
      debug.log('Raw response content:', completion.choices[0].message.content?.substring(0, 200) + '...');
      
      // Fallback: generate synthetic milestones
      milestones = createFallbackMilestones(resumeAnalysis, professionalField);
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
      professionalField,
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
function createFallbackMilestones(resumeAnalysis: ResumeAnalysis, professionalField: ProfessionalField = 'computer-science'): Milestone[] {
  return [
    {
      id: uuidv4(),
      professionalField,
      title: "Core Technical Skills Development",
      description: "Focus on developing fundamental technical skills needed for target roles",
      category: "technical" as const,
      subcategory: "core-development",
      skills: resumeAnalysis?.skills?.slice(0, 3) || ["JavaScript", "React", "Node.js"],
      timeframe: "1-3 months",
      completed: false,
      difficulty: 3 as const,
      priority: "high" as const,
      estimatedHours: 60,
      attributes: {
        technical: {
          technologies: ["JavaScript", "React", "Node.js"],
          projectType: "fullstack",
          complexityLevel: "intermediate",
          deliverables: [
            {
              type: "code-repository",
              description: "Personal project showcasing learned skills"
            }
          ],
          learningPath: "self-directed"
        }
      },
      resources: [
        {
          title: "Online Learning Platform",
          url: "https://www.coursera.org",
          type: "course",
          estimatedTime: "4 weeks",
          cost: "freemium"
        },
        {
          title: "Skill Assessment Tool",
          url: "https://www.linkedin.com/learning",
          type: "course",
          estimatedTime: "2 weeks",
          cost: "paid"
        },
        {
          title: "Practice Projects Repository",
          url: "https://github.com/tuvtran/project-based-learning",
          type: "project",
          estimatedTime: "6 weeks",
          cost: "free"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Complete online course modules",
          completed: false
        },
        {
          id: "task-2",
          description: "Build a practice project",
          completed: false
        }
      ],
      successCriteria: [
        "Complete all learning modules",
        "Build functional project",
        "Pass skill assessment"
      ]
    },
    {
      id: uuidv4(),
      professionalField,
      title: "System Design Fundamentals",
      description: "Learn core system design principles and architectural patterns",
      category: "fundamental" as const,
      subcategory: "system-architecture",
      skills: ["System Design", "Architecture", "Scalability"],
      timeframe: "2-4 months",
      completed: false,
      difficulty: 4 as const,
      priority: "high" as const,
      estimatedHours: 80,
      attributes: {
        fundamental: {
          competencyArea: "problem-solving",
          industryScope: "tech-specific",
          careerStage: "mid-level",
          conceptualAreas: ["System Architecture", "Database Design", "Scalability"],
          theoreticalDepth: "intermediate",
          applicationAreas: ["Web Development", "Backend Systems"],
          buildsUpon: ["Programming Fundamentals"],
          enablesAdvancement: ["Senior Development Roles"],
          knowledgeType: "conceptual"
        }
      },
      resources: [
        {
          title: "System Design Primer",
          url: "https://github.com/donnemartin/system-design-primer",
          type: "documentation",
          estimatedTime: "6 weeks",
          cost: "free"
        },
        {
          title: "Designing Data-Intensive Applications",
          url: "https://dataintensive.net",
          type: "book",
          estimatedTime: "8 weeks",
          cost: "paid"
        },
        {
          title: "High Scalability Blog",
          url: "http://highscalability.com/",
          type: "article",
          estimatedTime: "4 weeks",
          cost: "free"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Study system design patterns",
          completed: false
        },
        {
          id: "task-2",
          description: "Practice designing scalable systems",
          completed: false
        }
      ],
      successCriteria: [
        "Understand key architectural patterns",
        "Design a simple distributed system",
        "Explain trade-offs in system design"
      ]
    },
    {
      id: uuidv4(),
      professionalField,
      title: "AI/ML Specialization",
      description: "Develop expertise in machine learning and artificial intelligence",
      category: "niche" as const,
      subcategory: "artificial-intelligence",
      skills: ["Machine Learning", "Python", "Data Science"],
      timeframe: "3-6 months",
      completed: false,
      difficulty: 5 as const,
      priority: "medium" as const,
      estimatedHours: 120,
      attributes: {
        niche: {
          specializationDomain: "artificial-intelligence",
          marketDemand: "growing",
          expertiseLevel: "working-knowledge",
          industryAdoption: "mainstream",
          competitorLandscape: "moderate-competition",
          careerImpact: "differentiator",
          salaryPremium: 20,
          learningCurve: "steep",
          resourceAvailability: "abundant",
          communitySize: "large",
          trendDirection: "rising",
          longevityEstimate: "5+ years"
        }
      },
      resources: [
        {
          title: "Machine Learning Course",
          url: "https://www.coursera.org/learn/machine-learning",
          type: "course",
          estimatedTime: "12 weeks",
          cost: "freemium"
        },
        {
          title: "TensorFlow Documentation",
          url: "https://www.tensorflow.org/learn",
          type: "documentation",
          estimatedTime: "4 weeks",
          cost: "free"
        },
        {
          title: "Kaggle Learn",
          url: "https://www.kaggle.com/learn",
          type: "course",
          estimatedTime: "8 weeks",
          cost: "free"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Complete ML fundamentals course",
          completed: false
        },
        {
          id: "task-2",
          description: "Build ML project using TensorFlow",
          completed: false
        }
      ],
      successCriteria: [
        "Understand ML algorithms",
        "Build and deploy ML model",
        "Demonstrate practical ML application"
      ]
    },
    {
      id: uuidv4(),
      professionalField,
      title: "Professional Communication & Leadership",
      description: "Develop effective communication and leadership skills for career advancement",
      category: "soft" as const,
      subcategory: "leadership-communication",
      skills: ["Communication", "Leadership", "Team Management"],
      timeframe: "2-4 months",
      completed: false,
      difficulty: 3 as const,
      priority: "high" as const,
      estimatedHours: 40,
      attributes: {
        soft: {
          skillCategory: "leadership",
          developmentMethod: "practice-based",
          applicationScenarios: ["Team meetings", "Project presentations", "Client interactions"],
          roleRelevance: "team-lead",
          assessmentDifficulty: "somewhat-subjective",
          measurementMethods: ["360-feedback", "peer-review"],
          behavioralMarkers: [
            {
              indicator: "Leads team meetings effectively",
              frequency: "weekly"
            },
            {
              indicator: "Provides clear project updates",
              frequency: "daily"
            }
          ],
          developmentTimeframe: "months",
          improvementPattern: "continuous"
        }
      },
      resources: [
        {
          title: "Effective Communication Skills",
          url: "https://www.coursera.org/learn/communication-skills",
          type: "course",
          estimatedTime: "6 weeks",
          cost: "freemium"
        },
        {
          title: "Leadership Fundamentals",
          url: "https://www.linkedin.com/learning/leadership-fundamentals",
          type: "course",
          estimatedTime: "4 weeks",
          cost: "paid"
        },
        {
          title: "Toastmasters International",
          url: "https://www.toastmasters.org/",
          type: "course",
          estimatedTime: "12 weeks",
          cost: "paid"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Complete communication skills course",
          completed: false
        },
        {
          id: "task-2",
          description: "Practice public speaking",
          completed: false
        },
        {
          id: "task-3",
          description: "Lead a team project",
          completed: false
        }
      ],
      successCriteria: [
        "Deliver confident presentations",
        "Receive positive team feedback",
        "Successfully lead project to completion"
      ]
    },
    {
      id: uuidv4(),
      professionalField,
      title: "Advanced Frontend Development",
      description: "Master advanced frontend technologies and modern development practices",
      category: "technical" as const,
      subcategory: "frontend-specialization",
      skills: ["React", "TypeScript", "Modern CSS", "Performance Optimization"],
      timeframe: "2-3 months",
      completed: false,
      difficulty: 4 as const,
      priority: "medium" as const,
      estimatedHours: 70,
      attributes: {
        technical: {
          technologies: ["React", "TypeScript", "Vite", "CSS-in-JS"],
          projectType: "frontend",
          complexityLevel: "advanced",
          deliverables: [
            {
              type: "deployed-app",
              description: "Advanced React application with TypeScript"
            }
          ],
          learningPath: "self-directed"
        }
      },
      resources: [
        {
          title: "Advanced React Patterns",
          url: "https://epicreact.dev/",
          type: "course",
          estimatedTime: "6 weeks",
          cost: "paid"
        },
        {
          title: "TypeScript Deep Dive",
          url: "https://www.typescriptlang.org/docs/",
          type: "documentation",
          estimatedTime: "4 weeks",
          cost: "free"
        },
        {
          title: "Frontend Masters",
          url: "https://frontendmasters.com/",
          type: "course",
          estimatedTime: "8 weeks",
          cost: "paid"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Build component library with TypeScript",
          completed: false
        },
        {
          id: "task-2",
          description: "Implement performance optimizations",
          completed: false
        }
      ],
      successCriteria: [
        "Create reusable component library",
        "Achieve 95+ Lighthouse performance score",
        "Implement advanced React patterns"
      ]
    },
    {
      id: uuidv4(),
      professionalField,
      title: "Algorithm & Data Structure Mastery",
      description: "Strengthen computational thinking and problem-solving fundamentals",
      category: "fundamental" as const,
      subcategory: "computer-science-fundamentals",
      skills: ["Algorithms", "Data Structures", "Problem Solving", "Computational Thinking"],
      timeframe: "3-4 months",
      completed: false,
      difficulty: 4 as const,
      priority: "high" as const,
      estimatedHours: 90,
      attributes: {
        fundamental: {
          competencyArea: "analytical-thinking",
          industryScope: "universal",
          careerStage: "all-levels",
          conceptualAreas: ["Big O Notation", "Graph Theory", "Dynamic Programming"],
          theoreticalDepth: "deep",
          applicationAreas: ["Software Engineering", "Technical Interviews"],
          buildsUpon: ["Basic Programming"],
          enablesAdvancement: ["Senior Engineering Roles"],
          knowledgeType: "procedural"
        }
      },
      resources: [
        {
          title: "LeetCode Practice Platform",
          url: "https://leetcode.com/",
          type: "course",
          estimatedTime: "Ongoing",
          cost: "freemium"
        },
        {
          title: "Introduction to Algorithms (CLRS)",
          url: "https://mitpress.mit.edu/books/introduction-algorithms",
          type: "book",
          estimatedTime: "12 weeks",
          cost: "paid"
        },
        {
          title: "AlgoExpert",
          url: "https://www.algoexpert.io/",
          type: "course",
          estimatedTime: "10 weeks",
          cost: "paid"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Solve 100 algorithmic problems",
          completed: false
        },
        {
          id: "task-2",
          description: "Implement common data structures",
          completed: false
        }
      ],
      successCriteria: [
        "Solve problems efficiently with optimal time complexity",
        "Explain algorithmic trade-offs clearly",
        "Pass technical coding interviews"
      ]
    }
  ];
}

// Helper function to create a complete fallback roadmap
function createFallbackRoadmap(resumeAnalysis: ResumeAnalysis, candidateId: string, professionalField: ProfessionalField = 'computer-science'): CareerRoadmap {
  return {
    id: uuidv4(),
    candidateId: candidateId.toString(),
    professionalField,
    milestones: createFallbackMilestones(resumeAnalysis, professionalField),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}