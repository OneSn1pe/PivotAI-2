import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Add debug checkpoint utility
const logApiCheckpoint = (message: string, data: any = {}) => {
  console.log(`[RESUME_API] ${message}`, data);
  return { timestamp: new Date().toISOString(), message, ...data };
};

// Initialize OpenAI with API key and timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000, // 25 second timeout for API calls
  maxRetries: 2,  // Built-in retries for transient errors
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
  // Debug checkpoint
  logApiCheckpoint("OPTIONS request received");
  
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
  // Debug checkpoint
  logApiCheckpoint("GET request received", { path: request.nextUrl.pathname });
  
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
          reject(new Error('OpenAI API request timed out after 20s'));
        }, 20000); // 20 second timeout
      });
      
      // Race the function against the timeout
      return await Promise.race([
        fn(),
        timeoutPromise
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Debug checkpoint for retry
      logApiCheckpoint("API retry needed", { 
        retry: retries + 1, 
        error: error.message,
        status: error.status
      });
      
      // Check if it's a timeout error from our client-side timeout
      if (error.message === 'OpenAI API request timed out after 20s') {
        throw error; // Don't retry on client-side timeouts
      }
      
      // Only retry on rate limit errors
      if (error.status === 429 && retries < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retries);
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
  const checkpoints = [];
  
  checkpoints.push(logApiCheckpoint("Request received"));
  
  try {
    // Verify request content type
    const contentType = request.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      checkpoints.push(logApiCheckpoint("Invalid content type", { received: contentType }));
      return createResponse({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
        received: contentType,
        _debug: checkpoints
      }, 415);
    }

    // Parse request body
    const requestData = await request.json();
    checkpoints.push(logApiCheckpoint("Request body parsed"));
    
    // Validate request data
    if (!requestData || !requestData.resumeText) {
      checkpoints.push(logApiCheckpoint("Missing required field", { field: "resumeText" }));
      return createResponse({
        error: 'Bad Request',
        message: 'Missing required field: resumeText',
        _debug: checkpoints
      }, 400);
    }
    
    // Extract and truncate resume text
    const resumeText = truncateResume(requestData.resumeText);
    checkpoints.push(logApiCheckpoint("Resume text processed", { 
      originalLength: requestData.resumeText.length,
      processedLength: resumeText.length,
      truncated: requestData.resumeText.length !== resumeText.length
    }));
    
    // Prepare the prompt for OpenAI
    const prompt = `
    Analyze the following resume and extract key information:
    
    ${resumeText}
    
    Please provide the following information in JSON format:
    1. Contact information (name, email, phone, location)
    2. List of technical and soft skills
    3. Work experience (company names, job titles, dates, key achievements)
    4. Education (institutions, degrees, dates)
    5. Certifications or special qualifications
    6. Languages spoken
    7. Overall assessment of resume quality (1-10 scale)
    8. Areas for improvement
    9. Suggested job roles based on experience
    `;
    
    checkpoints.push(logApiCheckpoint("OpenAI prompt prepared"));
    
    // Call OpenAI API with retry logic
    const openaiStartTime = performance.now();
    checkpoints.push(logApiCheckpoint("Calling OpenAI API"));
    
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful resume analysis assistant. Extract key information from resumes and provide structured data in JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });
    });
    
    const openaiDuration = performance.now() - openaiStartTime;
    checkpoints.push(logApiCheckpoint("OpenAI API response received", { 
      durationMs: Math.round(openaiDuration),
      tokens: completion.usage?.total_tokens || 0,
      model: completion.model
    }));
    
    // Process response
    const responseText = completion.choices[0]?.message?.content || '{}';
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseText);
      checkpoints.push(logApiCheckpoint("Response parsed successfully"));
    } catch (err) {
      // Handle parsing errors
      checkpoints.push(logApiCheckpoint("Failed to parse response", { error: (err as Error).message }));
      return createResponse({
        error: 'Processing Error',
        message: 'Failed to parse AI response',
        rawResponse: responseText.substring(0, 100) + '...',
        _debug: checkpoints
      }, 500);
    }
    
    // Extract skills from the resume text
    const extractedSkills = extractSkillsFromText(resumeText);
    if (extractedSkills.length > 0) {
      // Add extracted skills to the response if they exist
      parsedResponse.extractedSkills = extractedSkills;
      checkpoints.push(logApiCheckpoint("Skills extracted", { count: extractedSkills.length }));
    }
    
    // Calculate request duration
    const requestDuration = Math.round(performance.now() - requestStartTime);
    checkpoints.push(logApiCheckpoint("Processing complete", { totalDurationMs: requestDuration }));
    
    // Return successful response
    return createResponse({
      success: true,
      analysis: parsedResponse,
      meta: {
        processingTimeMs: requestDuration,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        _debug: checkpoints
      }
    });
    
  } catch (error: any) {
    // Handle various error types
    const errorStatus = error.status || 500;
    const errorMessage = error.message || 'Unknown error occurred';
    
    checkpoints.push(logApiCheckpoint("Error occurred", { 
      status: errorStatus,
      message: errorMessage,
      stack: error.stack
    }));
    
    return createResponse({
      error: 'Analysis Failed',
      message: errorMessage,
      status: errorStatus,
      _debug: checkpoints
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