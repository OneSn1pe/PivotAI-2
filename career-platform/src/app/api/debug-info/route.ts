import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Debug info route to provide information about API routes
 * This is useful for diagnosing 405 errors and other routing issues
 */

// Utility function to safely extract headers
const getHeadersObject = (headers: Headers): Record<string, string> => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

// CORS headers for debugging
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Scan the API directory to find all routes
const getApiRoutes = async (): Promise<string[]> => {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  
  try {
    // Check if the directory exists
    if (!fs.existsSync(apiDir)) {
      return [];
    }

    const entries = fs.readdirSync(apiDir, { withFileTypes: true });
    
    // Filter for directories
    return entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => `/api/${dirent.name}`);
      
  } catch (error) {
    console.error('[DEBUG-INFO] Error scanning API directory:', error);
    return [];
  }
};

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  console.log('[DEBUG-INFO] OPTIONS request received');
  
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Main handler to provide debug information
export async function GET(request: NextRequest) {
  console.log('[DEBUG-INFO] GET request received');
  
  try {
    // Get URL info
    const url = new URL(request.url);
    const apiRoutes = await getApiRoutes();
    
    // Gather Next.js route info from API directories
    const routeInfo = {
      currentRoute: url.pathname,
      apiRoutes,
      requestInfo: {
        method: request.method,
        headers: getHeadersObject(request.headers),
        url: request.url,
        nextUrl: {
          pathname: request.nextUrl.pathname,
          searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
        }
      },
      environmentInfo: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        nextVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
    
    // Check route files
    const routeFileChecks = apiRoutes.map(route => {
      const routeName = route.replace('/api/', '');
      const routePath = path.join(process.cwd(), 'src', 'app', 'api', routeName);
      const routeFile = path.join(routePath, 'route.ts');
      
      let fileExists = false;
      let fileSize = 0;
      
      try {
        if (fs.existsSync(routeFile)) {
          fileExists = true;
          const stats = fs.statSync(routeFile);
          fileSize = stats.size;
        }
      } catch (error) {
        console.error(`[DEBUG-INFO] Error checking route file ${routeFile}:`, error);
      }
      
      return {
        route,
        path: routePath,
        file: routeFile,
        fileExists,
        fileSize
      };
    });
    
    // Return response with debug info
    return new NextResponse(
      JSON.stringify({
        version: '1.0',
        status: 'success',
        message: 'API Debug Information',
        data: {
          routes: routeInfo,
          routeFiles: routeFileChecks
        }
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('[DEBUG-INFO] Error generating debug info:', error);
    
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: 'Failed to generate debug information',
        error: String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
} 