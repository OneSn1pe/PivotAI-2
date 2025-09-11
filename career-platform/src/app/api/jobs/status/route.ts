import { NextRequest, NextResponse } from 'next/server';
import linkedInJobsService from '@/services/linkedinJobsService';
import logger from '@/utils/logger';

const log = logger.createNamespace('JobsStatusAPI');

export async function GET(request: NextRequest) {
  try {
    log.info('Jobs API status check requested');

    // Check if LinkedIn Jobs service is configured
    const isConfigured = linkedInJobsService.isConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        available: false,
        error: 'LinkedIn Jobs API key not configured',
        details: 'RAPIDAPI_LINKEDIN_JOBS_KEY environment variable is missing',
        fallback: 'AI-powered analysis available'
      });
    }

    // Test API connectivity
    const apiStatus = await linkedInJobsService.getApiStatus();
    
    return NextResponse.json({
      configured: true,
      available: apiStatus.available,
      error: apiStatus.error || null,
      details: apiStatus.available ? 'LinkedIn Jobs API is ready' : apiStatus.error,
      lastChecked: new Date().toISOString(),
      fallback: 'AI-powered analysis available'
    });

  } catch (error) {
    log.error('Error checking jobs API status:', error);
    return NextResponse.json({
      configured: false,
      available: false,
      error: 'Failed to check API status',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'AI-powered analysis available'
    });
  }
}