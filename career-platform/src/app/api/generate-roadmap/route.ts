import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone } from '@/types/user';

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
          content: `You are a senior technical recruiter at ${companiesForRoadmap.map((c: TargetCompany) => c.name).join(' and ')}. Generate a personalized career roadmap based on the candidate's resume analysis and your insider knowledge of what these companies look for in candidates. Return ONLY a valid JSON object with a 'milestones' array. Each milestone should reflect the actual hiring criteria and career progression paths at these companies.`
        },
        {
          role: "user",
          content: `Create a 5-milestone career roadmap with this structure:
          {
            "milestones": [
              {
                "id": "unique-id-1",
                "title": "Milestone Title",
                "description": "Detailed description from a recruiter's perspective",
                "skills": ["Skill 1", "Skill 2"],
                "timeframe": "3-6 months",
                "completed": false,
                "resources": [
                  {
                    "title": "Resource Title",
                    "url": "https://example.com/resource",
                    "type": "article"
                  }
                ]
              }
            ]
          }
          
          Requirements:
          - Raw JSON only, no formatting
          - 5 milestones total
          - Each milestone needs unique ID
          - Build upon existing skills: ${JSON.stringify(resumeAnalysis.skills)}
          - Address weaknesses: ${JSON.stringify(resumeAnalysis.weaknesses)}
          - Leverage strengths: ${JSON.stringify(resumeAnalysis.strengths)}
          - Follow recommendations: ${JSON.stringify(resumeAnalysis.recommendations)}
          - Include 2-3 specific resources per milestone
          - Resources should be high-quality, free or low-cost, and directly relevant to the milestone
          - Resource types can be: article, video, course, book, or documentation
          - Prefer official documentation and well-known learning platforms
          
          Target Companies and Positions:
          ${JSON.stringify(companiesForRoadmap.map((c: TargetCompany) => ({
            company: c.name,
            position: c.position
          })))}
          
          Current Experience: ${JSON.stringify(resumeAnalysis.experience)}
          Education: ${JSON.stringify(resumeAnalysis.education)}
          
          As a recruiter at these companies, create milestones that:
          1. Align with actual hiring criteria and interview processes
          2. Focus on skills and experiences that would make the candidate stand out
          3. Include specific technical and soft skills we look for
          4. Consider the typical career progression paths at these companies
          5. Address any gaps between current skills and target position requirements
          6. Include specific learning resources that would help achieve each milestone`
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
      
      // Fallback: generate synthetic milestones
      milestones = [
        {
          id: uuidv4(),
          title: "Skill Development",
          description: "Focus on developing core skills needed for target roles",
          skills: resumeAnalysis?.skills?.slice(0, 3) || ["Technical Skills", "Communication", "Problem Solving"],
          timeframe: "1-3 months",
          completed: false
        },
        {
          id: uuidv4(),
          title: "Portfolio Building",
          description: "Create portfolio showcasing your abilities",
          skills: ["Project Management", "Documentation"],
          timeframe: "2-4 months",
          completed: false
        },
        {
          id: uuidv4(),
          title: "Networking",
          description: "Expand professional network in target industry",
          skills: ["Communication", "Networking"],
          timeframe: "3-6 months",
          completed: false
        },
        {
          id: uuidv4(),
          title: "Interview Preparation",
          description: "Prepare for interviews at target companies",
          skills: ["Interview Skills", "Technical Knowledge"],
          timeframe: "1-2 months",
          completed: false
        },
        {
          id: uuidv4(),
          title: "Application Submission",
          description: "Apply to target positions with customized materials",
          skills: ["Resume Writing", "Cover Letter Writing"],
          timeframe: "1-2 months",
          completed: false
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
    
    // Store in Firestore as a subcollection under the user's document
    await addDoc(collection(db as Firestore, `users/${candidateId}/roadmaps`), roadmap);
    
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}