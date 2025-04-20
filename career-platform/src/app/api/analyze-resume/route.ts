import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:analyze-resume]', ...args);
  },
  error: (...args: any[]) => {
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
  const response = NextResponse.json(data, { status });
  return setCorsHeaders(response);
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  debug.log('OPTIONS request received');
  // Return successful preflight response with CORS headers
  return createResponse({}, 200);
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  debug.log('GET request received (not supported)');
  return createResponse({ 
    error: "Method not allowed",
    message: "This endpoint requires a POST request with JSON payload" 
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
        error: 'Invalid content type',
        message: 'Content-Type must be application/json'
      }, 415);
    }
    
    // Extract the body text for debugging
    const requestText = await request.text();
    debug.log('Request body length:', requestText.length);
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(requestText);
    } catch (err) {
      debug.error('Failed to parse request body:', err);
      return createResponse({ 
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      }, 400);
    }
    
    // Extract resume text
    const { resumeText } = body;
    
    // Validate input
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      debug.error('Resume text is empty or not a string');
      return createResponse({ 
        error: 'Bad request',
        message: 'Resume text is required and must be a non-empty string'
      }, 400);
    }
    
    debug.log('Resume text extracted, length:', resumeText.length);
    
    if (!process.env.OPENAI_API_KEY) {
      debug.error('OpenAI API key is missing');
      return createResponse({ 
        error: 'Server configuration error',
        message: 'OpenAI API key is not configured'
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
          error: 'Processing error',
          message: 'Failed to parse AI response'
        }, 500);
      }
      
      debug.log('Analysis successfully parsed and returning to client');
      
      // Return successful response
      return createResponse(analysis);
      
    } catch (openaiError) {
      debug.error('OpenAI API call failed:', openaiError);
      return createResponse({ 
        error: 'AI processing error',
        message: 'Failed to process resume with AI'
      }, 500);
    }
    
  } catch (error: any) {
    // Log and handle errors
    debug.error('Unhandled error:', error);
    return createResponse({ 
      error: 'Server error',
      message: 'An unexpected error occurred while processing the request'
    }, 500);
  }
}