import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/firebase';
import { collection, addDoc, Firestore, getDoc, doc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ResumeAnalysis, TargetCompany, CareerRoadmap, Milestone, PositionPreferences, UserRole } from '@/types/user';

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
    if (!Array.isArray(companiesForRoadmap) || companiesForRoadmap.length === 0) {
      // If no companies specified, create a generic roadmap
      companiesForRoadmap = [{ 
        name: "Your Dream Company", 
        position: "Your Target Role"
      }];
    }
    
    // Fetch recruiter position preferences for each target company
    const positionPreferencesMap = await fetchPositionPreferences(companiesForRoadmap);
    
    console.log('Found position preferences for', Object.keys(positionPreferencesMap).length, 'companies');
    
    // Start building the prompt
    let prompt = `Based on the resume analysis and target companies below, create a personalized career roadmap with 5-7 milestone steps. Each milestone should be specific, actionable, and tailored to the candidate's skills and target positions.

RESUME ANALYSIS:
Skills: ${resumeAnalysis?.skills?.join(', ') || 'Not provided'}
Experience: ${resumeAnalysis?.experience?.join('; ') || 'Not provided'}
Education: ${resumeAnalysis?.education?.join('; ') || 'Not provided'}
Strengths: ${resumeAnalysis?.strengths?.join(', ') || 'Not provided'}
Areas for Improvement: ${resumeAnalysis?.weaknesses?.join(', ') || 'Not provided'}
`;

    // Add target companies information to prompt
    prompt += `\n\nTARGET POSITIONS:`;
    
    companiesForRoadmap.forEach((company: any, index: number) => {
      prompt += `\n${index + 1}. ${company.name} - ${company.position}`;
      
      // Add position preferences if available
      const preferences = positionPreferencesMap[`${company.name}:${company.position}`];
      if (preferences) {
        prompt += `\n   Position Details:`;
        prompt += `\n   - Description: ${preferences.description}`;
        prompt += `\n   - Required Skills: ${preferences.requiredSkills.join(', ')}`;
        
        if (preferences.preferredSkills && preferences.preferredSkills.length > 0) {
          prompt += `\n   - Preferred Skills: ${preferences.preferredSkills.join(', ')}`;
        }
        
        if (preferences.careerPath && preferences.careerPath.length > 0) {
          prompt += `\n   - Career Path: ${preferences.careerPath.join(' → ')}`;
        }
        
        if (preferences.learningResources && preferences.learningResources.length > 0) {
          prompt += `\n   - Learning Resources: ${preferences.learningResources.slice(0, 3).join(', ')}${preferences.learningResources.length > 3 ? '...' : ''}`;
        }
      }
    });
    
    // Conclude the prompt with instructions for output format
    prompt += `\n
OUTPUT FORMAT:
Provide a JSON array of milestone objects with the following structure:
[
  {
    "title": "Milestone title",
    "description": "Detailed description of what to accomplish",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "timeframe": "Estimated time to complete this milestone",
    "completed": false
  },
  ...
]

NOTE:
1. Include specific skills to develop for each milestone
2. Be realistic about timeframes
3. Follow a logical progression towards the target position(s)
4. Focus on addressing any skill gaps mentioned in the resume analysis
5. Create milestones that have clear completion criteria`;

    console.log('Sending prompt to OpenAI:', prompt.substring(0, 200) + '...');

    const milestoneCount = Math.min(
      7,  // Max milestones
      3 + Math.floor(companiesForRoadmap.length * 1.5)  // Base + additional for multiple companies
    );

    // Generate response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a career coach AI specializing in creating personalized career roadmaps. Generate a roadmap with ${milestoneCount} milestones that will guide someone from their current skills to their target position(s). Focus on addressing skill gaps and following a logical career progression.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Process OpenAI response
    const content = completion.choices[0].message.content || '';
    console.log('Received response from OpenAI:', content.substring(0, 100) + '...');

    // Extract JSON array from response
    let milestones: Milestone[] = [];
    try {
      // Find JSON array in the response - without using 's' flag
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const parsedMilestones = JSON.parse(jsonString);
        
        // Validate and format each milestone
        milestones = parsedMilestones.map((milestone: any) => ({
          id: uuidv4(),
          title: milestone.title || 'Untitled Milestone',
          description: milestone.description || '',
          skills: Array.isArray(milestone.skills) ? milestone.skills : [],
          timeframe: milestone.timeframe || '1-3 months',
          completed: false,
          resources: milestone.resources || [] // Add empty resources array if not provided
        }));
      } else {
        throw new Error('No JSON array found in the response');
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
          completed: false,
          resources: []
        },
        {
          id: uuidv4(),
          title: "Portfolio Building",
          description: "Create portfolio showcasing your abilities",
          skills: ["Project Management", "Documentation"],
          timeframe: "2-4 months",
          completed: false,
          resources: []
        },
        {
          id: uuidv4(),
          title: "Networking",
          description: "Expand professional network in target industry",
          skills: ["Communication", "Networking"],
          timeframe: "3-6 months",
          completed: false,
          resources: []
        },
        {
          id: uuidv4(),
          title: "Interview Preparation",
          description: "Prepare for interviews at target companies",
          skills: ["Interview Skills", "Technical Knowledge"],
          timeframe: "1-2 months",
          completed: false,
          resources: []
        },
        {
          id: uuidv4(),
          title: "Application Submission",
          description: "Apply to target positions with customized materials",
          skills: ["Resume Writing", "Cover Letter Writing"],
          timeframe: "1-2 months",
          completed: false,
          resources: []
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

/**
 * Fetch position preferences from recruiters for each target company
 */
async function fetchPositionPreferences(targetCompanies: TargetCompany[]): Promise<Record<string, PositionPreferences>> {
  const result: Record<string, PositionPreferences> = {};
  
  try {
    // Get all recruiters
    const recruitersQuery = query(
      collection(db as Firestore, 'users'),
      where('role', '==', UserRole.RECRUITER)
    );
    
    const recruitersSnapshot = await getDocs(recruitersQuery);
    
    if (recruitersSnapshot.empty) {
      console.log('No recruiters found');
      return result;
    }
    
    console.log(`Found ${recruitersSnapshot.size} recruiters`);
    
    // Process each recruiter to find matching position preferences
    for (const recruiterDoc of recruitersSnapshot.docs) {
      const recruiterData = recruiterDoc.data();
      const companyName = recruiterData.company;
      
      if (!companyName || !recruiterData.positionPreferences) {
        continue; // Skip recruiters without company or preferences
      }
      
      // Check if any target company matches this recruiter's company
      for (const targetCompany of targetCompanies) {
        const companyMatches = 
          typeof targetCompany === 'string' ? 
          targetCompany === companyName : 
          targetCompany.name === companyName;
        
        if (companyMatches) {
          // Check for position preferences
          const position = typeof targetCompany === 'string' ? '' : targetCompany.position;
          const positionPreferences = recruiterData.positionPreferences;
          
          // Check for exact position match
          if (position && positionPreferences[position]) {
            result[`${companyName}:${position}`] = positionPreferences[position];
            continue;
          }
          
          // If no exact match, try to find a similar position
          if (position) {
            for (const [prefPosition, prefs] of Object.entries(positionPreferences)) {
              if (
                prefPosition.toLowerCase().includes(position.toLowerCase()) ||
                position.toLowerCase().includes(prefPosition.toLowerCase())
              ) {
                result[`${companyName}:${position}`] = prefs as PositionPreferences;
                break;
              }
            }
          }
          
          // If still no match but there are preferences, use the first one
          if (!result[`${companyName}:${position}`] && Object.keys(positionPreferences).length > 0) {
            const firstPosition = Object.keys(positionPreferences)[0];
            result[`${companyName}:${position}`] = positionPreferences[firstPosition] as PositionPreferences;
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching position preferences:', error);
    return result;
  }
}