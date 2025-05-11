#!/bin/bash

# PivotAI Career Platform Deployment Script
# This script deploys to production with special configuration for recruiter access

echo "Starting PivotAI Career Platform deployment..."

# Build with production configuration
echo "Building application with fixed recruiter access..."
NEXT_PUBLIC_DEVELOPMENT_MODE=true npm run build

# Deploy Firestore rules
echo "Deploying fixed Firestore rules..."
firebase deploy --only firestore:rules

# Deploy the application
echo "Deploying application to Vercel..."
npx vercel --prod

echo "Setting production environment variables..."
npx vercel env add NEXT_PUBLIC_DEVELOPMENT_MODE production true

echo "Deployment completed. Please verify these manual steps:"
echo "1. Verify Firestore rules are updated in Firebase console"
echo "2. Check that NEXT_PUBLIC_DEVELOPMENT_MODE is set to 'true' in Vercel"
echo "3. Test recruiter access to candidate roadmaps in production"

exit 0 