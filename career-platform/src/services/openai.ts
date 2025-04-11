import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const response = await fetch('/api/analyze-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resumeText }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze resume');
  }
  
  return response.json();
}

export async function generateCareerRoadmap(
  resumeAnalysis: ResumeAnalysis,
  targetCompanies: TargetCompany[]
): Promise<CareerRoadmap> {
  const response = await fetch('/api/generate-roadmap', {
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