/**
 * Debug utility functions for troubleshooting authentication and navigation issues
 */

// Global debug namespace
export const DEBUG = {
  AUTH: true,
  NAVIGATION: true,
  COOKIES: true,
  COMPONENT_LIFECYCLE: true
};

/**
 * Log authentication related debug information
 */
export function logAuth(message: string, data?: any): void {
  if (!DEBUG.AUTH) return;
  
  console.group(`%c[AUTH] ${message}`, 'color: #4f46e5; font-weight: bold;');
  
  if (data) {
    console.log(data);
  }
  
  // Always log the current cookie state with auth logs
  if (DEBUG.COOKIES) {
    logCookies('Current cookies');
  }
  
  console.groupEnd();
}

/**
 * Log navigation related debug information
 */
export function logNavigation(message: string, data?: any): void {
  if (!DEBUG.NAVIGATION) return;
  
  console.group(`%c[NAVIGATION] ${message}`, 'color: #059669; font-weight: bold;');
  
  if (data) {
    console.log(data);
  }
  
  console.groupEnd();
}

/**
 * Log component lifecycle related debug information
 */
export function logComponent(componentName: string, message: string, data?: any): void {
  if (!DEBUG.COMPONENT_LIFECYCLE) return;
  
  console.group(`%c[${componentName}] ${message}`, 'color: #7c3aed; font-weight: bold;');
  
  if (data) {
    console.log(data);
  }
  
  console.groupEnd();
}

/**
 * Log cookie state
 */
export function logCookies(message: string): void {
  if (!DEBUG.COOKIES) return;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key) {
      acc[key] = value || '';
    }
    return acc;
  }, {} as Record<string, string>);
  
  const hasSessionCookie = 'session' in cookies;
  const sessionLength = cookies.session ? cookies.session.length : 0;
  
  console.group(`%c[COOKIES] ${message}`, 'color: #0891b2; font-weight: bold;');
  console.log({
    cookieNames: Object.keys(cookies),
    hasSessionCookie,
    sessionLength,
    // Don't log the actual token value for security
    sessionStatus: hasSessionCookie 
      ? (sessionLength > 50 ? 'valid-looking' : 'suspicious-looking') 
      : 'missing',
    cookies
  });
  console.groupEnd();
}

/**
 * Initialize debugging on a page
 * Call this once at the top level of a page to set up debugging
 */
export function initDebug(pageName: string): void {
  console.log(`%c[DEBUG] Initializing debug for ${pageName}`, 'color: #dc2626; font-weight: bold; font-size: 14px;');
  
  // Log navigation events
  if (DEBUG.NAVIGATION) {
    try {
      // Log navigation information
      const referrer = document.referrer;
      const currentUrl = window.location.href;
      const urlParams = Object.fromEntries(new URLSearchParams(window.location.search));
      
      logNavigation('Page loaded', {
        page: pageName,
        url: currentUrl,
        referrer,
        params: urlParams
      });
    } catch (e) {
      console.error('Error setting up navigation debugging', e);
    }
  }
  
  // Log cookie state on init
  if (DEBUG.COOKIES) {
    logCookies('Initial cookie state');
  }
}

/**
 * Create a hook that will trigger debugging before navigation
 */
export function debugBeforeNavigation(url: string, reason: string = 'unknown'): void {
  logNavigation(`Preparing to navigate to ${url}`, {
    from: window.location.href,
    to: url,
    reason
  });
  
  logCookies('Cookies before navigation');
} 