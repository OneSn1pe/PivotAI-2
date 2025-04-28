import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';
import { OpenAI } from 'openai';

// Debug helper with support for production environment
const debug = {
  log: (...args: any[]) => {
    if (typeof window !== 'undefined') {
      console.log('[CLIENT:openai-service]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (typeof window !== 'undefined') {
      console.error('[CLIENT:openai-service:ERROR]', ...args);
    }
  }
};

// Get base URL for API calls in both development and production
const getApiBaseUrl = () => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Use the current origin (works in both dev and production)
    return window.location.origin;
  }
  // Server-side rendering fallback for Vercel deployment
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_API_URL || '';
};

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Maximum length of resume text to analyze (to avoid token limits)
const MAX_RESUME_LENGTH = 8000;

/**
 * Safe JSON parse with error handling
 */
const safeJsonParse = (text: string) => {
  try {
    return { data: JSON.parse(text), error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/**
 * Debug function to test API endpoints with various HTTP methods
 */
export async function testApiEndpoint(endpoint: string, method: 'GET' | 'POST' | 'OPTIONS' = 'GET', body?: any): Promise<any> {
  debug.log(`Testing ${method} ${endpoint}...`);
  
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  debug.log(`Full URL: ${apiUrl}`);
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (method === 'POST' && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    debug.log(`Sending ${method} request to ${apiUrl}`);
    debug.log('Headers:', headers);
    if (body) debug.log('Body:', body);
    
    const options: RequestInit = {
      method,
      headers,
      credentials: 'same-origin',
      mode: 'cors',
    };
    
    if (method === 'POST' && body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    const response = await fetch(apiUrl, options);
    
    debug.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    debug.log('Response headers:', responseHeaders);
    
    // Only try to parse body for non-OPTIONS requests
    if (method !== 'OPTIONS') {
      const responseText = await response.text();
      debug.log('Response body (text):', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      const { data, error } = safeJsonParse(responseText);
      if (error) {
        debug.error('Failed to parse response as JSON:', error);
        return { 
          ok: response.ok, 
          status: response.status, 
          headers: responseHeaders,
          text: responseText,
          parseError: error
        };
      }
      
      return { 
        ok: response.ok, 
        status: response.status, 
        headers: responseHeaders,
        data 
      };
    }
    
    return { 
      ok: response.ok, 
      status: response.status, 
      headers: responseHeaders
    };
  } catch (error) {
    debug.error(`Request error (${method} ${apiUrl}):`, error);
    throw error;
  }
}

/**
 * Analyzes resume text and extracts structured information
 * @param resumeText - The text content of the resume to analyze
 * @returns Promise<ResumeAnalysis> - Structured resume analysis
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  if (!resumeText || resumeText.trim().length === 0) {
    console.error('Resume text is empty');
    throw new Error('Resume text is empty or invalid');
  }

  // Debug start time
  const startTime = performance.now();
  console.log('Starting resume analysis of text length:', resumeText.length);

  // Truncate resume text if it's too long
  const truncated = resumeText.length > MAX_RESUME_LENGTH;
  const processedResumeText = truncated ? resumeText.slice(0, MAX_RESUME_LENGTH) : resumeText;
  
  if (truncated) {
    console.log(`Resume text truncated from ${resumeText.length} to ${MAX_RESUME_LENGTH} characters`);
  }

  try {
    // Create a timeout promise to abort if it takes too long
    const timeoutDuration = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Resume analysis timed out after ${timeoutDuration/1000} seconds`)), timeoutDuration);
    });

    // OpenAI API call with timeout
    const openaiStartTime = performance.now();
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert resume analyzer. Extract the following information from the resume:
            - Skills: A comma-separated list of technical and soft skills mentioned
            - Experience: Key professional experiences with company names and roles
            - Education: Educational background with institutions and degrees
            - Strengths: Areas where the candidate shows strong capabilities
            - Weaknesses: Areas where the candidate could improve
            - Recommendations: Suggestions for improving the resume
            
            Format your response as a valid JSON object with these keys: skills (array), experience (array), education (array), strengths (array), weaknesses (array), recommendations (array).
            Ensure your response is ONLY the JSON object with no additional text.`
          },
          {
            role: "user",
            content: processedResumeText
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      timeoutPromise
    ]);
    
    const openaiEndTime = performance.now();
    console.log(`OpenAI API call completed in ${Math.round(openaiEndTime - openaiStartTime)}ms`);

    // Extract and parse the JSON response
    const jsonStr = response.choices[0].message.content?.trim();
    
    if (!jsonStr) {
      console.error('OpenAI returned empty response content');
      throw new Error('Failed to generate analysis: Empty response');
    }
    
    console.log('Parsing JSON response from OpenAI');
    
    try {
      const analysis = JSON.parse(jsonStr) as ResumeAnalysis;
      
      // Validate analysis structure
      const requiredFields = ['skills', 'experience', 'education', 'strengths', 'weaknesses', 'recommendations'];
      const missingFields = requiredFields.filter(field => !analysis[field as keyof ResumeAnalysis]);
      
      if (missingFields.length > 0) {
        console.warn(`Analysis missing fields: ${missingFields.join(', ')}`);
        // Initialize any missing fields as empty arrays
        missingFields.forEach(field => {
          analysis[field as keyof ResumeAnalysis] = [] as any;
        });
      }
      
      // Add debug info to help track processing issues
      (analysis as any)._debug = {
        processingTime: Math.round(performance.now() - startTime),
        openaiTime: Math.round(openaiEndTime - openaiStartTime),
        resumeLength: resumeText.length,
        resumeTruncated: truncated,
        timestamp: new Date().toISOString()
      };
      
      console.log('Resume analysis completed successfully', {
        skills: analysis.skills.length,
        processing_time_ms: Math.round(performance.now() - startTime)
      });
      
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response content:', jsonStr);
      throw new Error('Failed to parse analysis results');
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Provide a more helpful error message
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw new Error('Analysis timed out. The resume may be too complex or the service is temporarily busy.');
      } else if (error.message.includes('429')) {
        throw new Error('Too many requests. Please try again in a few minutes.');
      } else if (error.message.includes('401')) {
        throw new Error('OpenAI API key is invalid or expired.');
      }
      throw error;
    }
    
    throw new Error('Failed to analyze resume: Unknown error');
  }
}

export async function generateCareerRoadmap(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[],
  candidateId?: string
): Promise<CareerRoadmap> {
  debug.log('generateCareerRoadmap called');
  
  try {
    // Validate inputs to prevent API errors
    if (!resumeAnalysis) {
      throw new Error('Resume analysis is required');
    }
    
    if (!targetCompanies || !Array.isArray(targetCompanies) || targetCompanies.length === 0) {
      throw new Error('At least one target company is required');
    }
    
    if (!candidateId) {
      debug.log('Warning: candidateId not provided');
    }
    
    // Ensure all expected arrays exist in resumeAnalysis
    const validatedAnalysis = {
      ...resumeAnalysis,
      skills: Array.isArray(resumeAnalysis.skills) ? resumeAnalysis.skills : [],
      experience: Array.isArray(resumeAnalysis.experience) ? resumeAnalysis.experience : [],
      education: Array.isArray(resumeAnalysis.education) ? resumeAnalysis.education : [],
      strengths: Array.isArray(resumeAnalysis.strengths) ? resumeAnalysis.strengths : [],
      weaknesses: Array.isArray(resumeAnalysis.weaknesses) ? resumeAnalysis.weaknesses : [],
      recommendations: Array.isArray(resumeAnalysis.recommendations) ? resumeAnalysis.recommendations : []
    };
    
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/generate-roadmap`;
    debug.log(`API URL: ${apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resumeAnalysis: validatedAnalysis, 
          targetCompanies,
          candidateId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `Failed to generate roadmap (HTTP ${response.status})`;
        let errorDetails = '';
        
        try {
          const responseText = await response.text();
          debug.log('Error response:', responseText);
          
          const { data, error } = safeJsonParse(responseText);
          if (data) {
            errorMessage = data.message || data.error || errorMessage;
            errorDetails = data.details || '';
          }
        } catch (err) {
          debug.error('Error parsing error response:', err);
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }
      
      const responseText = await response.text();
      debug.log(`Response received, length: ${responseText.length}`);
      
      const { data, error } = safeJsonParse(responseText);
      
      if (error) {
        debug.error('Failed to parse roadmap response:', error);
        throw new Error('Failed to parse roadmap results. Please try again.');
      }
      
      if (!data || !data.id || !Array.isArray(data.milestones)) {
        debug.error('Invalid roadmap data structure:', data);
        throw new Error('Invalid roadmap data returned from server');
      }
      
      return data as CareerRoadmap;
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        debug.error('Request timeout');
        throw new Error('Roadmap generation timed out. Please try again.');
      }
      
      debug.error('Fetch error:', fetchError);
      throw fetchError;
    }
    
  } catch (error) {
    debug.error('Error generating roadmap:', error);
    throw error;
  }
}