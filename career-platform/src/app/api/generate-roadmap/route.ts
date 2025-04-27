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
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a career development expert. Generate a personalized career roadmap based on resume analysis and target companies."
        },
        {
          role: "user",
          content: `Create a career roadmap with 5 milestones to help this candidate achieve their career goals with their target companies.
          
          Return the roadmap as a JSON array of milestone objects with the following structure:
          - id (string): UUID
          - title (string): Title of the milestone
          - description (string): Detailed description
          - skills (array of strings): Skills to acquire
          - timeframe (string): Expected timeframe (e.g., "3-6 months")
          - completed (boolean): Always false for new milestones
          
          Resume Analysis: ${JSON.stringify(resumeAnalysis)}
          Target Companies: ${JSON.stringify(companiesForRoadmap)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the milestones from the OpenAI response
    const milestones = JSON.parse(completion.choices[0].message.content || '[]').milestones;
    
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