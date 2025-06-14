import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { log } from '@/lib/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  log.debug('[analyze-career] Received request');
  
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    log.debug('[analyze-career] Calling OpenAI API');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert career advisor and job market analyst. Analyze the user's profile and provide detailed job recommendations in a structured JSON format.
          
          Return a JSON object with this exact structure:
          {
            "recommendations": [
              {
                "title": "Job Title",
                "matchScore": 85,
                "description": "Brief role description",
                "requiredSkills": ["skill1", "skill2"],
                "matchingSkills": ["skill1", "skill2"],
                "gapSkills": ["skill3", "skill4"],
                "salaryRange": "$XX0k - $XX0k",
                "seniorityLevel": "Senior/Mid-level/Junior",
                "growthPotential": "High/Medium/Low"
              }
            ],
            "careerPath": {
              "current": "Current Role",
              "shortTerm": ["Role 1", "Role 2"],
              "longTerm": ["Role 3", "Role 4"]
            },
            "insights": {
              "strengths": ["strength 1", "strength 2"],
              "opportunities": ["opportunity 1", "opportunity 2"],
              "industryTrends": ["trend 1", "trend 2"]
            }
          }`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    log.debug('[analyze-career] Received response from OpenAI');
    
    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      log.error('[analyze-career] Failed to parse OpenAI response:', parseError);
      // Return the raw result if parsing fails
      parsedResult = result;
    }

    return NextResponse.json(parsedResult);
    
  } catch (error: any) {
    log.error('[analyze-career] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze career path',
        details: error.message 
      },
      { status: 500 }
    );
  }
}