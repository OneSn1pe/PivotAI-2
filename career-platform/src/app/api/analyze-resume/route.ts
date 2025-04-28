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
  timeout: 25000, // 25 second timeout for API calls
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

// Handle GET requests (for testing or explicit rejection)
export async function GET(request: NextRequest) {
  debug.log('GET request received (explicitly not supported)');
  debug.request(request);
  
  const response = createResponse({
    error: "Method Not Allowed",
    message: "This endpoint only supports POST requests for security reasons. To test connection, use OPTIONS method.",
    debug: {
      path: request.nextUrl.pathname,
      originalMethod: request.method,
      receivedAt: new Date().toISOString()
    }
  }, 405);
  
  // Safely log headers without using iterator
  const headerObj: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headerObj[key] = value;
  });
  debug.trace('GET response headers:', headerObj);
  
  return response;
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
          reject(new Error('OpenAI API request timed out after 20s'));
        }, 20000); // 20 second client-side timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'OpenAI API request timed out after 20s') {
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

// Helper to truncate resume to a manageable size
function truncateResume(text: string, maxLength = 4000): string {
  if (text.length <= maxLength) return text;
  
  debug.log(`Truncating resume from ${text.length} to ${maxLength} characters`);
  return text.substring(0, maxLength) + '...';
}

