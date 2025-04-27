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
          content: "You are a career development expert. Generate a personalized career roadmap based on resume analysis and target companies. Return ONLY valid JSON with a 'milestones' array."
        },
        {
          role: "user",
          content: `Create a career roadmap with 5 milestones to help this candidate achieve their career goals with their target companies.
          
          Return the roadmap as a JSON object containing an array of milestone objects with the following structure:
          {
            "milestones": [
              {
                "id": "unique-id-1",
                "title": "Milestone Title",
                "description": "Detailed description",
                "skills": ["Skill 1", "Skill 2"],
                "timeframe": "3-6 months",
                "completed": false
              },
              ...
            ]
          }
          
          Remember to: 
          1. Generate exactly 5 milestones
          2. Include realistic skills needed for each milestone
          3. Create a logical progression toward the target positions
          4. Each milestone must have its own unique ID
          5. Return ONLY the JSON object with no additional text
          
          Resume Analysis: ${JSON.stringify(resumeAnalysis)}
          Target Companies: ${JSON.stringify(companiesForRoadmap)}`
        }
      ]
    });

    // Parse the milestones from the OpenAI response
    let milestones;
    try {
      // Try to parse the JSON response
      const responseContent = completion.choices[0].message.content || '{}';
      const parsedResponse = JSON.parse(responseContent);
      
      // Check if the response has the expected milestones array
      if (parsedResponse.milestones && Array.isArray(parsedResponse.milestones)) {
        milestones = parsedResponse.milestones;
      } else {
        // If the structure is wrong, throw an error to trigger fallback
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      
      // Fallback: generate synthetic milestones
      milestones = [
        {
          id: uuidv4(),
          title: "Skill Development",
          description: "Focus on developing core skills needed for target roles",
          skills: resumeAnalysis.skills.slice(0, 3),
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
    
    // Create roadmap document
    const roadmap: CareerRoadmap = {
      id: uuidv4(),
      candidateId,
      milestones,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
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