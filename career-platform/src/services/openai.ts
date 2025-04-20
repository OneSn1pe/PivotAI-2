import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';

// Get base URL for API calls, with fallback for local development
const getApiBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side
  return 'http://localhost:3000';
};

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  try {
    // Validate input before sending to API
    if (!resumeText || resumeText.trim() === '') {
      throw new Error('Resume text is empty. Please upload a valid resume file.');
    }
    
    console.log('Sending resume text for analysis...');
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/analyze-resume`;
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API response error:', response.status, errorData);
      throw new Error(
        errorData.error || `Failed to analyze resume (HTTP ${response.status})`
      );
    }
    
    const data = await response.json();
    
    // Validate returned data has required fields
    if (!data.skills || !Array.isArray(data.skills) || 
        !data.strengths || !Array.isArray(data.strengths) ||
        !data.recommendations || !Array.isArray(data.recommendations)) {
      console.error('Invalid API response format:', data);
      throw new Error('Resume analysis returned invalid data format');
    }
    
    return data;
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw error;
  }
}

export async function generateCareerRoadmap(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[]
): Promise<CareerRoadmap> {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/generate-roadmap`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resumeAnalysis, targetCompanies }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate roadmap');
  }
  
  return response.json();
}