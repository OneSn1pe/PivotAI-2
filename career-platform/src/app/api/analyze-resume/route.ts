import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Environment check for production
const isProd = process.env.NODE_ENV === 'production';

// Debug helper that respects production environment
const debug = {
  log: (...args: any[]) => {
    if (!isProd) {
      console.log('[API:analyze-resume]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors even in production
    console.error('[API:analyze-resume:ERROR]', ...args);
  }
};

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if OpenAI API key is valid
if (!process.env.OPENAI_API_KEY) {
  debug.error('OPENAI_API_KEY is not defined in environment variables');
}

// Safe JSON stringify with error handling
const safeStringify = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    debug.error('Error stringifying object:', err);
    return JSON.stringify({ error: 'Failed to serialize response' });
  }
};

// Set CORS headers helper function
const setCorsHeaders = (response: NextResponse) => {
  debug.log('Setting CORS headers');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
};

// Create standard response format
const createResponse = (data: any, status = 200) => {
  debug.log(`Creating response with status ${status}`);
  try {
    // Ensure the data is serializable
    const serializedData = safeStringify(data);
    const response = new NextResponse(serializedData, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });

    return response;
  } catch (err) {
    debug.error('Error creating response:', err);
    // Fallback for unserializable data
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  debug.log('OPTIONS request received');
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Handle GET requests (for testing or explicit rejection)
export async function GET(request: NextRequest) {
  debug.log('GET request received (explicitly not supported)');
  return createResponse({
    error: "Method Not Allowed",
    message: "This endpoint only supports POST requests."
  }, 405);
}

// Main POST handler for resume analysis
export async function POST(request: NextRequest) {
  debug.log('POST request received');
  
  try {
    // Verify request content type
    const contentType = request.headers.get('content-type');
    debug.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      debug.error('Invalid Content-Type header');
      return createResponse({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json'
      }, 415);
    }
    
    // Extract the body text for debugging
    let requestText;
    try {
      requestText = await request.text();
      debug.log('Request body length:', requestText.length);
    } catch (textError) {
      debug.error('Failed to read request body:', textError);
      return createResponse({
        error: 'Bad Request',
        message: 'Failed to read request body'
      }, 400);
    }
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(requestText);
    } catch (err) {
      debug.error('Failed to parse request body:', err);
      return createResponse({
        error: 'Bad Request',
        message: 'Request body must be valid JSON'
      }, 400);
    }
    
    // Extract resume text
    const { resumeText } = body;
    
    // Validate input
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      debug.error('Resume text is empty or not a string');
      return createResponse({
        error: 'Bad Request',
        message: 'resumeText is required in the JSON body and must be a non-empty string'
      }, 400);
    }
    
    debug.log('Resume text extracted, length:', resumeText.length);
    
    if (!process.env.OPENAI_API_KEY) {
      debug.error('OpenAI API key is missing');
      return createResponse({
        error: 'Internal Server Error',
        message: 'Server configuration error: OpenAI API key is not configured'
      }, 500);
    }
    
    debug.log('Calling OpenAI API...');
    
    // Call OpenAI API to analyze the resume
    try {
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
      
      debug.log('OpenAI response received successfully');
      
      // Parse the response from OpenAI
      const analysisText = completion.choices[0].message.content || '{}';
      let analysis;
      
      try {
        analysis = JSON.parse(analysisText);
      } catch (err) {
        debug.error('Failed to parse OpenAI response:', err);
        return createResponse({
          error: 'Internal Server Error',
          message: 'Failed to parse AI analysis response'
        }, 500);
      }
      
      debug.log('Analysis successfully parsed and returning to client');
      
      // Verify the analysis has the expected structure before sending
      if (!analysis.skills || !Array.isArray(analysis.skills) ||
          !analysis.strengths || !Array.isArray(analysis.strengths) ||
          !analysis.recommendations || !Array.isArray(analysis.recommendations)) {
        debug.error('OpenAI returned an incomplete analysis:', analysis);
        return createResponse({
          error: 'Incomplete analysis',
          message: 'AI analysis was incomplete, missing required fields'
        }, 500);
      }
      
      // Return successful response
      return createResponse(analysis, 200);
      
    } catch (openaiError) {
      debug.error('OpenAI API call failed:', openaiError);
      return createResponse({
        error: 'Internal Server Error',
        message: 'Failed to process resume with AI service'
      }, 500);
    }
    
  } catch (error: any) {
    // Log and handle unexpected errors
    debug.error('Unhandled error in POST handler:', error);
    return createResponse({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred'
    }, 500);
  }
}