// Main POST handler for resume analysis
export async function POST(request: NextRequest) {
  debug.log('POST request received');
  debug.request(request);
  
  // Track middleware effects
  const middlewareReceived = Boolean(request.headers.get('x-middleware-processed'));
  debug.middleware.received = middlewareReceived;
  debug.log('Middleware processed:', middlewareReceived);
  
  const requestStartTime = performance.now();
  
  try {
    // Verify request content type
    const contentType = request.headers.get('content-type');
    debug.log('Content-Type:', contentType);
    
    // Check and log all request headers for debugging
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });
    debug.log('All request headers:', requestHeaders);
    
    if (!contentType || !contentType.includes('application/json')) {
      debug.error('Invalid Content-Type header');
      return createResponse({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
        received: contentType,
        middlewareProcessed: middlewareReceived,
        debug: {
          headers: requestHeaders,
          method: request.method
        }
      }, 415);
    }
    
    // Extract the body text for debugging
    let requestText;
    try {
      requestText = await request.text();
      debug.log('Request body length:', requestText.length);
      debug.trace('Request body snippet:', requestText.substring(0, 200) + (requestText.length > 200 ? '...' : ''));
    } catch (textError) {
      debug.error('Failed to read request body:', textError);
      return createResponse({
        error: 'Bad Request',
        message: 'Failed to read request body',
        details: String(textError)
      }, 400);
    }
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(requestText);
      debug.trace('Parsed body:', body);
    } catch (err) {
      debug.error('Failed to parse request body:', err);
      return createResponse({
        error: 'Bad Request',
        message: 'Request body must be valid JSON',
        receivedText: requestText.substring(0, 100) + (requestText.length > 100 ? '...' : '')
      }, 400);
    }
    
    // Extract resume text
    const { resumeText } = body;
    
    // Validate input
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      debug.error('Resume text is empty or not a string');
      return createResponse({
        error: 'Bad Request',
        message: 'resumeText is required in the JSON body and must be a non-empty string',
        receivedType: typeof resumeText
      }, 400);
    }
    
    debug.log('Resume text extracted, length:', resumeText.length);
    
    // Truncate resume text to avoid timeouts with very large resumes
    const truncatedResume = truncateResume(resumeText);
    if (truncatedResume.length < resumeText.length) {
      debug.log(`Resume was truncated from ${resumeText.length} to ${truncatedResume.length} characters`);
    }
    
    if (!process.env.OPENAI_API_KEY) {
      debug.error('OpenAI API key is missing');
      return createResponse({
        error: 'Internal Server Error',
        message: 'Server configuration error: OpenAI API key is not configured'
      }, 500);
    }
    
    debug.log('Calling OpenAI API...');
    const openaiStartTime = performance.now();
    
    // Call OpenAI API to analyze the resume with retry logic
    try {
      const completion = await withRetry(async () => {
        return await openai.chat.completions.create({
          model: "gpt-4o", // Using GPT-4o for higher quality analysis
          temperature: 0.1, // Lower temperature for much more deterministic output
          messages: [
            {
              role: "system",
              content: "You are a professional resume analyzer. Extract key information from resumes and provide structured analysis. You MUST ONLY return a valid JSON object with no other text or formatting. DO NOT use markdown formatting like ```json. Include the following keys: skills, experience, education, strengths, weaknesses, and recommendations. Each should be an array of strings.\n\nFor skills: CRITICALLY IMPORTANT: ONLY include skills that appear VERBATIM in the resume text. DO NOT include general categories like 'Programming languages', 'Frameworks', 'Tools', 'Communication', 'Leadership', 'Teamwork', or 'Domain knowledge' - these are NOT specific skills. Only extract EXPLICIT skill names like 'Python', 'React', 'Docker', etc. It is FAR BETTER to return an empty skills array than to hallucinate or generalize skills that aren't explicitly stated in the text."
            },
            {
              role: "user",
              content: `Analyze this resume and extract the following information:
              - skills (array of strings) - ONLY extract skills that appear VERBATIM in the resume - NO category names or inferred skills whatsoever
              - experience (array of strings describing roles and responsibilities)
              - education (array of strings)
              - strengths (array of strings)
              - weaknesses (array of strings)
              - recommendations (array of strings with career advice)
              
              VERY IMPORTANT: 
              1. Format your response as a raw JSON object with NO markdown formatting
              2. Do NOT use code blocks, backticks, or any other markdown syntax
              3. Your response should be parseable by JSON.parse() directly
              4. Do NOT include any explanation, preamble, or additional text
              5. For skills, ONLY extract skills that appear VERBATIM in the text. DO NOT include general categories like "Programming languages", "Frameworks", etc. Only extract specific skills like "Python", "React", "Docker", etc.
              6. If no skills are explicitly mentioned, return an empty skills array
              
              Here's the resume: ${truncatedResume}`
            }
          ]
        });
      }, 2, 2000); // retry up to 2 times with 2s initial delay
      
      const openaiDuration = performance.now() - openaiStartTime;
      debug.log(`OpenAI response received successfully (${Math.round(openaiDuration)}ms)`);
      
      // Parse the response from OpenAI
      const rawAnalysisText = completion.choices[0].message.content || '{}';
      let analysisText = rawAnalysisText;
      let analysis;
      
      // Clean up the response by removing any markdown formatting
      if (analysisText.startsWith('```')) {
        // Find the first and last occurrence of code block markers
        const firstBlockEnd = analysisText.indexOf('\n');
        let lastBlockStart = analysisText.lastIndexOf('```');
        
        // Extract only the content between the markers
        if (firstBlockEnd !== -1 && lastBlockStart !== -1 && lastBlockStart > firstBlockEnd) {
          analysisText = analysisText.substring(firstBlockEnd + 1, lastBlockStart).trim();
        } else if (firstBlockEnd !== -1) {
          analysisText = analysisText.substring(firstBlockEnd + 1).trim();
        }
      }
      
      try {
        analysis = JSON.parse(analysisText);
        debug.trace('Parsed analysis:', analysis);
      } catch (err) {
        debug.error('Failed to parse OpenAI response:', err);
        debug.log('Raw response:', rawAnalysisText.substring(0, 200) + (rawAnalysisText.length > 200 ? '...' : ''));
        
        // Attempt to extract skills using regex before falling back to default values
        const extractedSkills = extractSkillsFromText(rawAnalysisText);
        
        // Provide a fallback structure when OpenAI doesn't return valid JSON
        analysis = {
          skills: extractedSkills.length > 0 ? extractedSkills : [],
          experience: ["Professional experience extracted from resume"],
          education: ["Education details extracted from resume"],
          strengths: ["Identified strengths from resume"],
          weaknesses: ["Areas for improvement based on resume"],
          recommendations: ["Suggestions for career development"],
          _error: "Generated fallback due to parsing error",
          _rawResponse: rawAnalysisText.substring(0, 200) + (rawAnalysisText.length > 200 ? '...' : '')
        };
        
        debug.log('Using fallback analysis structure with extracted skills:', extractedSkills);
      }
      
      debug.log('Analysis successfully parsed and returning to client');
      
      // Verify and fix the analysis structure if needed
      if (!analysis.skills || !Array.isArray(analysis.skills)) {
        debug.log('Skills array missing, attempting to extract skills from raw text');
        const extractedSkills = extractSkillsFromText(rawAnalysisText);
        analysis.skills = extractedSkills.length > 0 ? extractedSkills : [];
        debug.log('Using extracted skills or empty array:', analysis.skills);
      }
      
      if (!analysis.experience || !Array.isArray(analysis.experience)) {
        analysis.experience = ["Professional experience extracted from resume"];
      }
      if (!analysis.education || !Array.isArray(analysis.education)) {
        analysis.education = ["Education details extracted from resume"];
      }
      if (!analysis.strengths || !Array.isArray(analysis.strengths)) {
        analysis.strengths = ["Identified strengths from resume"];
      }
      if (!analysis.weaknesses || !Array.isArray(analysis.weaknesses)) {
        analysis.weaknesses = ["Areas for improvement based on resume"];
      }
      if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
        analysis.recommendations = ["Suggestions for career development"];
      }
      
      const totalDuration = performance.now() - requestStartTime;
      debug.log(`Total request processed in ${Math.round(totalDuration)}ms`);
      
      // Return successful response
      return createResponse({
        ...analysis,
        _debug: {
          processingTime: Math.round(totalDuration),
          openaiTime: Math.round(openaiDuration),
          resumeLength: resumeText.length,
          resumeTruncated: truncatedResume.length < resumeText.length,
          timestamp: new Date().toISOString()
        }
      }, 200);
      
    } catch (openaiError: any) {
      debug.error('OpenAI API call failed:', openaiError);
      
      // Enhanced error handling with more detailed diagnostics
      let errorMessage = 'Failed to process resume with AI service';
      let errorDetails = openaiError.message || String(openaiError);
      let statusCode = 500;
      
      // Check for specific OpenAI error types
      if (openaiError.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded';
        statusCode = 503; // Service Unavailable
        errorDetails = 'The AI service is currently experiencing high demand. Please try again in a few moments.';
      } else if (openaiError.message === 'OpenAI API request timed out after 20s') {
        errorMessage = 'AI analysis timed out';
        statusCode = 504; // Gateway Timeout
        errorDetails = 'The resume analysis took too long to complete. Please try again with a shorter resume.';
      } else if (openaiError.status === 401) {
        errorMessage = 'OpenAI API authentication error';
        errorDetails = 'Invalid API key or unauthorized access';
      } else if (openaiError.status === 400) {
        errorMessage = 'OpenAI API request error';
        // For parameter errors, be more specific
        if (errorDetails.includes('param') || errorDetails.includes('parameter')) {
          errorDetails = `API parameter error: ${errorDetails}`;
        }
      }
      
      return createResponse({
        error: errorMessage,
        message: 'The AI analysis service encountered an error',
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, statusCode);
    }
    
  } catch (error: any) {
    // Log and handle unexpected errors
    const totalDuration = performance.now() - requestStartTime;
    debug.error(`Unhandled error in POST handler after ${Math.round(totalDuration)}ms:`, error);
    
    // Ensure we always return a valid JSON response
    return createResponse({
      error: 'Internal Server Error',
      message: 'An unexpected server error occurred',
      details: error.message || String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
}

// Helper function to extract skills from raw text when JSON parsing fails
function extractSkillsFromText(text: string): string[] {
  try {
    // Look for patterns like "skills": [...] or "Skills:" followed by a list
    const skillsJsonMatch = text.match(/"skills"\s*:\s*\[(.*?)\]/i);
    if (skillsJsonMatch && skillsJsonMatch[1]) {
      // Try to parse the array portion
      try {
        const arrayText = `[${skillsJsonMatch[1]}]`;
        const skills = JSON.parse(arrayText);
        if (Array.isArray(skills) && skills.length > 0) {
          return skills.map(s => s.toString().trim()).filter(s => s);
        }
      } catch (err) {
        // If JSON parsing fails, continue to other methods
      }
    }
    
    // Look for list-like patterns with skills
    const skillsList: string[] = [];
    
    // Match bulleted lists that might contain skills - using exec() in a loop instead of matchAll
    const bulletRegex = /[•\-\*]\s*([^•\-\*\n]+)/g;
    let bulletMatch: RegExpExecArray | null;
    while ((bulletMatch = bulletRegex.exec(text)) !== null) {
      if (bulletMatch[1] && bulletMatch[1].trim()) {
        // Only include short entries that are likely to be skills (not paragraphs)
        const skill = bulletMatch[1].trim();
        if (skill.length < 50 && !skill.includes('.')) {
          skillsList.push(skill);
        }
      }
    }
    
    // Match comma-separated lists that might be skills
    if (skillsList.length === 0) {
      const commaListMatch = text.match(/skills:?\s*([^\.]+)/i);
      if (commaListMatch && commaListMatch[1]) {
        const commaList = commaListMatch[1].split(',');
        commaList.forEach(item => {
          const skill = item.trim();
          if (skill && skill.length < 50) {
            skillsList.push(skill);
          }
        });
      }
    }
    
    // Return found skills or empty array
    return skillsList.slice(0, 10); // Limit to 10 skills
  } catch (err) {
    console.error('Error extracting skills from text:', err);
    return [];
  }
}