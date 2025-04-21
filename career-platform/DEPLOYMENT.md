# Deployment Guide for PivotAI

This guide will help you deploy the PivotAI application to a production environment using Vercel.

## Prerequisites

- A Vercel account
- An OpenAI API key

## Environment Variables

Before deploying, make sure to set the following environment variables in your Vercel project settings:

- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXT_PUBLIC_API_URL`: This will be automatically set by Vercel, but should point to your deployed URL
- `NODE_ENV`: Will be set to "production" by Vercel automatically

## Deployment Steps

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI if you haven't already:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Navigate to the project directory:
   ```
   cd career-platform
   ```

4. Deploy to production:
   ```
   vercel --prod
   ```

5. When prompted, provide your OpenAI API key as an environment variable.

### Option 2: Deploy with Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Import your project in the Vercel dashboard.

3. Configure the project:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. Add the environment variables in the project settings:
   - OPENAI_API_KEY: Your OpenAI API key

5. Deploy the application.

## Testing the Deployment

After deployment, you can test the application using the following endpoints:

- Resume Debug UI: `https://your-deployed-url.vercel.app/resume-debug`
- Resume Analysis API: `https://your-deployed-url.vercel.app/api/analyze-resume`

## Troubleshooting

If you encounter any issues with CORS or API access:

1. Verify that your OpenAI API key is correctly set in the environment variables.
2. Check that the CORS headers are properly configured in `next.config.js` and `vercel.json`.
3. Use the debug endpoint (`/resume-debug`) to test and diagnose API issues.

## Local Testing Before Deployment

Before deploying to production, it's recommended to build and test your application locally:

```
npm run build
npm run start
```

This will create a production build and serve it locally at `http://localhost:3000`. 