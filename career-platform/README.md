# PivotAI Career Platform

A Next.js application for AI-powered career guidance and resume analysis.

## Features

- **Resume Analysis**: Extract skills, experience, education, strengths, weaknesses, and recommendations from resumes using AI
- **Career Roadmap Generation**: Generate personalized career roadmaps based on resume analysis and target companies
- **Debug Tools**: Test and debug the resume analysis functionality

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository

2. Navigate to the project directory:
   ```
   cd career-platform
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Debug Tools

### Resume Analysis Debug UI

The application includes a debugging UI specifically for testing the resume analysis functionality:

1. Navigate to [http://localhost:3000/resume-debug](http://localhost:3000/resume-debug) in your browser
2. Enter a resume text in the provided textarea
3. Click "Analyze Resume" to submit the resume for analysis
4. View the extracted information, including:
   - Skills
   - Experience
   - Education
   - Strengths
   - Weaknesses
   - Recommendations
   - Debug information

### API Endpoints

- **POST /api/analyze-resume**: Analyze a resume
  - Body: `{ "resumeText": "Your resume text here..." }`
  - Returns: A structured analysis of the resume

- **POST /api/generate-roadmap**: Generate a career roadmap
  - Body: `{ "resumeAnalysis": {...}, "targetCompanies": [...] }`
  - Returns: A personalized career roadmap

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying the application to production. 