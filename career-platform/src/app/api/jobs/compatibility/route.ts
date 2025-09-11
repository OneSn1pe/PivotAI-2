import { NextRequest, NextResponse } from 'next/server';
import { validateTokenWithDetails, extractTokenFromRequest } from '@/utils/server-auth';
import linkedInJobsService, { LinkedInJob } from '@/services/linkedinJobsService';
import { getAdminServices } from '@/config/firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('JobCompatibilityAPI');

function getOpenAI() {
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          // Mock OpenAI for job analysis
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  compatibilityScore: Math.floor(Math.random() * 40) + 60,
                  strengths: ["Technical skills match", "Experience level appropriate"],
                  concerns: ["Some skills gaps", "Location preference"],
                  recommendations: ["Learn React", "Consider remote opportunities"]
                })
              }
            }]
          };
        }
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    log.info('Job compatibility analysis request received');

    // Extract and validate authentication token
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const validation = await validateTokenWithDetails(token);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const userId = validation.uid!;

    // Get request body
    const body = await request.json();
    const { jobData, userProfile } = body;

    if (!jobData || !userProfile) {
      return NextResponse.json(
        { error: 'Job data and user profile are required' },
        { status: 400 }
      );
    }

    log.info('Analyzing job compatibility', { userId, jobTitle: jobData.title });

    // Calculate basic compatibility using our service
    const matchResult = linkedInJobsService.calculateJobMatch(jobData, userProfile);

    // Enhanced compatibility analysis using AI
    const openai = getOpenAI();
    const aiAnalysisPrompt = `
Analyze job compatibility between this user profile and job posting:

USER PROFILE:
- Skills: ${userProfile.skills?.join(', ') || 'None listed'}
- Experience: ${userProfile.experience?.slice(0, 3).join('; ') || 'No experience listed'}
- Target Roles: ${userProfile.targetRoles?.join(', ') || 'None specified'}

JOB POSTING:
- Title: ${jobData.title}
- Company: ${jobData.company?.name || 'Unknown'}
- Location: ${jobData.location}
- Description: ${jobData.description?.substring(0, 500) || 'No description'}
- Required Skills: ${jobData.skills?.join(', ') || 'Not specified'}

Provide a detailed compatibility analysis as JSON:
{
  "compatibilityScore": number (0-100),
  "strengths": ["list of user strengths that match this role"],
  "concerns": ["list of potential concerns or gaps"],
  "recommendations": ["specific actions to improve compatibility"],
  "timeToReadiness": "estimate like '2-3 months' or 'ready now'",
  "confidenceLevel": "high|medium|low"
}`;

    let aiAnalysis = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career counselor analyzing job-candidate compatibility. Provide honest, actionable feedback."
          },
          {
            role: "user",
            content: aiAnalysisPrompt
          }
        ],
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          aiAnalysis = JSON.parse(content);
        } catch (parseError) {
          log.warn('Failed to parse AI analysis, using fallback');
        }
      }
    } catch (aiError) {
      log.warn('AI analysis failed, using basic compatibility only:', aiError);
    }

    // Combine basic match with AI analysis
    const finalCompatibility = {
      overallScore: aiAnalysis?.compatibilityScore || matchResult.matchScore,
      basicMatch: {
        score: matchResult.matchScore,
        reasons: matchResult.matchReasons,
        skillsAnalysis: matchResult.skillsMatch,
      },
      aiAnalysis: aiAnalysis || {
        compatibilityScore: matchResult.matchScore,
        strengths: matchResult.matchReasons,
        concerns: matchResult.skillsMatch.missing.length > 0 
          ? [`Missing ${matchResult.skillsMatch.missing.length} required skills`] 
          : [],
        recommendations: matchResult.skillsMatch.missing.length > 0 
          ? [`Learn: ${matchResult.skillsMatch.missing.slice(0, 3).join(', ')}`]
          : ['Continue building relevant experience'],
        timeToReadiness: matchResult.matchScore > 70 ? 'Ready now' : '1-3 months',
        confidenceLevel: 'medium'
      },
      jobDetails: {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company?.name,
        location: jobData.location,
        applyUrl: jobData.applyUrl,
      },
    };

    // Log the compatibility analysis
    try {
      const services = await getAdminServices();
      if (services) {
        await services.db.collection('jobCompatibilityAnalyses').add({
          userId,
          jobId: jobData.id,
          jobTitle: jobData.title,
          companyName: jobData.company?.name,
          compatibilityScore: finalCompatibility.overallScore,
          aiAnalysisUsed: !!aiAnalysis,
          analyzedAt: new Date(),
        });
      }
    } catch (logError) {
      log.warn('Failed to log compatibility analysis:', logError);
    }

    return NextResponse.json({
      success: true,
      data: finalCompatibility,
      meta: {
        userId,
        jobId: jobData.id,
        analyzedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    log.error('Error in job compatibility API:', error);
    return NextResponse.json(
      {
        error: 'Job compatibility analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}