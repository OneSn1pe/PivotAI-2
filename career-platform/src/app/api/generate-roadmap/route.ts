import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore } from 'firebase/firestore';
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
          Target Companies: ${JSON.stringify(targetCompanies)}`
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