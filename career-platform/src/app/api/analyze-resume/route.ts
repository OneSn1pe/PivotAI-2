import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set CORS headers helper function
const setCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return setCorsHeaders(NextResponse.json({}, { status: 200 }));
}

// Handle GET requests (just for testing/debugging)
export async function GET(request: NextRequest) {
  return setCorsHeaders(
    NextResponse.json({ message: "POST request required for resume analysis" }, { status: 400 })
  );
}

// Main POST handler for resume analysis
export async function POST(request: NextRequest) {
  console.log('POST request received at /api/analyze-resume');
  
  try {
    // Log the beginning of the request processing
    console.log('Starting resume analysis...');

    // Extract resume text from request body
    const body = await request.json().catch(err => {
      console.error('Failed to parse request body:', err);
      return null;
    });
    
    if (!body) {
      return setCorsHeaders(
        NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      );
    }
    
    const { resumeText } = body;
    
    // Validate input
    if (!resumeText || resumeText.trim() === '') {
      console.error('Resume text is empty or undefined');
      return setCorsHeaders(
        NextResponse.json({ error: 'Resume text is required' }, { status: 400 })
      );
    }

    console.log('Resume text extracted, calling OpenAI API...');
    console.log('Resume text length:', resumeText.length);

    // Call OpenAI API to analyze the resume
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional resume analyzer. Extract key information from resumes and provide structured analysis."
        },
        {
          role: "user",
          content: `Analyze this resume and extract the following information in JSON format:
          - skills (array of strings)
          - experience (array of strings describing roles and responsibilities)
          - education (array of strings)
          - strengths (array of strings)
          - weaknesses (array of strings)
          - recommendations (array of strings with career advice)
          
          Here's the resume: ${resumeText}`
        }
      ],
      response_format: { type: "json_object" }
    });

    console.log('OpenAI response received. Parsing analysis...');

    // Parse the response from OpenAI
    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Return successful response
    return setCorsHeaders(NextResponse.json(analysis, { status: 200 }));
    
  } catch (error) {
    // Log and handle errors
    console.error('Error analyzing resume:', error);
    return setCorsHeaders(
      NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
    );
  }
}