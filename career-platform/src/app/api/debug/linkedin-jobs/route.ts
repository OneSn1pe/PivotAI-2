import { NextRequest, NextResponse } from 'next/server';
import linkedInJobsService from '@/services/linkedinJobsService';
import logger from '@/utils/logger';

const log = logger.createNamespace('LinkedInJobsDebugAPI');

export async function GET(request: NextRequest) {
  try {
    log.info('LinkedIn Jobs debug check requested');

    const debug = {
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.RAPIDAPI_LINKEDIN_JOBS_KEY,
      apiKeyLength: process.env.RAPIDAPI_LINKEDIN_JOBS_KEY?.length || 0,
      apiKeyPrefix: process.env.RAPIDAPI_LINKEDIN_JOBS_KEY?.substring(0, 10) || 'none',
      serviceConfigured: linkedInJobsService.isConfigured(),
      environment: process.env.NODE_ENV,
    };

    log.info('LinkedIn Jobs debug info', debug);

    // Test API connectivity if configured
    let apiTest = null;
    if (linkedInJobsService.isConfigured()) {
      try {
        apiTest = await linkedInJobsService.getApiStatus();
      } catch (error) {
        apiTest = { 
          available: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          testFailed: true
        };
      }
    }

    return NextResponse.json({
      debug,
      apiTest,
      recommendation: debug.serviceConfigured 
        ? 'LinkedIn Jobs API is configured and ready for testing'
        : 'Add RAPIDAPI_LINKEDIN_JOBS_KEY to your environment variables to enable real job data'
    });

  } catch (error) {
    log.error('Error in LinkedIn Jobs debug API:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}