import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';
import logger from '@/utils/logger';

// Create a namespaced logger for OpenAI service
const log = logger.createNamespace('OpenAI');

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
  log.debug(`Testing ${method} ${endpoint}...`);
  
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  log.debug(`Full URL: ${apiUrl}`);
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (method === 'POST' && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  try {
    log.debug(`Sending ${method} request to ${apiUrl}`);
    log.debug('Headers:', headers);
    if (body) log.debug('Body:', body);
    
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
    
    log.debug(`Response status: ${response.status} ${response.statusText}`);
    
    // Log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    log.debug('Response headers:', responseHeaders);
    
    // Only try to parse body for non-OPTIONS requests
    if (method !== 'OPTIONS') {
      const responseText = await response.text();
      log.debug('Response body (text):', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      const { data, error } = safeJsonParse(responseText);
      if (error) {
        log.error('Failed to parse response as JSON:', error);
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
    log.error(`Request error (${method} ${apiUrl}):`, error);
    throw error;
  }
}

/**
 * Analyzes a resume text using OpenAI
 * @param resumeText The text content of the resume
 * @returns A structured analysis of the resume
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  log.debug('analyzeResume called');
  const startTime = performance.now();
  const debugSteps: any[] = [];
  
  // Helper for tracking steps with timing
  const logStep = (step: string, data: any = {}) => {
    const timeFromStart = performance.now() - startTime;
    const stepInfo = {
      step,
      timeMs: Math.round(timeFromStart),
      ...data
    };
    log.debug(`[STEP:${step}]`, stepInfo);
    debugSteps.push(stepInfo);
    
    // Add to global debug object if it exists
    if (typeof window !== 'undefined' && window.resumeAnalysisDebug) {
      window.resumeAnalysisDebug.clientSteps = window.resumeAnalysisDebug.clientSteps || [];
      window.resumeAnalysisDebug.clientSteps.push({
        ...stepInfo,
        timestamp: new Date()
      });
    }
    
    return stepInfo;
  };
  
  logStep('analyzeResume.start', { textLength: resumeText.length });
  
  try {
    // Validate input
    if (!resumeText || resumeText.trim() === '') {
      logStep('analyzeResume.error', { error: 'Empty resume text' });
      throw new Error('Resume text is empty. Please upload a valid resume file.');
    }
    
    log.debug(`Resume text length: ${resumeText.length}`);
    
    // Build API URL
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/analyze-resume`;
    logStep('apiUrl.built', { apiUrl, baseUrl });
    
    // Set up request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logStep('request.timeout', { timeout: 60000 });
    }, 60000);
    
    try {
      logStep('request.start');
      
      // Make API request - ensure we're using POST method
      const fetchStartTime = performance.now();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
        signal: controller.signal
      });
      const fetchEndTime = performance.now();
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      logStep('response.received', { 
        status: response.status, 
        statusText: response.statusText,
        timeMs: Math.round(fetchEndTime - fetchStartTime),
        headers: Object.fromEntries(Array.from(response.headers.entries()))
      });
      
      // Check if response is ok
      if (!response.ok) {
        // Get response text first
        let responseText = '';
        try {
          responseText = await response.text();
          logStep('error.responseText', { 
            text: responseText.substring(0, 500),
            length: responseText.length
          });
        } catch (textErr) {
          logStep('error.failedToGetText', { error: String(textErr) });
        }
        
        // Try to parse the error response
        let errorMessage = `Failed to analyze resume (HTTP ${response.status})`;
        let errorDetails = '';
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData.details || '';
            
            // Log error data including debug info from the server
            logStep('error.parsed', { 
              message: errorMessage,
              details: errorDetails,
              debug: errorData._debug || errorData.meta?._debug || null
            });
          } catch (parseErr) {
            logStep('error.failedToParse', { error: String(parseErr) });
            // Use the raw text if parsing fails
            errorMessage = responseText.substring(0, 100) || errorMessage;
          }
        }
        
        // Create detailed error object
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).status = response.status;
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).url = apiUrl;
        (enhancedError as any).debugSteps = debugSteps;
        
        logStep('error.throwing', { message: errorMessage, status: response.status });
        throw enhancedError;
      }
      
      // Get the response text
      const parseStartTime = performance.now();
      const responseText = await response.text();
      
      logStep('response.text', { 
        length: responseText.length,
        sample: responseText.substring(0, 150) + '...'
      });
      
      // Safely parse JSON
      const { data, error } = safeJsonParse(responseText);
      const parseEndTime = performance.now();
      
      logStep('response.parsed', { 
        parseTimeMs: Math.round(parseEndTime - parseStartTime),
        success: !error,
        serverDebug: data?.meta?._debug || null
      });
      
      if (error) {
        logStep('parse.error', { error: String(error) });
        throw new Error('Failed to parse analysis results. Please try again.');
      }
      
      // Validate response data structure
      if (!data || (!data.analysis && !data.skills)) {
        logStep('validation.error', { data: JSON.stringify(data).substring(0, 200) });
        throw new Error('Resume analysis returned empty or invalid response');
      }
      
      // Check if the response is in the expected format or wrapped in data.analysis
      const analysisData = data.analysis || data;
      
      // Helper function to safely extract arrays from potentially nested structures
      const safeExtractArray = (obj: any, fieldName: string): string[] => {
        // Direct field match
        if (Array.isArray(obj[fieldName])) {
          return obj[fieldName];
        }
        
        // Check for nested objects
        const nestedFields = {
          skills: ['technical_skills', 'soft_skills', 'summary_of_skills', 'skill_set'],
          experience: ['work_experience', 'professional_experience', 'work_history', 'employment_history'],
          education: ['educational_background', 'academic_history'],
          strengths: ['strong_points', 'positive_aspects', 'resume_strengths'],
          weaknesses: ['areas_for_improvement', 'improvement_areas', 'weak_points', 'resume_weaknesses'],
          recommendations: ['suggested_job_roles', 'career_suggestions', 'job_recommendations', 'career_paths']
        };
        
        // Check alternate field names
        const alternateNames = nestedFields[fieldName as keyof typeof nestedFields] || [];
        for (const altName of alternateNames) {
          if (Array.isArray(obj[altName])) {
            return obj[altName];
          }
        }
        
        // Check if the field is within contact_information
        if (obj.contact_information && obj.contact_information[fieldName]) {
          const value = obj.contact_information[fieldName];
          return Array.isArray(value) ? value : [value];
        }
        
        // Return empty array as fallback
        return [];
      };
      
      // Check for required fields with fallbacks
      const validatedAnalysis: ResumeAnalysis = {
        skills: safeExtractArray(analysisData, 'skills'),
        experience: safeExtractArray(analysisData, 'experience'),
        education: safeExtractArray(analysisData, 'education'),
        strengths: safeExtractArray(analysisData, 'strengths'),
        weaknesses: safeExtractArray(analysisData, 'weaknesses'),
        recommendations: safeExtractArray(analysisData, 'recommendations')
      };
      
      // Debug log the full API response and extracted fields
      if (process.env.NODE_ENV !== 'production') {
        log.debug('Full API response:', data);
        log.debug('Extracted fields:', validatedAnalysis);
      }
      
      const totalTime = performance.now() - startTime;
      logStep('analyzeResume.success', { 
        timeMs: Math.round(totalTime),
        skillsCount: validatedAnalysis.skills.length,
        experienceCount: validatedAnalysis.experience.length,
        meta: data.meta || null
      });
      
      return validatedAnalysis;
      
    } catch (fetchError: any) {
      // Handle network errors including timeouts
      clearTimeout(timeoutId);
      
      // Add more context to error
      let errorMessage = fetchError.message || 'Unknown error';
      let errorType = 'unknown';
      
      if (fetchError.name === 'AbortError') {
        errorType = 'timeout';
        errorMessage = 'Resume analysis timed out. Please try again.';
      } else if (fetchError.message?.includes('NetworkError')) {
        errorType = 'network';
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (fetchError.status) {
        errorType = 'api';
      }
      
      logStep('fetch.error', { 
        type: errorType,
        message: errorMessage,
        originalError: String(fetchError),
        status: fetchError.status || null,
        stack: fetchError.stack || null
      });
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = fetchError;
      (enhancedError as any).type = errorType;
      (enhancedError as any).debugSteps = debugSteps;
      
      throw enhancedError;
    }
    
  } catch (error: any) {
    const totalTime = performance.now() - startTime;
    logStep('analyzeResume.failed', { 
      timeMs: Math.round(totalTime),
      error: error.message,
      type: error.type || 'unknown'
    });
    
    // Attach debug steps to the error object
    if (!error.debugSteps) {
      error.debugSteps = debugSteps;
    }
    
    throw error;
  }
}

export async function generateCareerRoadmap(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[],
  candidateId?: string
): Promise<CareerRoadmap> {
  log.debug('generateCareerRoadmap called');
  
  try {
    // Validate inputs to prevent API errors
    if (!resumeAnalysis) {
      throw new Error('Resume analysis is required');
    }
    
    if (!targetCompanies || !Array.isArray(targetCompanies) || targetCompanies.length === 0) {
      throw new Error('At least one target company is required');
    }
    
    if (!candidateId) {
      log.debug('Warning: candidateId not provided');
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
    log.debug(`API URL: ${apiUrl}`);
    
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
          log.debug('Error response:', responseText);
          
          const { data, error } = safeJsonParse(responseText);
          if (data) {
            errorMessage = data.message || data.error || errorMessage;
            errorDetails = data.details || '';
          }
        } catch (err) {
          log.error('Error parsing error response:', err);
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }
      
      const responseText = await response.text();
      log.debug(`Response received, length: ${responseText.length}`);
      
      const { data, error } = safeJsonParse(responseText);
      
      if (error) {
        log.error('Failed to parse roadmap response:', error);
        throw new Error('Failed to parse roadmap results. Please try again.');
      }
      
      if (!data || !Array.isArray(data.milestones)) {
        log.error('Invalid roadmap data structure:', data);
        throw new Error('Invalid roadmap data returned from server');
      }
      
      // With the updated API, the response may not include the document ID if it's an update
      // Make sure we handle this case properly
      if (!data.id) {
        log.debug('Warning: Roadmap ID not found in response, using provided ID if any');
      }
      
      return data as CareerRoadmap;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        log.error('Request timeout');
        throw new Error('Roadmap generation timed out. Please try again.');
      }
      
      log.error('Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    log.error('Error generating roadmap:', error);
    throw error;
  }
}

/**
 * Deletes all roadmaps for a specific candidate
 * @param candidateId The ID of the candidate
 * @returns Information about the deletion operation
 */
export async function deleteAllRoadmaps(candidateId: string): Promise<{ success: boolean, count: number }> {
  log.debug('deleteAllRoadmaps called for candidateId:', candidateId);
  
  try {
    if (!candidateId) {
      throw new Error('candidateId is required');
    }
    
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/delete-roadmaps`;
    log.debug(`API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ candidateId })
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to delete roadmaps (HTTP ${response.status})`;
      
      try {
        const responseText = await response.text();
        log.debug('Error response:', responseText);
        
        const { data, error } = safeJsonParse(responseText);
        if (data) {
          errorMessage = data.message || data.error || errorMessage;
        }
      } catch (err) {
        log.error('Error parsing error response:', err);
      }
      
      throw new Error(errorMessage);
    }
    
    const { data, error } = safeJsonParse(await response.text());
    
    if (error) {
      log.error('Failed to parse response:', error);
      throw new Error('Failed to parse delete response');
    }
    
    log.debug('Roadmaps deleted successfully:', data);
    return { 
      success: true, 
      count: data.count || 0 
    };
  } catch (error) {
    log.error('Error deleting roadmaps:', error);
    throw error;
  }
}