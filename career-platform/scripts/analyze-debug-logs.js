/**
 * Debug Log Analyzer
 * 
 * This script helps analyze debug logs collected from the browser console
 * to identify authentication and navigation issues.
 * 
 * Usage: 
 * 1. Copy the console logs from the browser into a text file
 * 2. Run: node scripts/analyze-debug-logs.js path/to/logs.txt
 */

const fs = require('fs');
const path = require('path');

// Get the log file path from command line argument
const logFilePath = process.argv[2];

if (!logFilePath) {
  console.error('Please provide a path to the log file');
  console.log('Usage: node scripts/analyze-debug-logs.js path/to/logs.txt');
  process.exit(1);
}

// Read the log file
let logs;
try {
  logs = fs.readFileSync(logFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading log file: ${error.message}`);
  process.exit(1);
}

// Parse and analyze logs
console.log('\n===== Debug Log Analysis =====\n');

// Count occurrences of different log types
const counts = {
  auth: 0,
  navigation: 0,
  cookies: 0,
  component: 0,
  middleware: 0,
  error: 0
};

// Extract key events
const authEvents = [];
const navigationEvents = [];
const cookieEvents = [];
const errorEvents = [];

// Simple regex patterns to identify log types
const logPatterns = {
  auth: /\[AUTH\]|\[AuthContext\]/i,
  navigation: /\[NAVIGATION\]|\[InterestedCandidatesPage\].*navigating/i,
  cookies: /\[COOKIES\]|cookie/i,
  component: /\[CandidateDetailPage\]|\[InterestedCandidatesPage\]/i,
  middleware: /\[MIDDLEWARE\]/i,
  error: /error|exception|warning|warn/i
};

// Process the logs line by line
const logLines = logs.split('\n');
logLines.forEach(line => {
  // Count log types
  Object.entries(logPatterns).forEach(([type, pattern]) => {
    if (line.match(pattern)) {
      counts[type]++;
      
      // Extract key events
      if (type === 'auth' && line.includes('Auth state changed')) {
        authEvents.push(line);
      }
      else if (type === 'navigation' && line.includes('Navigating to')) {
        navigationEvents.push(line);
      }
      else if (type === 'cookies' && line.includes('Cookies')) {
        cookieEvents.push(line);
      }
      else if (type === 'error') {
        errorEvents.push(line);
      }
    }
  });
});

// Print summary
console.log('Log Summary:');
console.log('-----------');
Object.entries(counts).forEach(([type, count]) => {
  console.log(`${type.padEnd(12)}: ${count} entries`);
});

// Print key events
console.log('\nKey Authentication Events:');
console.log('------------------------');
authEvents.slice(0, 10).forEach(event => console.log(`- ${event.substring(0, 100)}...`));
if (authEvents.length > 10) console.log(`... and ${authEvents.length - 10} more events`);

console.log('\nNavigation Events:');
console.log('-----------------');
navigationEvents.forEach(event => console.log(`- ${event.substring(0, 100)}...`));

console.log('\nCookie State Events:');
console.log('------------------');
cookieEvents.slice(0, 5).forEach(event => console.log(`- ${event.substring(0, 100)}...`));
if (cookieEvents.length > 5) console.log(`... and ${cookieEvents.length - 5} more events`);

console.log('\nErrors and Warnings:');
console.log('------------------');
errorEvents.forEach(event => console.log(`- ${event.substring(0, 100)}...`));

// Analyze the logs for common issues
console.log('\nIssue Analysis:');
console.log('--------------');

// Look for auth token issues
const tokenIssue = logs.includes('sessionStatus: missing') || logs.includes('hasSessionCookie: false');
if (tokenIssue) {
  console.log('✗ AUTH TOKEN ISSUE: Session cookie is missing during navigation');
} else {
  console.log('✓ Auth token appears to be present');
}

// Look for navigation timing issues
const timingIssue = logs.includes('Auth is still loading, waiting') && 
                   (logs.includes('No recruiter profile available') || logs.includes('Authentication required'));
if (timingIssue) {
  console.log('✗ TIMING ISSUE: Navigation happens before auth is completed');
} else {
  console.log('✓ Navigation timing seems adequate');
}

// Look for middleware issues
const middlewareIssue = logs.includes('Redirecting unauthenticated user');
if (middlewareIssue) {
  console.log('✗ MIDDLEWARE ISSUE: Middleware is redirecting to login page');
} else {
  console.log('✓ Middleware does not appear to be incorrectly redirecting');
}

// Look for race conditions
const raceCondition = logs.includes('Auth retry triggered');
if (raceCondition) {
  console.log('✗ RACE CONDITION: Auth retries needed due to timing issues');
} else {
  console.log('✓ No race condition detected in auth loading');
}

// Look for candidate loading issues
const candidateIssue = !logs.includes('Candidate data fetched successfully');
if (candidateIssue) {
  console.log('✗ DATA ISSUE: Candidate data not fetched successfully');
} else {
  console.log('✓ Candidate data fetching appears successful');
}

console.log('\nConclusion:');
console.log('-----------');
if (tokenIssue) {
  console.log('Primary issue appears to be with the AUTH TOKEN. Session cookie is missing during navigation.');
} else if (timingIssue) {
  console.log('Primary issue appears to be with TIMING. Navigation happens before auth is completed.');
} else if (middlewareIssue) {
  console.log('Primary issue appears to be with MIDDLEWARE. Requests are being incorrectly redirected.');
} else if (raceCondition) {
  console.log('Primary issue appears to be a RACE CONDITION in the authentication process.');
} else if (candidateIssue) {
  console.log('Primary issue appears to be with CANDIDATE DATA not being fetched successfully.');
} else {
  console.log('No obvious issues identified in the logs. More detailed manual analysis may be needed.');
}

console.log('\n=============================\n'); 