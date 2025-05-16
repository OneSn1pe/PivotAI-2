import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ResumeAnalysis } from '@/types/user';

// Configure longer timeout for this serverless function
export const runtime = 'nodejs'; // Use Node.js runtime instead of Edge runtime
export const maxDuration = 120; // Set maximum duration to 120 seconds

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
  },
  // Add additional debug level for detailed tracing
  trace: (...args: any[]) => {
    if (!isProd) {
      console.log('[API:analyze-resume:TRACE]', ...args);
    }
  },
  // Add request details logging with masking of sensitive data
  request: (req: NextRequest) => {
    if (isProd) return; // Skip in production
    
    try {
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        // Don't log auth tokens
        if (key.toLowerCase().includes('authorization')) {
          headers[key] = '[REDACTED]';
        } else {
          headers[key] = value;
        }
      });
      
      console.log('[API:analyze-resume:REQUEST]', {
        method: req.method,
        url: req.url,
        headers
      });
    } catch (err) {
      console.error('[API:analyze-resume:ERROR] Failed to log request:', err);
    }
  },
  // Add to the debug object additional functionality to track middleware
  middleware: {
    received: false,
    modifiedHeaders: {}
  }
};

// Initialize OpenAI with API key and timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout for API calls
  maxRetries: 2,  // Built-in retries for transient errors
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
  debug.trace('Setting CORS headers');
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

    // Safely log headers without using iterator
    const headerObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerObj[key] = value;
    });
    debug.trace('Response headers:', headerObj);
    
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
  debug.request(request);
  
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET', // Added GET to ensure it's allowed
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
  
  // Safely log headers without using iterator
  const headerObj: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headerObj[key] = value;
  });
  debug.trace('OPTIONS response headers:', headerObj);
  
  return response;
}

// Helper function to truncate resume text if too long
function truncateResume(text: string, maxLength: number = 4000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Helper function to safely parse JSON
function safeJsonParse(text: string): { data: any; error: Error | null } {
  try {
    // Remove markdown formatting if present
    let cleanedText = text.trim();
    
    // Check if the text starts with a markdown code block
    if (cleanedText.startsWith('```')) {
      console.log('Detected markdown code block in response, attempting to clean');
      
      // Find where the actual JSON begins (after the first line)
      const firstLineBreak = cleanedText.indexOf('\n');
      if (firstLineBreak !== -1) {
        cleanedText = cleanedText.substring(firstLineBreak + 1);
      }
      
      // Remove closing code block if present
      const closingBlockIndex = cleanedText.lastIndexOf('```');
      if (closingBlockIndex !== -1) {
        cleanedText = cleanedText.substring(0, closingBlockIndex).trim();
      }
      
      console.log('Cleaned text first 50 chars:', cleanedText.substring(0, 50) + '...');
    }
    
    return { data: JSON.parse(cleanedText), error: null };
  } catch (error) {
    console.error('JSON Parse error:', error);
    return { data: null, error: error as Error };
  }
}

// Handle GET requests with proper error message
export async function GET(request: NextRequest) {
  debug.log('GET request received - returning method not allowed error');
  debug.request(request);
  
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
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OpenAI API request timed out after 60s'));
        }, 60000); // 60 second client-side timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'OpenAI API request timed out after 60s') {
        debug.error('Client-side timeout reached:', error.message);
        throw error; // Don't retry on client-side timeouts
      }
      
      // Only retry on rate limit errors
      if (error.status === 429 && retries < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retries);
        debug.log(`Rate limited (429), retrying in ${delay}ms (retry ${retries + 1}/${maxRetries})`);
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
  try {
    // Get request body
    const body = await request.json();
    const { resumeText } = body;

    // Validate input
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      return NextResponse.json(
        { error: 'Resume text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Truncate resume text if too long
    const truncatedResume = truncateResume(resumeText);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a professional resume analyzer. Extract key information from resumes and provide structured analysis. 
Return ONLY raw JSON with absolutely NO markdown formatting or code blocks (no \`\`\`json). 
Your entire response must be valid parseable JSON with no additional text.`
        },
        {
          role: "user",
          content: `Analyze this resume and extract the following information in a structured JSON object:

{
  "skills": ["skill1", "skill2", ...],
  "skillLevels": [
    {
      "skill": "skill1",
      "level": 7,
      "evidence": "brief reason for this rating"
    },
    ...
  ],
  "experience": ["role1 with company, timeframe, and key responsibilities", ...],
  "education": ["degree with institution and year", ...],
  "certifications": ["certification name with issuing organization", ...],
  "strengths": ["strength1 based on resume content", ...],
  "weaknesses": ["weakness1 or area for improvement", ...],
  "recommendations": ["actionable recommendation based on analysis", ...]
}

Guidelines:
- For skills: Extract ONLY explicitly mentioned technical and professional skills from the text (e.g., 'Python', 'React', 'Docker'). NO categories or inferred skills.
- For skillLevels: Assess only 3-5 key skills with evidence-based rating (1-10) and brief justification
- For experience: Include company, position, timeframe, and key achievements in each entry
- For education: Include degree, field of study, institution, and graduation year
- For certifications: Only include formal professional certifications explicitly mentioned
- For strengths, weaknesses, and recommendations: Base these on concrete evidence from the resume
- If a section is missing from the resume, return an empty array for that section

CRITICAL: Return ONLY raw JSON with NO markdown code blocks. Do not start with \`\`\`json or end with \`\`\`. Do not include any explanatory text before or after the JSON.

Resume: ${truncatedResume}`
        }
      ]
    });

    // Parse the response
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const { data, error } = safeJsonParse(content);
    if (error) {
      throw new Error('Failed to parse OpenAI response');
    }

    // Validate and structure the response
    const analysis: ResumeAnalysis = {
      skills: Array.isArray(data.skills) ? data.skills : [],
      skillLevels: Array.isArray(data.skillLevels) ? data.skillLevels : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
    };

    return NextResponse.json({ data: analysis });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}