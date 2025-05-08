# Debugging Instructions - Profile View Redirect Issue

This guide explains how to use the debug tools to identify why recruiters are being redirected to a homescreen when viewing candidate profiles from the interested page.

## Potential Issues

We've identified 5 possible causes for the redirect issue:

1. **Authentication Token Loss**: The session cookie gets lost during navigation
2. **Navigation Timing Issue**: Navigation happens before auth state is fully established
3. **Middleware Redirection**: Middleware incorrectly redirects protected routes
4. **Race Condition**: Race condition between navigation and authentication state
5. **Candidate Data Issue**: Problems with fetching the candidate data

## Setup for Debugging

1. Deploy these changes to the test environment
2. Open Chrome DevTools (F12 or right-click > Inspect)
3. Go to the Console tab
4. Make sure "Preserve log" is checked (to keep logs across page navigations)
5. Clear the console (click the 🚫 icon)

## Steps to Reproduce the Issue

1. Log in as a recruiter
2. Navigate to the Interested Candidates page
3. Click "View Full Profile" on any candidate
4. Observe what happens (redirect to homescreen)
5. Check the console logs for clues

## Interpreting the Logs

The logs will be color-coded and grouped by category:

- **[AUTH]** - Purple - Authentication state changes
- **[NAVIGATION]** - Green - Navigation events
- **[COOKIES]** - Blue - Cookie state checks
- **[CandidateDetailPage]** - Component-specific logs
- **[InterestedCandidatesPage]** - Component-specific logs
- **[MIDDLEWARE]** - Middleware processing

## Analyzing the Results

1. **After reproducing the issue**, save the console logs:
   - Right-click in the console
   - Select "Save as..."
   - Save to a text file (e.g., `debug-logs.txt`)

2. **Run the log analyzer script**:
   ```
   node scripts/analyze-debug-logs.js path/to/debug-logs.txt
   ```

3. **Review the analyzer output** to see which issue is identified:

   ```
   ===== Debug Log Analysis =====

   Log Summary:
   -----------
   auth        : 12 entries
   navigation  : 5 entries
   cookies     : 8 entries
   component   : 25 entries
   middleware  : 10 entries
   error       : 3 entries

   ...

   Issue Analysis:
   --------------
   ✓ Auth token appears to be present
   ✗ TIMING ISSUE: Navigation happens before auth is completed
   ✓ Middleware does not appear to be incorrectly redirecting
   ✗ RACE CONDITION: Auth retries needed due to timing issues
   ✓ Candidate data fetching appears successful

   Conclusion:
   -----------
   Primary issue appears to be with TIMING. Navigation happens before auth is completed.
   ```

## Manual Log Analysis

If the automatic analyzer doesn't provide a clear answer, look for these specific patterns:

1. **Token Loss Issue**:
   - Look for `[COOKIES]` logs showing `hasSessionCookie: false` after navigation
   - Check for `session cookie cleared` messages

2. **Navigation Timing Issue**:
   - Look for `Auth is still loading, waiting` followed by `No recruiter profile available`
   - Check if `authLoading: true` persists when the candidate page loads

3. **Middleware Issue**:
   - Look for `[MIDDLEWARE] Redirecting unauthenticated user`
   - Check HTTP headers in the Network tab for middleware redirects

4. **Race Condition**:
   - Look for auth retry messages: `Auth retry triggered`
   - Check if auth state repeatedly changes during navigation

5. **Candidate Data Issue**:
   - Look for errors in `Fetching candidate profile`
   - Check if candidate data is successfully loaded but then the page redirects

## Resolution Approach

Once you've identified the specific issue:

1. **Token Loss**: Implement longer cookie expiry and stronger persistence
2. **Timing Issue**: Add delays or state checks before navigation
3. **Middleware**: Fix middleware to properly handle internal navigation
4. **Race Condition**: Implement more robust state synchronization
5. **Data Issue**: Fix the data fetching logic or error handling

## Support

If you need help interpreting the logs or resolving the issue, please contact the development team. 