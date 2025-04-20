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
  // Server-side rendering fallback
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
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
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
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
        if (responseText) {
          const { data, error } = safeJsonParse(responseText);
          if (data) {
            errorMessage = data.message || data.error || errorMessage;
          } else {
            debug.error('Error parsing response:', error);
          }
        }
        
        throw new Error(errorMessage);
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
      
      // Validate response data
      if (!data.skills || !Array.isArray(data.skills) || 
          !data.strengths || !Array.isArray(data.strengths) ||
          !data.recommendations || !Array.isArray(data.recommendations)) {
        debug.error('Invalid API response format:', data);
        throw new Error('Resume analysis returned invalid data format');
      }
      
      debug.log('Analysis successful!');
      return data as ResumeAnalysis;
      
    } catch (fetchError: any) {
      // Handle network errors including timeouts
      clearTimeout(timeoutId);
      
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
    debug.log(`API URL: ${apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
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
        let errorMessage = `Failed to generate roadmap (HTTP ${response.status})`;
        
        try {
          const responseText = await response.text();
          const { data, error } = safeJsonParse(responseText);
          if (data) {
            errorMessage = data.message || data.error || errorMessage;
          }
        } catch (err) {
          debug.error('Error parsing error response:', err);
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      const { data, error } = safeJsonParse(responseText);
      
      if (error) {
        throw new Error('Failed to parse roadmap results. Please try again.');
      }
      
      return data as CareerRoadmap;
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Roadmap generation timed out. Please try again.');
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    debug.error('Error generating roadmap:', error);
    throw error;
  }
}