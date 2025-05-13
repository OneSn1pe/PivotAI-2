#!/bin/bash

# Vercel deployment script
# This script helps ensure all required environment variables are set before deploying to Vercel

echo "=== Vercel Deployment Helper ==="
echo "This script will help ensure your Vercel deployment has all required environment variables."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Please install it with 'npm i -g vercel'"
    exit 1
fi

# Check if logged in to Vercel
echo "Checking Vercel login status..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "You are not logged in to Vercel. Please login first:"
    vercel login
fi

# List of required environment variables
declare -a REQUIRED_VARS=(
    "FIREBASE_PROJECT_ID"
    "FIREBASE_CLIENT_EMAIL" 
    "FIREBASE_PRIVATE_KEY"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

echo ""
echo "=== Checking environment variables ==="

# Check for .env.local file
if [ -f .env.local ]; then
    echo "Found .env.local file. Will use it as a reference."
    source .env.local
else
    echo "No .env.local file found. You'll need to enter values manually."
fi

# Prepare environment variables for Vercel
ENV_ARGS=""

for var in "${REQUIRED_VARS[@]}"; do
    # Check if variable exists in current environment (from .env.local)
    if [ -n "${!var}" ]; then
        value="${!var}"
        echo "✅ Found $var in environment"
    else
        echo "❌ $var not found in environment"
        echo -n "Please enter value for $var: "
        read value
    fi
    
    # Special handling for FIREBASE_PRIVATE_KEY which contains newlines
    if [ "$var" == "FIREBASE_PRIVATE_KEY" ]; then
        # Escape newlines for Vercel
        value=$(echo "$value" | sed 's/\\n/\\\\n/g')
    fi
    
    # Add to Vercel command
    ENV_ARGS="$ENV_ARGS -e $var=\"$value\""
done

# Special handling for production-specific variables
echo ""
echo "=== Production-specific settings ==="
echo "Do you want to enable debug mode in production? (not recommended for regular use)"
echo -n "Enable debug mode? (y/N): "
read debug_mode

if [[ "$debug_mode" == "y" || "$debug_mode" == "Y" ]]; then
    ENV_ARGS="$ENV_ARGS -e NEXT_PUBLIC_DEVELOPMENT_MODE=\"true\""
    echo "⚠️ Debug mode will be ENABLED in production"
else
    ENV_ARGS="$ENV_ARGS -e NEXT_PUBLIC_DEVELOPMENT_MODE=\"false\""
    echo "✅ Debug mode will be DISABLED in production (recommended)"
fi

# Generate the deployment command
DEPLOY_CMD="vercel deploy --prod $ENV_ARGS"

echo ""
echo "=== Deployment Command ==="
echo "The following command will be used for deployment:"
echo "$DEPLOY_CMD"
echo ""

echo -n "Do you want to deploy now? (y/N): "
read deploy_now

if [[ "$deploy_now" == "y" || "$deploy_now" == "Y" ]]; then
    echo "Deploying to Vercel..."
    eval $DEPLOY_CMD
else
    echo "Deployment cancelled. You can deploy manually using the command above."
fi

echo ""
echo "=== Post-Deployment Checklist ==="
echo "1. Verify Firebase Admin SDK initialization in logs"
echo "2. Test recruiter access using the debug page at /debug/recruiter-roadmap-test"
echo "3. Check server logs for any authentication or permission errors"
echo "4. Verify that session cookies are being set correctly"
echo "" 