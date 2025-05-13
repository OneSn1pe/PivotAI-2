/**
 * Environment utility functions for consistent environment detection
 * across the application.
 */

/**
 * Checks if the application is running in development mode
 * This checks both the NODE_ENV and the hostname
 */
export function isDevelopmentMode(): boolean {
  const isDevelopmentEnv = process.env.NODE_ENV === 'development';
  const isDevFlag = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  return isDevelopmentEnv || isDevFlag || isLocalhost;
}

/**
 * Checks if the application is running in production mode
 */
export function isProductionMode(): boolean {
  return !isDevelopmentMode();
}

/**
 * Logs environment information for debugging
 */
export function logEnvironmentInfo(prefix: string = ''): void {
  const logPrefix = prefix ? `[${prefix}]` : '';
  
  console.log(`${logPrefix} Environment Info:`, {
    nodeEnv: process.env.NODE_ENV,
    isDev: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isDevelopment: isDevelopmentMode(),
    isProduction: isProductionMode()
  });
}

/**
 * Gets the appropriate cookie options based on environment
 */
export function getCookieOptions(maxAge: number = 3600): { [key: string]: string } {
  const isDevMode = isDevelopmentMode();
  
  if (isDevMode) {
    return {
      path: '/',
      'max-age': maxAge.toString()
    };
  } else {
    return {
      path: '/',
      'max-age': maxAge.toString(),
      secure: 'true',
      samesite: 'strict'
    };
  }
}

/**
 * Sets a cookie with appropriate options for the current environment
 */
export function setCookie(name: string, value: string, maxAge: number = 3600): void {
  if (typeof document === 'undefined') return;
  
  const options = getCookieOptions(maxAge);
  const cookieString = Object.entries(options)
    .reduce((acc, [key, val]) => `${acc}; ${key}=${val}`, `${name}=${value}`);
  
  document.cookie = cookieString;
}

/**
 * Gets a cookie by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return undefined;
}

/**
 * Deletes a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
} 