/**
 * Centralized timeout configuration for the application
 * All timeout values are in milliseconds
 */

export const TIMEOUT_CONFIG = {
  // API Route Timeouts (must be less than Vercel function timeout)
  api: {
    // OpenAI operations
    analyzeResume: 120000,      // 2 minutes
    generateRoadmap: 280000,    // 4.67 minutes (leaving buffer for Vercel's 5 min limit)
    generateNextLevel: 280000,  // 4.67 minutes
    determineLevelType: 60000,  // 1 minute
    
    // Firebase operations
    firebaseRead: 30000,        // 30 seconds
    firebaseWrite: 30000,       // 30 seconds
    firebaseBatch: 60000,       // 1 minute for batch operations
    
    // Default API timeout
    default: 60000              // 1 minute
  },
  
  // Client-side timeouts
  client: {
    // Fetch operations
    fetchDefault: 60000,        // 1 minute
    fetchLongRunning: 300000,   // 5 minutes
    
    // UI feedback
    loadingIndicatorDelay: 500, // Show loading after 500ms
    errorMessageDuration: 5000, // Show errors for 5 seconds
    
    // Polling intervals
    progressPollInterval: 2000, // Poll every 2 seconds
    maxPollDuration: 300000     // Max polling for 5 minutes
  },
  
  // OpenAI specific settings
  openai: {
    timeout: 280000,            // 4.67 minutes
    maxRetries: 3,
    retryDelay: 1000,           // Initial retry delay
    retryBackoffMultiplier: 2   // Exponential backoff
  },
  
  // Vercel function limits (for reference)
  vercel: {
    functionTimeout: 300000     // 5 minutes max
  }
};

// Helper function to create AbortController with timeout
export function createTimeoutController(timeoutMs: number = TIMEOUT_CONFIG.client.fetchDefault) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    controller,
    clearTimeout: () => clearTimeout(timeoutId)
  };
}

// Helper to determine if error is a timeout
export function isTimeoutError(error: any): boolean {
  return (
    error?.name === 'AbortError' ||
    error?.code === 'ECONNABORTED' ||
    error?.message?.toLowerCase().includes('timeout') ||
    error?.message?.toLowerCase().includes('aborted')
  );
}

// Helper to format timeout duration for user display
export function formatTimeoutDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)} minutes`;
}

// Log timeout warning if operation is taking too long
export function logTimeoutWarning(operation: string, elapsedMs: number, timeoutMs: number) {
  const percentComplete = (elapsedMs / timeoutMs) * 100;
  if (percentComplete > 80) {
    console.warn(`[Crackd Analytics] ${operation} is taking longer than expected:`, {
      operation,
      elapsed: formatTimeoutDuration(elapsedMs),
      timeout: formatTimeoutDuration(timeoutMs),
      percentComplete: Math.round(percentComplete),
      timestamp: new Date().toISOString()
    });
  }
}