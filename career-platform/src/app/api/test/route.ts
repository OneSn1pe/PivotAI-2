import { NextRequest, NextResponse } from 'next/server';

// Debug helper
const debug = {
  log: (...args: any[]) => {
    console.log('[API:test]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[API:test:ERROR]', ...args);
  }
};

// Set CORS headers
const setCorsHeaders = (response: NextResponse) => {
  debug.log('Setting CORS headers');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// Handle OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  debug.log('OPTIONS request received');
  const response = NextResponse.json({}, { status: 200 });
  return setCorsHeaders(response);
}

// Handle GET requests
export async function GET(request: NextRequest) {
  debug.log('GET request received');
  
  // Generate a timestamp for the response
  const timestamp = new Date().toISOString();
  
  const response = NextResponse.json({
    success: true,
    message: 'API is working correctly',
    timestamp,
    route: '/api/test',
    method: 'GET'
  }, { status: 200 });
  
  return setCorsHeaders(response);
}

// Handle POST requests
export async function POST(request: NextRequest) {
  debug.log('POST request received');
  
  try {
    // Try to parse the request body
    const body = await request.json().catch(err => {
      debug.error('Failed to parse request body:', err);
      return null;
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'POST request received successfully',
      timestamp: new Date().toISOString(),
      route: '/api/test',
      method: 'POST',
      receivedData: body || 'No data or invalid JSON'
    }, { status: 200 });
    
    return setCorsHeaders(response);
  } catch (error) {
    debug.error('Error handling POST request:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: String(error)
    }, { status: 500 });
    
    return setCorsHeaders(response);
  }
} 