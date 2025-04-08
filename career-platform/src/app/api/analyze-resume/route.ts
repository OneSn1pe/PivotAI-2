import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json();

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

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}