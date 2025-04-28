import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone, ResourceLink } from '@/types/user';

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert career coach with deep knowledge of industry-specific skill requirements, 
          hiring practices, and professional development. Generate a highly personalized career roadmap
          based on the candidate's resume analysis and target companies.
          
          Your response MUST be a valid JSON object with ONLY a 'milestones' array. DO NOT include any explanations, 
          markdown formatting (like \`\`\`json), or additional text before or after the JSON.`
        },
        {
          role: "user",
          content: `Create a detailed career roadmap with 5 milestones to help this candidate achieve their career goals
          with their target companies. The roadmap must be highly personalized based on:

          1. The candidate's current skills, experience, education, strengths, and weaknesses
          2. The specific requirements of their target companies and positions
          3. Industry-standard career progression paths
          
          Return the roadmap as a plain JSON object containing an array of milestone objects with the following structure:
          {
            "milestones": [
              {
                "id": "unique-id-1",
                "title": "Milestone Title",
                "description": "Detailed description of the milestone and its importance",
                "skills": ["Specific Skill 1", "Specific Skill 2"],
                "timeframe": "3-6 months",
                "completed": false,
                "resources": [
                  {
                    "title": "Resource Name",
                    "url": "https://example.com/resource",
                    "type": "course", // One of: course, article, video, book, tool, community, other
                    "description": "Brief description of this resource"
                  }
                ],
                "actionItems": [
                  "Specific action 1 the candidate should take",
                  "Specific action 2 the candidate should take"
                ],
                "companySpecificNotes": "How this milestone specifically helps with target companies"
              },
              ...
            ]
          }
          
          IMPORTANT GUIDELINES:
          1. Include 3-5 SPECIFIC resources for each milestone (courses, articles, tools, etc.) with REAL, WORKING URLs
          2. Resources must be highly relevant to the candidate's target position and current skill gaps
          3. Each milestone should have 3-5 concrete, actionable items
          4. Provide company-specific advice for each milestone related to their target companies
          5. Create a logical progression toward the target positions based on the candidate's current skills
          6. Each milestone must have its own unique ID
          7. Ensure all URLs point to real, existing resources
          
          Resume Analysis: ${JSON.stringify(resumeAnalysis)}
          Target Companies: ${JSON.stringify(companiesForRoadmap)}`
        }
      ]
    });

    // Parse the milestones from the OpenAI response
    let milestones;
    try {
      // Get the raw response content
      const responseContent = completion.choices[0].message.content || '{}';
      
      // Clean up the response content by removing any markdown formatting
      let cleanedContent = responseContent.trim();
      
      // Remove markdown code block formatting if present
      if (cleanedContent.startsWith('```')) {
        // Find the first and last occurrence of code block markers
        const firstBlockEnd = cleanedContent.indexOf('\n');
        let lastBlockStart = cleanedContent.lastIndexOf('```');
        
        // Extract only the content between the markers
        if (firstBlockEnd !== -1 && lastBlockStart !== -1 && lastBlockStart > firstBlockEnd) {
          cleanedContent = cleanedContent.substring(firstBlockEnd + 1, lastBlockStart).trim();
        } else if (firstBlockEnd !== -1) {
          cleanedContent = cleanedContent.substring(firstBlockEnd + 1).trim();
        }
      }
      
      console.log('Cleaned content for parsing:', cleanedContent.substring(0, 100) + '...');
      
      // Try to parse the cleaned JSON response
      const parsedResponse = JSON.parse(cleanedContent);
      
      // Check if the response has the expected milestones array
      if (parsedResponse.milestones && Array.isArray(parsedResponse.milestones)) {
        milestones = parsedResponse.milestones;
      } else {
        // If the structure is wrong, throw an error to trigger fallback
        throw new Error('Invalid response structure - missing milestones array');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response content:', completion.choices[0].message.content?.substring(0, 200) + '...');
      
      // Fallback: generate synthetic milestones with enhanced fields
      milestones = [
        {
          id: uuidv4(),
          title: "Skill Development",
          description: "Focus on developing core skills needed for target roles based on your current skill gaps.",
          skills: resumeAnalysis?.skills?.slice(0, 3) || ["Technical Skills", "Communication", "Problem Solving"],
          timeframe: "1-3 months",
          completed: false,
          resources: [
            {
              title: "LinkedIn Learning",
              url: "https://www.linkedin.com/learning/",
              type: "course",
              description: "Platform with courses on various professional skills"
            },
            {
              title: "Coursera",
              url: "https://www.coursera.org/",
              type: "course",
              description: "Online courses from top universities"
            }
          ],
          actionItems: [
            "Identify top 3 skill gaps based on job descriptions",
            "Complete at least one course on a priority skill",
            "Practice skills with real-world projects"
          ],
          companySpecificNotes: "Focus on skills frequently mentioned in target company job postings."
        },
        {
          id: uuidv4(),
          title: "Portfolio Building",
          description: "Create a professional portfolio showcasing your abilities relevant to target positions.",
          skills: ["Project Management", "Documentation", "Web Development"],
          timeframe: "2-4 months",
          completed: false,
          resources: [
            {
              title: "GitHub Pages",
              url: "https://pages.github.com/",
              type: "tool",
              description: "Free hosting for your portfolio"
            },
            {
              title: "Portfolio Examples",
              url: "https://www.freecodecamp.org/news/15-web-developer-portfolios-to-inspire-you-137fb1743cae/",
              type: "article",
              description: "Examples of strong portfolios"
            }
          ],
          actionItems: [
            "Select 3-5 best projects to highlight",
            "Create case studies for each project",
            "Ensure portfolio is mobile-responsive"
          ],
          companySpecificNotes: "Research what your target companies value in portfolios."
        },
        {
          id: uuidv4(),
          title: "Networking",
          description: "Expand your professional network in the target industry to increase visibility and opportunities.",
          skills: ["Communication", "Networking", "Personal Branding"],
          timeframe: "3-6 months",
          completed: false,
          resources: [
            {
              title: "LinkedIn Network Building",
              url: "https://www.linkedin.com/business/sales/blog/profile-best-practices/17-steps-to-a-better-linkedin-profile-in-2017",
              type: "article",
              description: "Guide to optimizing LinkedIn profile"
            },
            {
              title: "Meetup",
              url: "https://www.meetup.com/",
              type: "community",
              description: "Find local professional events"
            }
          ],
          actionItems: [
            "Connect with 5-10 professionals at target companies",
            "Attend at least 2 industry events or meetups",
            "Engage regularly on LinkedIn with industry content"
          ],
          companySpecificNotes: "Follow your target companies on social media and engage with their content."
        },
        {
          id: uuidv4(),
          title: "Interview Preparation",
          description: "Prepare thoroughly for interviews at target companies with research and practice.",
          skills: ["Interview Skills", "Technical Knowledge", "Problem Solving"],
          timeframe: "1-2 months",
          completed: false,
          resources: [
            {
              title: "Glassdoor",
              url: "https://www.glassdoor.com/index.htm",
              type: "tool",
              description: "Research company interview questions"
            },
            {
              title: "Pramp",
              url: "https://www.pramp.com/",
              type: "tool",
              description: "Practice technical interviews"
            }
          ],
          actionItems: [
            "Research common interview questions for target roles",
            "Practice responses to behavioral questions",
            "Complete at least 5 mock interviews"
          ],
          companySpecificNotes: "Research interview processes at each target company and prepare accordingly."
        },
        {
          id: uuidv4(),
          title: "Application Submission",
          description: "Apply to target positions with customized materials that highlight your fit.",
          skills: ["Resume Writing", "Cover Letter Writing", "Job Search Strategy"],
          timeframe: "1-2 months",
          completed: false,
          resources: [
            {
              title: "Resume Worded",
              url: "https://resumeworded.com/",
              type: "tool",
              description: "AI-powered resume feedback"
            },
            {
              title: "JobScan",
              url: "https://www.jobscan.co/",
              type: "tool",
              description: "Optimize resume for ATS systems"
            }
          ],
          actionItems: [
            "Tailor resume for each application",
            "Write customized cover letters",
            "Follow up on applications after 1-2 weeks"
          ],
          companySpecificNotes: "Highlight experiences and skills most relevant to each company's values and needs."
        }
      ];
    }
    
    // Create roadmap document with validated candidateId
    const roadmap: CareerRoadmap = {
      id: uuidv4(),
      candidateId: candidateId.toString(), // Ensure candidateId is a string
      milestones,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Log the roadmap data before storing to debug
    console.log('Storing roadmap with candidateId:', candidateId);
    
    // Store in Firestore
    await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);
    
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}