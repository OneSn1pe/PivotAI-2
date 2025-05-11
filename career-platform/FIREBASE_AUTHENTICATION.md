# Firebase Authentication and Role Claims Guide

## Overview

This document explains how the Firebase authentication system works in the PivotAI application, with a focus on the implementation of role-based access control using Firebase Auth custom claims.

## Authentication Flow

1. Users sign up or log in through Firebase Authentication (email/password or Google provider)
2. User data is stored in Firestore with role information
3. After authentication, role claims are added to the Firebase ID token
4. The application uses these claims to control access to features and resources

## Role Claims Implementation

The application provides multiple endpoints for setting role claims:

1. `/api/auth/set-role-claim` - Primary endpoint using Firebase Admin SDK
2. `/api/set-custom-claims` - Secondary endpoint also using Firebase Admin SDK
3. `/api/auth/edge-set-role` - Edge runtime fallback for environments where Admin SDK initialization fails

The system is designed with fallback mechanisms to ensure role claims can be updated regardless of the deployment environment.

## Debugging Tools

When role-based access issues occur, use the following tools:

1. **Token Claims Debug Page**: `/debug/token-claims`
   - Displays current user information and token claims
   - Provides buttons to refresh tokens and update role claims manually
   - Shows admin actions for updating all users

2. **Firebase Console**
   - Check Authentication > Users to verify user existence
   - Check Firestore > users collection to verify role data

## Common Issues and Solutions

### Issue: Role claims not present in token

**Solution**:
1. Visit `/debug/token-claims`
2. Click "Update Role Claim"
3. Refresh the token
4. Log out and log back in (tokens are only fully refreshed on new login)

### Issue: Firestore security rules denying access

**Solution**:
The rules are designed to check both token claims and database roles:
```
// Helper function to check if user is a recruiter using token claims
function isRecruiter() {
  return request.auth != null && 
    (
      // Primary method: Check token claims (preferred and more efficient)
      (request.auth.token.role == "recruiter" || 
       request.auth.token.role == "RECRUITER" ||
       request.auth.token.role == "Recruiter") ||
      
      // Fallback method: Check Firestore document (for backwards compatibility)
      (
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "recruiter" || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "RECRUITER" ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Recruiter")
      )
    );
}
```

### Issue: Build errors with Firebase Admin SDK

**Solution**:
- The application now uses conditional initialization of Firebase Admin SDK
- Edge runtime API is available as a fallback
- Environment variables must be properly set in production

## Environment Variables

The following environment variables are required:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key-with-newlines"
```

Alternatively, you can provide the full service account JSON as:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

## Case Sensitivity Issues

The application has been updated to perform case-insensitive comparisons for:

1. Company names in interested candidates matches
2. Role values in Firestore security rules

Always use toLowerCase() when comparing strings that might have inconsistent casing.

## Maintaining the System

When adding new role-based features:

1. Update Firestore security rules to check both token claims and database roles
2. Use case-insensitive comparisons for string values
3. Test in both development and production environments
4. Add appropriate debugging tools for new functionality

## Troubleshooting in Production

If issues occur in production:

1. Check Vercel logs for API error messages
2. Verify environment variables are correctly set
3. Test token claims using the debug page
4. Consider using the Edge runtime API for critical authentication functions 