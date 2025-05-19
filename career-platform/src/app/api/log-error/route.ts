import { NextRequest, NextResponse } from 'next/server';

// Enable edge runtime for faster response with streaming
export const runtime = 'edge';

// Error buffer to batch process errors
let errorBuffer: any[] = [];
const MAX_BUFFER_SIZE = 5;

// Function to process error reports
async function processErrors(errors: any[]) {
  if (errors.length === 0) return;
  
  try {
    // Log errors to console (in production, you'd send to error tracking service)
    console.error(`[Error Tracking] Processing ${errors.length} error reports:`);
    errors.forEach((error, index) => {
      console.error(`[Error ${index + 1}]`, 
        `Message: ${error.message}`, 
        `URL: ${error.url}`, 
        `Time: ${error.timestamp}`);
    });
    
    // In a production environment, you would send these to:
    // - Error tracking service (like Sentry)
    // - Logging system
    // - Alerting system for critical errors
  } catch (processError) {
    console.error('[Error Tracking] Failed to process error reports:', processError);
  }
}

// Function to flush the error buffer
function flushErrorBuffer() {
  if (errorBuffer.length === 0) return;
  
  const errorsToProcess = [...errorBuffer];
  errorBuffer = [];
  
  // Process errors without blocking
  processErrors(errorsToProcess).catch(err => {
    console.error('[Error Tracking] Failed in background processing:', err);
  });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Main error logging endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse the error report
    const errorReport = await request.json();
    
    // Validate basic error structure
    if (!errorReport.message) {
      return NextResponse.json(
        { success: false, message: 'Invalid error report format' },
        { status: 400 }
      );
    }
    
    // Ensure timestamp exists
    if (!errorReport.timestamp) {
      errorReport.timestamp = new Date().toISOString();
    }
    
    // Add to error buffer
    errorBuffer.push(errorReport);
    
    // Flush buffer if it reaches threshold
    if (errorBuffer.length >= MAX_BUFFER_SIZE) {
      flushErrorBuffer();
    } else {
      // Schedule flush for later to avoid blocking
      setTimeout(flushErrorBuffer, 1000);
    }
    
    // Return success immediately without waiting for processing
    return NextResponse.json(
      { success: true },
      {
        status: 202, // Accepted
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('[Error Tracking] Failed to handle error report:', error);
    
    // Still return success to client to avoid affecting user experience
    return NextResponse.json(
      { success: true }, // Still report success to client
      {
        status: 202,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 