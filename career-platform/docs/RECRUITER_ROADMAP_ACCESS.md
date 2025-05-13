# Recruiter Access to Candidate Roadmaps

This document outlines the implementation of the feature allowing recruiters to access candidate roadmaps.

## Architecture Overview

The implementation follows a robust security pattern with multiple layers of protection:

1. **Server-side API with Authorization**
2. **Custom React Hook for Access Control**
3. **Protected Layout with Role-based Navigation**

## Components

### 1. Server-side API Route

Location: `/src/app/api/candidates/[id]/roadmap/route.ts`

This API route handles fetching roadmap data with proper authorization:

- Verifies the session cookie using Firebase Admin
- Checks if the user is a recruiter or the candidate themselves
- Returns both roadmap and candidate data if authorized
- Provides appropriate error responses for unauthorized access

Key security features:
- Server-side verification of authentication tokens
- Role-based access control
- Proper error handling with status codes

### 2. Custom Hook: useRoadmapAccess

Location: `/src/hooks/useRoadmapAccess.ts`

This custom React hook encapsulates the logic for accessing roadmaps:

- Handles authentication state
- Makes API requests to fetch roadmap data
- Manages loading and error states
- Determines access permissions based on user role

Usage example:
```tsx
const { roadmap, candidate, loading, error, hasAccess } = useRoadmapAccess(candidateId);
```

### 3. Protected Layout Component

Location: `/src/app/protected/layout.tsx`

The protected layout component handles navigation and access control:

- Verifies user authentication
- Checks user roles against requested paths
- Has special logic for allowing recruiters to view candidate profiles
- Redirects users to appropriate sections based on their role

## Security Considerations

1. **Multiple Layers of Protection**:
   - Client-side role checks
   - Server-side API authorization
   - Firebase security rules

2. **Token Verification**:
   - Session cookies are verified on the server
   - Firebase Admin SDK is used for secure token validation

3. **Role-based Access Control**:
   - Recruiters can only view, not modify candidate roadmaps
   - Candidates can only access their own roadmaps

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│  Firebase   │
│   Client    │◀────│  Server     │◀────│  Services   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ React UI    │     │ API Routes  │     │ Firestore   │
│ Components  │────▶│ w/ Auth     │────▶│ Database    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Implementation Benefits

1. **Separation of Concerns**:
   - UI components are decoupled from data fetching
   - Authentication logic is centralized
   - API routes handle data access control

2. **Improved Performance**:
   - Reduced client-side processing
   - Optimized data fetching
   - Proper error handling

3. **Better Maintainability**:
   - Clear responsibility boundaries
   - Reusable hooks and components
   - Centralized security logic

## Debugging and Troubleshooting

If access issues occur:

1. Check the browser console for API error responses
2. Verify that the user has the correct role in Firestore
3. Ensure Firebase security rules allow the appropriate access
4. Check that session cookies are being properly set and verified

## Future Improvements

1. Add caching for roadmap data to improve performance
2. Implement real-time updates using Firebase subscriptions
3. Add analytics to track recruiter engagement with candidate roadmaps 