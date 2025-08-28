import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:analyze-career]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:analyze-career:ERROR]', ...args);
  }
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  debug.log('[analyze-career] Received request');
  
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    debug.log('[analyze-career] Calling OpenAI API');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
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
      max_completion_tokens: 5000  // Increased for GPT-5 reasoning
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    debug.log('[analyze-career] Received response from OpenAI');
    
    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      debug.error('[analyze-career] Failed to parse OpenAI response:', parseError);
      // Return the raw result if parsing fails
      parsedResult = result;
    }

    return NextResponse.json(parsedResult);
    
  } catch (error: any) {
    debug.error('[analyze-career] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze career path',
        details: error.message 
      },
      { status: 500 }
    );
  }
}