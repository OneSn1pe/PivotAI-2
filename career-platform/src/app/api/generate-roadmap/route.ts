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

// Initialize OpenAI with extended timeout settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 300000, // 5 minute timeout (increased from 2 minutes)
  maxRetries: 3,   // Retry 3 times on transient errors (increased from 2)
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
          reject(new Error('Operation timed out after 5 minutes'));
        }, 300000); // 5 minute client-side timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'Operation timed out after 5 minutes') {
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

    // Determine professional field (default to computer-science for backward compatibility)
    let professionalField: ProfessionalField = 'computer-science';
    if (resumeAnalysis?.professionalField) {
      professionalField = resumeAnalysis.professionalField;
    } else if (targetCompanies && targetCompanies.length > 0 && targetCompanies[0].industry) {
      professionalField = targetCompanies[0].industry;
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
              content: `Create a personalized LEVELED career roadmap for a candidate targeting positions at the following companies: ${companiesForRoadmap.map((c: TargetCompany) => `${c.name} (${c.position})`).join(', ')} within the next 1-2 years.

IMPORTANT: This roadmap uses a PROGRESSIVE LEVELING SYSTEM where milestones are organized into levels that build upon each other. Include both SKILL DEVELOPMENT milestones and CAREER PROGRESSION milestones with appropriate level assignments.

LEVELING SYSTEM REQUIREMENTS:
- Assign each milestone an appropriate LEVEL (1-10) based on difficulty and prerequisites
- Lower level milestones (1-3) should focus on fundamentals and entry-level skills
- Mid level milestones (4-6) should build practical application and specialization
- Higher level milestones (7-10) should emphasize leadership, expertise, and advanced skills

Return a structured JSON roadmap with these components:
{
  "milestones": [
    {
      "id": "${uuidv4()}",
      "title": "Milestone name",
      "description": "Detailed description with actionable steps",
      "category": "technical|fundamental|niche|soft|career",
      "subcategory": "Optional specific classification",
      "skills": ["skill1", "skill2"],
      "timeframe": "1-3 months",
      "completed": false,
      "difficulty": 1-5,
      "priority": "low|medium|high|critical",
      "estimatedHours": 40,
      "level": 2,
      "successCriteria": ["criterion1", "criterion2"],
      "attributes": {
        "career": {
          "positionLevel": "entry-level|junior|mid-level|senior|lead|principal|executive",
          "targetRole": "Specific job title",
          "experienceRequired": "1-2 years",
          "keyResponsibilities": ["responsibility1", "responsibility2"],
          "advancement_path": {
            "toRole": "Next career step",
            "timeInRole": "12-18 months",
            "promotionCriteria": ["criteria1", "criteria2"]
          },
          "skillRequirements": {
            "technical": ["skill1", "skill2"],
            "soft": ["skill1", "skill2"]
          },
          "compensation": {
            "salaryRange": "$60k-80k",
            "growthPotential": "Strong upward trajectory"
          },
          "applicationStrategy": {
            "whereToApply": ["Company types or specific companies"],
            "networking": ["strategy1", "strategy2"],
            "portfolioNeeds": ["requirement1", "requirement2"]
          },
          "experienceBuilding": {
            "projectTypes": ["type1", "type2"],
            "certifications": ["cert1", "cert2"]
          },
          "careerImpact": "stepping-stone|destination|specialization|leadership-track",
          "marketDemand": "high|medium|low"
        }
      },
      "resources": [
        {
          "title": "Actual resource title (e.g., 'React - The Complete Guide' on Udemy)",
          "url": "https://actual-url.com (MUST be a real, working URL)",
          "type": "course|book|project|article|documentation|certification|video|tutorial|tool",
          "estimatedTime": "2 weeks",
          "cost": "free|paid|freemium",
          "description": "Brief description of what this resource covers"
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

MILESTONE CATEGORIES:
- "technical": Programming, software development, frameworks, databases, APIs, coding projects
- "fundamental": Problem-solving, system design, architecture, debugging, testing, core concepts
- "niche": Specialized technologies like blockchain, AI/ML, AR/VR, IoT, emerging technologies
- "soft": Communication, leadership, teamwork, emotional intelligence, time management, networking
- "career": INTERMEDIATE POSITIONS and work experience opportunities (NEW FOCUS AREA)

CAREER PROGRESSION STRATEGY:
For each target company/position, identify 2-3 intermediate positions that would build relevant experience:

Example Career Progression Path for "Google - Senior Software Engineer":
1. Junior Software Developer (6-12 months experience building)
2. Software Developer (1-2 years gaining mid-level experience) 
3. Senior Software Developer (2-3 years developing leadership skills)
4. Target: Senior Software Engineer at Google

For career milestones, focus on:
- Realistic stepping stone positions 
- Required experience and responsibilities for each role
- Skills needed to excel in that position
- How to find and apply for these roles
- Networking strategies specific to each career level
- Portfolio and project requirements
- Advancement criteria to move to the next level

Include career milestones that cover:
- Entry-level positions for gaining initial experience
- Mid-level roles for developing expertise
- Leadership opportunities for building management skills
- Industry-specific experience building
- Company culture preparation
- Interview and application strategies for each level

Balance the roadmap with both skill development AND career progression milestones.

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
- LEVEL ASSIGNMENT: Distribute milestones across levels 1-6 with logical progression
  * Level 1-2: Foundation skills, basic concepts
  * Level 3-4: Applied skills, intermediate projects
  * Level 5-6: Advanced skills, leadership, specialization
- Include exactly 3 specific resources per milestone
- Add 1-3 tasks per milestone for progress tracking
- Include success criteria for each milestone
- Estimate hours required (20-100 hours per milestone)
- Set appropriate difficulty (1-5) and priority levels
- Ensure level progression feels rewarding and logical
- Resources should be high-quality, free or low-cost, and directly relevant
- Prefer official documentation and well-known learning platforms
- CRITICAL: All resources must be real, verified, and from reputable sources
- Return ONLY valid JSON with no additional text or formatting

RESOURCE GENERATION REQUIREMENTS:
1. ONLY provide REAL, WORKING URLs to actual online resources
2. Each resource URL must be:
   - A real website that exists (e.g., https://www.coursera.org/learn/react-basics)
   - From reputable sources like:
     * Coursera, Udemy, edX, Pluralsight, LinkedIn Learning
     * Official documentation (React.dev, Angular.io, etc.)
     * GitHub repositories with learning materials
     * YouTube channels (freeCodeCamp, Traversy Media, etc.)
     * Books on O'Reilly, Amazon, or publisher sites
     * MDN Web Docs, W3Schools, Stack Overflow Documentation
     * Medium articles, Dev.to posts (with actual article URLs)
3. Resource examples by type:
   - course: "https://www.coursera.org/learn/machine-learning"
   - documentation: "https://react.dev/learn"
   - video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   - book: "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882"
   - project: "https://github.com/florinpop17/app-ideas"
   - article: "https://medium.com/@author/article-title-12345"
   - tutorial: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"
4. Include a mix of resource types for each milestone
5. Prioritize free resources, but include paid options when they offer significant value
6. Ensure URLs are properly formatted and complete (not shortened or relative)
7. Add descriptive titles that match the actual resource`
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
      
      // Ensure each milestone has a unique ID and add required fields
      milestones = parsedResponse.milestones.map((milestone: any) => ({
        ...milestone,
        id: milestone.id || uuidv4(),
        completed: false, // Always start with uncompleted milestones for new roadmap
        professionalField,
        // Ensure level is present (fallback if AI didn't provide it)
        level: milestone.level || 1
      }));
      
      // Validate level progression
      milestones = milestones.sort((a: any, b: any) => a.level - b.level);
      debug.log('Milestones sorted by level:', milestones.map((m: any) => `${m.title} (Level ${m.level})`));
      
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
          openaiTime: Math.round(openaiDuration),
          milestonesCount: milestones.length
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

// Helper function to add level to milestone
function enhanceMilestoneWithLevel(milestone: any, index: number): Milestone {
  const level = Math.min(index + 1, 6); // Simple level assignment based on order
  
  return {
    ...milestone,
    level
  };
}

// Helper function to create fallback milestones when OpenAI fails
function createFallbackMilestones(resumeAnalysis: ResumeAnalysis, professionalField: ProfessionalField = 'computer-science'): Milestone[] {
  const baseMilestones = [
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
          title: "JavaScript Algorithms and Data Structures",
          url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
          type: "course",
          estimatedTime: "4 weeks",
          cost: "free",
          description: "Interactive coding challenges covering fundamental JavaScript concepts"
        },
        {
          title: "The Odin Project - Full Stack JavaScript",
          url: "https://www.theodinproject.com/paths/full-stack-javascript",
          type: "tutorial",
          estimatedTime: "3 months",
          cost: "free",
          description: "Comprehensive curriculum for learning full-stack web development"
        },
        {
          title: "Build 30 JavaScript Projects in 30 Days",
          url: "https://javascript30.com/",
          type: "project",
          estimatedTime: "30 days",
          cost: "free",
          description: "Hands-on JavaScript projects to build practical skills"
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
          title: "System Design Primer - Complete Guide",
          url: "https://github.com/donnemartin/system-design-primer",
          type: "documentation",
          estimatedTime: "6 weeks",
          cost: "free",
          description: "Learn how to design large-scale systems with examples from real companies"
        },
        {
          title: "Designing Data-Intensive Applications",
          url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/",
          type: "book",
          estimatedTime: "8 weeks",
          cost: "paid",
          description: "The big ideas behind reliable, scalable, and maintainable systems"
        },
        {
          title: "Grokking System Design Interview",
          url: "https://www.educative.io/courses/grokking-the-system-design-interview",
          type: "course",
          estimatedTime: "4 weeks",
          cost: "paid",
          description: "Learn system design through practical examples and case studies"
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
          title: "Improving Communication Skills",
          url: "https://www.coursera.org/learn/wharton-communication-skills",
          type: "course",
          estimatedTime: "4 weeks",
          cost: "free",
          description: "University of Pennsylvania course on business communication"
        },
        {
          title: "How to Speak by Patrick Winston",
          url: "https://www.youtube.com/watch?v=Unzc731iCUY",
          type: "video",
          estimatedTime: "1 hour",
          cost: "free",
          description: "MIT lecture on effective speaking and presentation skills"
        },
        {
          title: "Crucial Conversations: Tools for Talking When Stakes Are High",
          url: "https://www.amazon.com/Crucial-Conversations-Talking-Stakes-Second/dp/1260474186",
          type: "book",
          estimatedTime: "2 weeks",
          cost: "paid",
          description: "Master the art of dialogue in high-stakes situations"
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
    },
    {
      id: uuidv4(),
      professionalField,
      title: "Develop Effective Presentation Skills",
      description: "Develop skills to effectively communicate and present information",
      category: "soft" as const,
      subcategory: "leadership-communication",
      skills: ["Communication", "Leadership", "Presentation Skills"],
      timeframe: "2-4 months",
      completed: false,
      difficulty: 3 as const,
      priority: "high" as const,
      estimatedHours: 40,
      attributes: {
        soft: {
          skillCategory: "leadership",
          developmentMethod: "practice-based",
          applicationScenarios: ["Public speaking", "Meeting presentations", "Client interactions"],
          roleRelevance: "team-lead",
          assessmentDifficulty: "somewhat-subjective",
          measurementMethods: ["360-feedback", "peer-review"],
          behavioralMarkers: [
            {
              indicator: "Leads meetings effectively",
              frequency: "weekly"
            },
            {
              indicator: "Provides clear presentations",
              frequency: "daily"
            }
          ],
          developmentTimeframe: "months",
          improvementPattern: "continuous"
        }
      },
      resources: [
        {
          title: "Presentation Skills Course",
          url: "https://www.coursera.org/learn/presentation-skills",
          type: "course",
          estimatedTime: "6 weeks",
          cost: "freemium"
        },
        {
          title: "Leadership and Presentation Skills",
          url: "https://www.linkedin.com/learning/leadership-and-presentation-skills",
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
          description: "Complete presentation skills course",
          completed: false
        },
        {
          id: "task-2",
          description: "Practice public speaking",
          completed: false
        },
        {
          id: "task-3",
          description: "Lead a team presentation",
          completed: false
        }
      ],
      successCriteria: [
        "Develop effective presentation skills",
        "Build professional network",
        "Complete leadership assessment"
      ]
    },
    // NEW: Career Progression Milestone
    {
      id: uuidv4(),
      professionalField,
      title: "Secure Junior Developer Position",
      description: "Land an entry-level software development role to gain professional experience and build a foundation for career advancement",
      category: "career" as const,
      subcategory: "entry-level-position",
      skills: ["Professional Development", "Job Search", "Interview Skills", "Portfolio Building"],
      timeframe: "2-4 months",
      completed: false,
      difficulty: 3 as const,
      priority: "high" as const,
      estimatedHours: 60,
      attributes: {
        career: {
          positionLevel: "entry-level",
          targetRole: "Junior Software Developer",
          experienceRequired: "0-1 years",
          keyResponsibilities: [
            "Write and maintain clean, efficient code",
            "Collaborate with team members on projects", 
            "Participate in code reviews",
            "Learn company technologies and processes"
          ],
          advancement_path: {
            toRole: "Software Developer",
            timeInRole: "12-18 months",
            promotionCriteria: [
              "Demonstrate proficiency in core technologies",
              "Complete projects independently",
              "Show ability to mentor newer team members"
            ]
          },
          skillRequirements: {
            technical: ["JavaScript", "React", "Git", "Basic algorithms"],
            soft: ["Communication", "Teamwork", "Problem-solving", "Time management"]
          },
          compensation: {
            salaryRange: "$50k-70k",
            growthPotential: "Strong potential for rapid advancement with demonstrated skills"
          },
          applicationStrategy: {
            whereToApply: ["Tech startups", "Mid-size companies", "Junior-friendly organizations"],
            networking: [
              "Attend local developer meetups",
              "Connect with developers on LinkedIn",
              "Participate in coding communities"
            ],
            portfolioNeeds: [
              "2-3 well-documented projects",
              "Clean GitHub profile",
              "Professional website/portfolio"
            ],
            interviewPrep: [
              "Practice coding problems on LeetCode",
              "Review common behavioral interview questions",
              "Prepare project presentations"
            ]
          },
          experienceBuilding: {
            projectTypes: ["Web applications", "API integrations", "Open source contributions"],
            certifications: ["JavaScript fundamentals", "React certification"]
          },
          industryExperience: {
            sectors: ["Technology", "Software Development"],
            domainKnowledge: ["Web development", "Frontend technologies", "Version control"]
          },
          successMetrics: [
            "Successfully complete assigned tasks",
            "Receive positive performance feedback",
            "Build professional relationships"
          ],
          careerImpact: "stepping-stone",
          marketDemand: "high",
          competitionLevel: "moderate"
        }
      },
      resources: [
        {
          title: "How to Land Your First Developer Job",
          url: "https://example.com/first-dev-job",
          type: "article",
          estimatedTime: "1 hour",
          cost: "free"
        },
        {
          title: "Junior Developer Interview Preparation",
          url: "https://example.com/interview-prep",
          type: "course",
          estimatedTime: "2 weeks",
          cost: "freemium"
        }
      ],
      tasks: [
        {
          id: "task-1",
          description: "Update resume with technical projects",
          completed: false
        },
        {
          id: "task-2", 
          description: "Apply to 5 junior developer positions",
          completed: false
        },
        {
          id: "task-3",
          description: "Practice technical interview questions",
          completed: false
        }
      ],
      successCriteria: [
        "Receive interview invitations",
        "Successfully complete technical interviews",
        "Secure job offer for junior developer role"
      ]
    }
  ];

  // Enhance all milestones with level assignments
  return baseMilestones.map((milestone, index) => enhanceMilestoneWithLevel(milestone, index));
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