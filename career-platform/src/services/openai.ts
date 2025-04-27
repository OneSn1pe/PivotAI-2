import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';

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
 * Analyzes a resume text using OpenAI
 * @param resumeText The text content of the resume
 * @returns A structured analysis of the resume
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  debug.log('analyzeResume called');
  
  try {
    // Validate input
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Resume text is empty. Please upload a valid resume file.');
    }
    
    debug.log(`Resume text length: ${resumeText.length}`);
    
    // Build API URL
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/analyze-resume`;
    debug.log(`API URL: ${apiUrl}`);
    
    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      debug.log('Sending API request...');
      
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      debug.log(`Response received, status: ${response.status}`);
      
      // Check if response is ok
      if (!response.ok) {
        // Get response text first
        let responseText = '';
        try {
          responseText = await response.text();
          debug.log('Error response text:', responseText);
        } catch (textErr) {
          debug.error('Failed to get response text:', textErr);
        }
        
        // Try to parse the error response
        let errorMessage = `Failed to analyze resume (HTTP ${response.status})`;
        let errorDetails = '';
        
        if (responseText) {
          const { data, error } = safeJsonParse(responseText);
          if (data) {
            errorMessage = data.message || data.error || errorMessage;
            errorDetails = data.details || '';
          } else {
            debug.error('Error parsing response:', error);
          }
        }
        
        // Create detailed error object
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).status = response.status;
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).url = apiUrl;
        
        throw enhancedError;
      }
      
      // Get the response text
      const responseText = await response.text();
      debug.log('Got response text, length:', responseText.length);
      
      // Safely parse JSON
      const { data, error } = safeJsonParse(responseText);
      
      if (error) {
        debug.error('Failed to parse API response:', error);
        throw new Error('Failed to parse analysis results. Please try again.');
      }
      
      // Validate response data structure
      if (!data) {
        throw new Error('Resume analysis returned empty response');
      }
      
      // Check for required fields with fallbacks
      const validatedAnalysis: ResumeAnalysis = {
        skills: Array.isArray(data.skills) ? data.skills : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
      };
      
      debug.log('Analysis successful!');
      return validatedAnalysis;
      
    } catch (fetchError: any) {
      // Handle network errors including timeouts
      clearTimeout(timeoutId);
      
      // Add more context to error
      let errorMessage = fetchError.message || 'Unknown error';
      
      if (fetchError.name === 'AbortError') {
        debug.error('Request timeout after 60 seconds');
        errorMessage = 'Resume analysis timed out. Please try again.';
      } else if (fetchError.message?.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = fetchError;
      (enhancedError as any).type = 'network_error';
      
      debug.error('Fetch error:', enhancedError);
      throw enhancedError;
    }
    
  } catch (error: any) {
    debug.error('Resume analysis error:', error);
    throw error;
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