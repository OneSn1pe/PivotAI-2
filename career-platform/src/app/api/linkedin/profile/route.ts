import { NextRequest, NextResponse } from 'next/server';
import { ResumeAnalysis } from '@/types/user';

// Add this to your types file later
interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: {
    displayImage: string;
  };
  headline?: string;
  email?: string;
  positions?: {
    values: Array<{
      title: string;
      company: {
        name: string;
      };
      startDate: {
        month: number;
        year: number;
      };
      endDate?: {
        month: number;
        year: number;
      };
      summary?: string;
    }>;
  };
  educations?: {
    values: Array<{
      schoolName: string;
      degree?: string;
      fieldOfStudy?: string;
      startDate?: {
        year: number;
      };
      endDate?: {
        year: number;
      };
    }>;
  };
  skills?: {
    values: Array<{
      skill: {
        name: string;
      };
    }>;
  };
  summary?: string;
}

// Helper function to convert LinkedIn date format to string
function formatDate(date?: { month?: number; year?: number }) {
  if (!date || !date.year) return '';
  const month = date.month ? new Date(0, date.month - 1).toLocaleString('default', { month: 'short' }) : '';
  return month ? `${month} ${date.year}` : `${date.year}`;
}

// Helper to convert LinkedIn profile to resume text format
function convertProfileToResumeText(profile: LinkedInProfile): string {
  const name = `${profile.firstName} ${profile.lastName}`;
  const headline = profile.headline || '';
  const email = profile.email || '';
  const summary = profile.summary || '';
  
  // Format experience
  let experience = '';
  if (profile.positions?.values) {
    experience = profile.positions.values.map(position => {
      const company = position.company?.name || '';
      const title = position.title || '';
      const startDate = formatDate(position.startDate);
      const endDate = position.endDate ? formatDate(position.endDate) : 'Present';
      const duration = `${startDate} - ${endDate}`;
      const summary = position.summary || '';
      
      return `${title} at ${company}\n${duration}\n${summary}`;
    }).join('\n\n');
  }
  
  // Format education
  let education = '';
  if (profile.educations?.values) {
    education = profile.educations.values.map(edu => {
      const school = edu.schoolName || '';
      const degree = edu.degree || '';
      const field = edu.fieldOfStudy || '';
      const startYear = edu.startDate?.year || '';
      const endYear = edu.endDate?.year || '';
      const years = startYear && endYear ? `${startYear} - ${endYear}` : startYear || endYear || '';
      
      return `${school}\n${degree} ${field}\n${years}`;
    }).join('\n\n');
  }
  
  // Format skills
  let skills = '';
  if (profile.skills?.values) {
    skills = profile.skills.values.map(skill => skill.skill.name).join(', ');
  }
  
  // Combine all sections into a resume-like format
  return `
${name}
${headline}
${email}

SUMMARY
${summary}

EXPERIENCE
${experience}

EDUCATION
${education}

SKILLS
${skills}
`.trim();
}

// Main API handler
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.substring(7);
    
    // LinkedIn API endpoints
    const profileEndpoint = 'https://api.linkedin.com/v2/me';
    const emailEndpoint = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';
    
    // Fetch profile data from LinkedIn API
    const profileResponse = await fetch(profileEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    
    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('LinkedIn API error:', error);
      return NextResponse.json(
        { error: `LinkedIn API error: ${profileResponse.status}` },
        { status: profileResponse.status }
      );
    }
    
    const profileData = await profileResponse.json();
    
    // Fetch email address (this requires a separate API call)
    let emailData;
    try {
      const emailResponse = await fetch(emailEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      if (emailResponse.ok) {
        emailData = await emailResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch LinkedIn email:', error);
      // Continue even if email fetch fails
    }
    
    // Extract email from response if available
    let email = '';
    if (emailData?.elements?.[0]?.['handle~']?.emailAddress) {
      email = emailData.elements[0]['handle~'].emailAddress;
    }
    
    // Combine data into a complete profile
    const completeProfile: LinkedInProfile = {
      ...profileData,
      email
    };
    
    // Convert to resume text format
    const resumeText = convertProfileToResumeText(completeProfile);
    
    // Return both the raw profile data and formatted resume text
    return NextResponse.json({
      profile: completeProfile,
      resumeText
    });
  } catch (error) {
    console.error('LinkedIn profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn profile' },
      { status: 500 }
    );
  }
}

// Helper function to convert LinkedIn profile data to PDF
// This would typically be a server-side function that generates a PDF
export async function POST(request: NextRequest) {
  try {
    const { linkedInProfile } = await request.json();
    
    if (!linkedInProfile) {
      return NextResponse.json(
        { error: 'Missing LinkedIn profile data' },
        { status: 400 }
      );
    }
    
    // Convert profile to resume text
    const resumeText = convertProfileToResumeText(linkedInProfile);
    
    // For demonstration, we'll just return the text that would be in the PDF
    // In a real implementation, you would:
    // 1. Convert this to a PDF using a library like jsPDF or PDFKit
    // 2. Or send the data to a PDF generation service
    // 3. Return the PDF URL or file content
    
    return NextResponse.json({
      success: true,
      resumeText,
      message: 'LinkedIn profile converted to resume format'
    });
  } catch (error) {
    console.error('LinkedIn to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert LinkedIn profile to PDF' },
      { status: 500 }
    );
  }
} 