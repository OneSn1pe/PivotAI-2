import { NextResponse } from 'next/server';

export async function GET() {
  // Only show that environment variables exist, not their actual values
  // This is safer than exposing actual API keys
  return NextResponse.json({
    environment: process.env.NODE_ENV || 'unknown',
    variables: {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      // Add any other environment variables you want to check
    },
    timestamp: new Date().toISOString(),
  });
} 