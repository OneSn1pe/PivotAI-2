#!/bin/bash

# Extract the Firebase project ID from .firebaserc
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
echo "Firebase project ID: $PROJECT_ID"

# Update Firebase Storage CORS rules
echo "Updating Firebase Storage CORS settings..."

# Try using the project ID directly
BUCKET_NAME="$PROJECT_ID.appspot.com"
echo "Attempting to update CORS for bucket: $BUCKET_NAME"
gsutil cors set cors.json gs://$BUCKET_NAME

# If the above fails, also try these common formats:
echo "If the above command failed, try these commands manually:"
echo "gsutil cors set cors.json gs://$PROJECT_ID.appspot.com"
echo "gsutil cors set cors.json gs://pivotai-7f6ef.appspot.com"
echo "firebase deploy --only storage"

echo "CORS settings update attempted. Check output for any errors." 