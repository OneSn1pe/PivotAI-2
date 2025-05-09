import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
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

    // Check if a roadmap already exists for this candidate
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    // Delete all existing roadmaps for this candidate
    if (!roadmapSnapshot.empty) {
      console.log(`Deleting ${roadmapSnapshot.size} existing roadmaps for candidateId:`, candidateId);
      
      const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
        deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
      );
      
      await Promise.all(deletePromises);
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
    const docRef = await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);
    roadmap.id = docRef.id; // Ensure we return the document ID from Firestore
    
    console.log('Created new roadmap for candidateId:', candidateId);
    
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}