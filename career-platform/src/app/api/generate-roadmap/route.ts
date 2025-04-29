import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone } from '@/types/user';

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to generate a single milestone
async function generateMilestone(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[],
  milestoneNumber: number,
  totalMilestones: number
): Promise<Milestone> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a senior technical recruiter at ${targetCompanies.map(c => c.name).join(' and ')}. Generate a single milestone for a career roadmap based on the candidate's resume analysis.`
      },
      {
        role: "user",
        content: `Generate milestone ${milestoneNumber} of ${totalMilestones} with this structure:
        {
          "id": "unique-id",
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
        
        Requirements:
        - Raw JSON only, no formatting
        - Build upon existing skills: ${JSON.stringify(resumeAnalysis.skills)}
        - Address weaknesses: ${JSON.stringify(resumeAnalysis.weaknesses)}
        - Leverage strengths: ${JSON.stringify(resumeAnalysis.strengths)}
        - Follow recommendations: ${JSON.stringify(resumeAnalysis.recommendations)}
        - Include 2-3 specific resources
        - Resources should be high-quality, free or low-cost
        - Consider the target companies and positions: ${JSON.stringify(targetCompanies)}
        - Current Experience: ${JSON.stringify(resumeAnalysis.experience)}
        - Education: ${JSON.stringify(resumeAnalysis.education)}`
      }
    ]
  });

  const responseContent = completion.choices[0].message.content || '{}';
  const milestone = JSON.parse(responseContent);
  milestone.id = uuidv4();
  return milestone;
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    const { resumeAnalysis, targetCompanies, candidateId } = await request.json();

    if (!candidateId) {
      throw new Error('candidateId is required to generate a roadmap');
    }

    let companiesForRoadmap = targetCompanies;

    if (!companiesForRoadmap || companiesForRoadmap.length === 0) {
      if (!candidateId) {
        throw new Error('Cannot generate roadmap: No target companies provided and no candidateId to fetch them');
      }
      
      const userDoc = await getDoc(doc(db as Firestore, 'users', candidateId));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      companiesForRoadmap = userData.targetCompanies || [];
      
      if (companiesForRoadmap.length === 0) {
        companiesForRoadmap = [{ name: 'Tech Company', position: 'Software Developer' }];
      }
    }

    // Create initial roadmap document
    const roadmapId = uuidv4();
    const roadmap: CareerRoadmap = {
      id: roadmapId,
      candidateId: candidateId.toString(),
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store initial roadmap in Firestore
    await addDoc(collection(db as Firestore, 'roadmaps'), roadmap);

    // Generate milestones one by one
    const totalMilestones = 5;
    const milestones: Milestone[] = [];

    for (let i = 1; i <= totalMilestones; i++) {
      try {
        const milestone = await generateMilestone(
          resumeAnalysis,
          companiesForRoadmap,
          i,
          totalMilestones
        );
        
        milestones.push(milestone);
        
        // Update the roadmap with the new milestone
        await updateDoc(doc(db as Firestore, 'roadmaps', roadmapId), {
          milestones,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error(`Error generating milestone ${i}:`, error);
        // Continue with next milestone even if one fails
      }
    }

    // Return the final roadmap
    return NextResponse.json({
      ...roadmap,
      milestones,
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}