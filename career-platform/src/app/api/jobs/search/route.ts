import { NextRequest, NextResponse } from 'next/server';
import { validateTokenWithDetails, extractTokenFromRequest } from '@/utils/server-auth';
import linkedInJobsService, { JobSearchFilters } from '@/services/linkedinJobsService';
import { getAdminServices } from '@/config/firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('JobsSearchAPI');

export async function GET(request: NextRequest) {
  try {
    log.info('Job search request received');

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
      log.warn('Invalid token for job search', { reason: validation.reason });
      return NextResponse.json(
        { error: 'Invalid authentication', details: validation.error },
        { status: 401 }
      );
    }

    // Check if LinkedIn Jobs API is configured
    if (!linkedInJobsService.isConfigured()) {
      log.error('LinkedIn Jobs API not configured');
      return NextResponse.json(
        { error: 'Job search service not available', details: 'API not configured' },
        { status: 503 }
      );
    }

    // Parse search parameters
    const { searchParams } = request.nextUrl;
    const filters: JobSearchFilters = {
      keywords: searchParams.get('keywords') || undefined,
      location: searchParams.get('location') || undefined,
      remote: searchParams.get('remote') === 'true',
      experienceLevel: searchParams.get('experienceLevel')?.split(',') || undefined,
      employmentType: searchParams.get('employmentType')?.split(',') || undefined,
      salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
      company: searchParams.get('company') || undefined,
      industry: searchParams.get('industry') || undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      limit: searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!), 25) : 10,
    };

    log.info('Job search filters', filters);

    // Search for jobs
    const jobsResponse = await linkedInJobsService.searchJobs(filters);

    // Log analytics
    log.info(`Job search completed: ${jobsResponse.jobs.length} jobs found`, {
      userId: validation.uid,
      totalCount: jobsResponse.totalCount,
      hasMore: jobsResponse.hasMore,
    });

    return NextResponse.json({
      success: true,
      data: jobsResponse,
      meta: {
        userId: validation.uid,
        searchedAt: new Date().toISOString(),
        apiStatus: 'active',
      },
    });

  } catch (error) {
    log.error('Error in job search API:', error);
    
    // Check if it's an API configuration error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'Job search service temporarily unavailable',
          details: 'API configuration issue',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Job search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check if LinkedIn Jobs API is configured
    if (!linkedInJobsService.isConfigured()) {
      return NextResponse.json(
        { error: 'Job search service not available' },
        { status: 503 }
      );
    }

    // Get request body with user profile and preferences
    const body = await request.json();
    const { userProfile, filters = {} } = body;

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required for job recommendations' },
        { status: 400 }
      );
    }

    log.info('Getting personalized job recommendations', { userId: validation.uid });

    // Get recommended jobs based on user profile
    const recommendations = await linkedInJobsService.getRecommendedJobs(
      userProfile,
      filters
    );

    // Get Firebase services to optionally log the search
    try {
      const services = await getAdminServices();
      if (services) {
        // Log user's job search activity
        await services.db.collection('jobSearches').add({
          userId: validation.uid,
          searchType: 'recommendations',
          filters,
          resultsCount: recommendations.length,
          topMatchScore: recommendations[0]?.matchScore || 0,
          searchedAt: new Date(),
        });
      }
    } catch (logError) {
      log.warn('Failed to log job search activity:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalFound: recommendations.length,
        topMatchScore: recommendations[0]?.matchScore || 0,
      },
      meta: {
        userId: validation.uid,
        searchedAt: new Date().toISOString(),
        apiStatus: 'active',
      },
    });

  } catch (error) {
    log.error('Error in job recommendations API:', error);
    return NextResponse.json(
      {
        error: 'Job recommendations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}