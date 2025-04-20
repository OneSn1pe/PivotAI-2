import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Make sure OPTIONS method is explicitly handled for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    } 
  });
}

export async function POST(request: NextRequest) {
  try {
    // Log the beginning of the request processing
    console.log('Starting resume analysis...');

    // Extract resume text from request body
    const { resumeText } = await request.json();
    
    // Validate input
    if (!resumeText || resumeText.trim() === '') {
      console.error('Resume text is empty or undefined');
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    console.log('Resume text extracted, calling OpenAI API...');

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
    return NextResponse.json(analysis, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Log and handle errors
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}