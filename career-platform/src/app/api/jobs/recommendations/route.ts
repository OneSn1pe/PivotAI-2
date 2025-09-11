import { NextRequest, NextResponse } from 'next/server';
import { validateTokenWithDetails, extractTokenFromRequest } from '@/utils/server-auth';
import linkedInJobsService from '@/services/linkedinJobsService';
import { getAdminServices } from '@/config/firebase-admin';
import { CandidateProfile } from '@/types/user';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('JobRecommendationsAPI');

export async function GET(request: NextRequest) {
  try {
    log.info('Job recommendations request received');

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

    // Get Firebase services
    const services = await getAdminServices();
    if (!services) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Check if LinkedIn Jobs API is configured
    if (!linkedInJobsService.isConfigured()) {
      log.warn('LinkedIn Jobs API not configured - missing RAPIDAPI_LINKEDIN_JOBS_KEY');
      return NextResponse.json(
        { 
          error: 'Job search service not available',
          details: 'LinkedIn Jobs API key not configured. Please set RAPIDAPI_LINKEDIN_JOBS_KEY environment variable.',
          fallback: 'Use AI-powered job analysis instead'
        },
        { status: 503 }
      );
    }

    // Get user profile from Firestore
    const userDoc = await services.db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as CandidateProfile;

    // Build user profile for job matching
    const userProfile = {
      skills: userData.resumeAnalysis?.skills || [],
      experience: userData.resumeAnalysis?.experience || [],
      targetRoles: userData.targetCompanies?.map(tc => tc.position) || ['Software Developer'],
      targetCompanies: userData.targetCompanies?.map(tc => tc.name) || [],
      preferences: {
        remote: userData.jobPreferences?.remotePreference === 'remote',
        locations: userData.jobPreferences?.locations || [],
        salaryMin: userData.jobPreferences?.salaryExpectation || undefined,
      },
    };

    // Parse query parameters for additional filters
    const { searchParams } = request.nextUrl;
    const additionalFilters = {
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      limit: searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!), 25) : 10,
    };

    log.info('Fetching job recommendations', { userId, targetRoles: userProfile.targetRoles });

    // Get job recommendations
    const recommendations = await linkedInJobsService.getRecommendedJobs(
      userProfile,
      additionalFilters
    );

    // Group recommendations by match score
    const groupedRecommendations = {
      excellent: recommendations.filter(r => r.matchScore >= 80),
      good: recommendations.filter(r => r.matchScore >= 60 && r.matchScore < 80),
      fair: recommendations.filter(r => r.matchScore >= 40 && r.matchScore < 60),
      poor: recommendations.filter(r => r.matchScore < 40),
    };

    // Log the search activity
    await services.db.collection('jobSearches').add({
      userId,
      searchType: 'user_recommendations',
      resultsCount: recommendations.length,
      topMatchScore: recommendations[0]?.matchScore || 0,
      groupedCounts: {
        excellent: groupedRecommendations.excellent.length,
        good: groupedRecommendations.good.length,
        fair: groupedRecommendations.fair.length,
        poor: groupedRecommendations.poor.length,
      },
      searchedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        grouped: groupedRecommendations,
        stats: {
          total: recommendations.length,
          excellent: groupedRecommendations.excellent.length,
          good: groupedRecommendations.good.length,
          fair: groupedRecommendations.fair.length,
          averageMatchScore: recommendations.length > 0 
            ? Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)
            : 0,
        },
        userProfile: {
          skillsCount: userProfile.skills.length,
          targetRoles: userProfile.targetRoles,
          targetCompanies: userProfile.targetCompanies,
          preferences: userProfile.preferences,
        },
      },
      meta: {
        userId,
        searchedAt: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
    });

  } catch (error) {
    log.error('Error in job recommendations API:', error);
    return NextResponse.json(
      {
        error: 'Failed to get job recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}