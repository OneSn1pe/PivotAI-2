import { NextRequest, NextResponse } from 'next/server';

// Enable edge runtime for faster response with streaming
export const runtime = 'edge';

// A simple buffer to collect telemetry before sending to backend
let telemetryBuffer: any[] = [];
let bufferTimer: NodeJS.Timeout | null = null;
const MAX_BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 10000; // 10 seconds

// Function to process telemetry data
async function processTelemetryData(data: any[]) {
  if (data.length === 0) return;
  
  try {
    // In a production environment, you would send this to your analytics service
    // For now, we'll just log it to avoid adding external dependencies
    console.log(`[Telemetry] Processing ${data.length} telemetry records`);
    
    // For demonstration - in real implementation you would send to:
    // - Server logs
    // - Monitoring service
    // - Analytics platform
    
    // Here's where you would send the data to your backend service
    // This is where you'd implement actual persistence
  } catch (error) {
    console.error('[Telemetry] Failed to process telemetry:', error);
  }
}

// Function to flush the telemetry buffer
function flushBuffer() {
  if (telemetryBuffer.length === 0) return;
  
  const dataToProcess = [...telemetryBuffer];
  telemetryBuffer = [];
  
  // Process data without blocking
  processTelemetryData(dataToProcess).catch(err => {
    console.error('[Telemetry] Error in background processing:', err);
  });
}

// Set up periodic buffer flushing
function setupBufferFlush() {
  if (bufferTimer) return;
  
  bufferTimer = setInterval(() => {
    flushBuffer();
  }, FLUSH_INTERVAL_MS);
}

// Clean up the timer if needed (not typically called in serverless)
function cleanupBufferTimer() {
  if (bufferTimer) {
    clearInterval(bufferTimer);
    bufferTimer = null;
  }
}

// Handle CORS preflight requests
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

// Main telemetry endpoint
export async function POST(request: NextRequest) {
  try {
    setupBufferFlush();
    
    // Parse the request body
    const telemetryData = await request.json();
    
    // Add timestamp if not present
    if (!telemetryData.timestamp) {
      telemetryData.timestamp = new Date().toISOString();
    }
    
    // Add to buffer
    telemetryBuffer.push(telemetryData);
    
    // Flush if buffer is full
    if (telemetryBuffer.length >= MAX_BUFFER_SIZE) {
      flushBuffer();
    }
    
    // Return success immediately without waiting for processing
    return NextResponse.json(
      { success: true },
      {
        status: 202, // Accepted
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('[Telemetry] Error handling telemetry request:', error);
    
    // Still return success to client to avoid affecting user experience
    return NextResponse.json(
      { success: false, message: 'Failed to process telemetry data' },
      {
        status: 202, // Still accept the request even on error
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
} 