import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug route to test API functionality
 * This endpoint logs detailed information about incoming requests
 * to help diagnose issues with API calls
 */

// Debug helper
const debug = {
  log: (...args: any[]) => console.log('[API:debug-test]', ...args),
  error: (...args: any[]) => console.error('[API:debug-test:ERROR]', ...args)
};

// Log detailed request information
function logRequestDetails(req: NextRequest) {
  try {
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    
    debug.log('Request details:', {
      method: req.method,
      url: req.url,
      nextUrl: {
        pathname: req.nextUrl.pathname,
        search: req.nextUrl.search,
      },
      headers: headersObj
    });
  } catch (err) {
    debug.error('Error logging request:', err);
  }
}

// Set CORS headers helper function
const setCorsHeaders = (response: NextResponse) => {
  console.log('[DEBUG-TEST] Setting CORS headers');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
};

// Debug response helper
const createDebugResponse = (data: any, status = 200) => {
  console.log(`[DEBUG-TEST] Creating response with status ${status}`);
  
  try {
    const response = new NextResponse(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
    return response;
  } catch (err) {
    console.error('[DEBUG-TEST] Error creating response:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  debug.log('OPTIONS request received');
  logRequestDetails(request);
  
  // Manually set CORS headers
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Handle GET requests
export async function GET(request: NextRequest) {
  debug.log('GET request received');
  logRequestDetails(request);
  
  return NextResponse.json({
    message: 'Debug endpoint is working (GET)',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}

// Handle POST requests
export async function POST(request: NextRequest) {
  debug.log('POST request received');
  logRequestDetails(request);
  
  let body = '';
  try {
    body = await request.text();
    debug.log('Request body:', body);
  } catch (err) {
    debug.error('Error reading body:', err);
  }

  return NextResponse.json({
    message: 'Debug endpoint is working (POST)',
    method: 'POST',
    receivedBody: body,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  });
} 