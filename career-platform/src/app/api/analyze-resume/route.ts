import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Enable Edge Runtime for better performance and streaming capability
export const runtime = 'edge';

// Initialize OpenAI with API key and timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000, // 45 second timeout for API calls
  maxRetries: 3,  // Increased retries for transient errors
});

// Safe JSON stringify with error handling
const safeStringify = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    return JSON.stringify({ error: 'Failed to serialize response' });
  }
};

// Set CORS headers helper function
const setCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
};

// Create standard response format
const createResponse = (data: any, status = 200) => {
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
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
  
  return response;
}

// Helper to truncate resume to a manageable size
function truncateResume(text: string, maxLength = 4000): string {
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

// Handle GET requests with proper error message
export async function GET(request: NextRequest) {
  return createResponse({
    error: "Method Not Allowed",
    message: "This endpoint only supports POST requests for security reasons. To test connection, use OPTIONS method.",
    debug: {
      path: request.nextUrl.pathname,
      originalMethod: request.method,
      receivedAt: new Date().toISOString()
    }
  }, 405);
}

// Add retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelayMs = 1000): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      // Create a timeout promise with longer duration
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OpenAI API request timed out after 40s'));
        }, 40000); // 40 second timeout - increased from 20s
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Enhanced error logging
      console.error(`API call error (attempt ${retries+1}/${maxRetries+1}):`, 
        error.status || error.code || 'unknown',
        error.message || 'No error message');
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'OpenAI API request timed out after 40s') {
        throw error; // Don't retry on client-side timeouts
      }
      
      // Retry on more error types: rate limits, connection issues, and server errors
      if ((error.status === 429 || error.status >= 500 || error.code === 'ECONNRESET') && retries < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retries);
        console.log(`Retrying in ${delay}ms (attempt ${retries+1} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // Other errors or max retries reached, rethrow
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Main POST handler for resume analysis
export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    // Verify request content type
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return createResponse({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
        received: contentType
      }, 415);
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return createResponse({
        error: 'Invalid JSON',
        message: 'Failed to parse request body as JSON',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, 400);
    }
    
    // Validate request data
    if (!requestData || !requestData.resumeText) {
      return createResponse({
        error: 'Bad Request',
        message: 'Missing required field: resumeText'
      }, 400);
    }
    
    // Extract and truncate resume text
    const resumeText = truncateResume(requestData.resumeText);
    
    // Use a more concise prompt to reduce token count
    const prompt = `
    Analyze this resume and extract key information as JSON:
    
    ${resumeText}
    
    Extract: 
    - skills (technical and soft)
    - experience (companies, titles, dates, achievements)
    - education (schools, degrees, dates)
    - strengths (3-5 points)
    - weaknesses (3-5 points)
    - recommendations (3-5 points)
    `;
    
    // Call OpenAI API with retry logic
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a resume analysis assistant. Extract key information in concise JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Lower temperature for more deterministic responses
        max_tokens: 1200, // Reduced from 1500 to improve response time
        response_format: { type: 'json_object' }
      });
    });
    
    // Process response
    const responseText = completion.choices[0]?.message?.content || '{}';
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (err) {
      // Handle parsing errors
      return createResponse({
        error: 'Processing Error',
        message: 'Failed to parse AI response',
        rawResponse: responseText.substring(0, 100) + '...'
      }, 500);
    }
    
    // Extract skills from the resume text
    const extractedSkills = extractSkillsFromText(resumeText);
    if (extractedSkills.length > 0) {
      // Add extracted skills to the response if they exist
      parsedResponse.extractedSkills = extractedSkills;
    }
    
    // Calculate request duration
    const requestDuration = Math.round(performance.now() - requestStartTime);
    
    // Return successful response
    return createResponse({
      success: true,
      analysis: parsedResponse,
      meta: {
        processingTimeMs: requestDuration,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0
      }
    });
    
  } catch (error: any) {
    // Handle various error types
    const errorStatus = error.status || 500;
    const errorMessage = error.message || 'Unknown error occurred';
    
    // More detailed error reporting
    console.error('Resume analysis failed:', {
      message: errorMessage,
      status: errorStatus,
      stack: error.stack,
      time: new Date().toISOString()
    });
    
    return createResponse({
      error: 'Analysis Failed',
      message: errorMessage,
      status: errorStatus
    }, errorStatus);
  }
}

// Function to extract skills from resume text using basic pattern matching
function extractSkillsFromText(text: string): string[] {
  // Common technical skills to look for
  const technicalSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'NLP',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material UI',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Agile', 'Scrum'
  ];
  
  // Find matches in the text
  const foundSkills = technicalSkills.filter(skill => {
    // Create regex that matches whole words only
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
  
  // Remove duplicates using Array.from and Set
  return Array.from(new Set(foundSkills));
}