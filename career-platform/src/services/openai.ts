import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[CLIENT:openai-service]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[CLIENT:openai-service:ERROR]', ...args);
  }
};

// Get base URL for API calls, with fallback for local development
const getApiBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side
  return 'http://localhost:3000';
};

/**
 * Analyzes a resume text using OpenAI
 * @param resumeText The text content of the resume
 * @returns A structured analysis of the resume
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  debug.log('analyzeResume called');
  
  try {
    // Validate input before sending to API
    if (!resumeText || resumeText.trim() === '') {
      debug.error('Empty resume text provided');
      throw new Error('Resume text is empty. Please upload a valid resume file.');
    }
    
    // Sample the text for debugging
    debug.log('Resume text length:', resumeText.length);
    debug.log('Sample:', resumeText.substring(0, 100) + '...');
    
    // Build API URL
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/analyze-resume`;
    debug.log('API URL:', apiUrl);
    
    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    debug.log('Sending API request...');
    
    try {
      // Make API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
        signal: controller.signal
      });
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      debug.log('Response received, status:', response.status);
      
      // Check response status
      if (!response.ok) {
        let errorMessage = `Failed to analyze resume (HTTP ${response.status})`;
        
        try {
          const errorData = await response.json();
          debug.error('API response error:', response.status, errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          debug.error('Failed to parse error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse response data
      const data = await response.json();
      debug.log('Successfully parsed response data');
      
      // Validate returned data has required fields
      if (!data.skills || !Array.isArray(data.skills) || 
          !data.strengths || !Array.isArray(data.strengths) ||
          !data.recommendations || !Array.isArray(data.recommendations)) {
        debug.error('Invalid API response format:', data);
        throw new Error('Resume analysis returned invalid data format');
      }
      
      debug.log('Analysis successfully completed');
      return data;
      
    } catch (fetchError: any) {
      // Handle network errors including timeouts
      if (fetchError.name === 'AbortError') {
        debug.error('Request timeout after 60 seconds');
        throw new Error('Resume analysis timed out. Please try again.');
      }
      
      debug.error('Fetch error:', fetchError);
      throw fetchError;
    }
    
  } catch (error: any) {
    debug.error('Resume analysis error:', error);
    throw error;
  }
}

export async function generateCareerRoadmap(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[]
): Promise<CareerRoadmap> {
  debug.log('generateCareerRoadmap called');
  
  try {
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/generate-roadmap`;
    debug.log('API URL:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeAnalysis, targetCompanies }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      debug.error('API error generating roadmap:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to generate roadmap');
    }
    
    return response.json();
  } catch (error) {
    debug.error('Error generating roadmap:', error);
    throw error;
  }
}