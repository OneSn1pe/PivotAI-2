import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug route to test API functionality
 * This endpoint logs detailed information about incoming requests
 * to help diagnose issues with API calls
 */

// Helper to extract headers into a plain object
const headersToObject = (headers: Headers): Record<string, string> => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

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
  console.log('[DEBUG-TEST] OPTIONS request received');
  
  // Log the details of the request
  const requestInfo = {
    method: 'OPTIONS',
    url: request.url,
    headers: headersToObject(request.headers),
    timestamp: new Date().toISOString()
  };
  
  console.log('[DEBUG-TEST] Request details:', requestInfo);
  
  // Return standard OPTIONS response
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
  console.log('[DEBUG-TEST] GET request received');
  
  // Log the details of the request
  const requestInfo = {
    method: 'GET',
    url: request.url,
    headers: headersToObject(request.headers),
    timestamp: new Date().toISOString()
  };
  
  console.log('[DEBUG-TEST] Request details:', requestInfo);
  
  return createDebugResponse({
    message: "Debug API endpoint is functioning correctly",
    request: requestInfo,
    status: "Success"
  });
}

// Handle POST requests
export async function POST(request: NextRequest) {
  console.log('[DEBUG-TEST] POST request received');
  
  // Log the details of the request
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    
    const requestInfo = {
      method: 'POST',
      url: request.url,
      headers: headersToObject(request.headers),
      bodyText: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('[DEBUG-TEST] Request details:', requestInfo);
    
    // Attempt to parse body as JSON for debugging
    let parsedBody: any = null;
    try {
      parsedBody = JSON.parse(body);
      console.log('[DEBUG-TEST] Request JSON body:', parsedBody);
    } catch (e) {
      console.log('[DEBUG-TEST] Request body is not valid JSON');
    }
    
    return createDebugResponse({
      message: "Debug API endpoint received POST successfully",
      request: requestInfo,
      parsedBody,
      status: "Success"
    });
  } catch (error) {
    console.error('[DEBUG-TEST] Error processing POST request:', error);
    return createDebugResponse({
      message: "Error processing debug request",
      error: String(error),
      status: "Error"
    }, 500);
  }
} 