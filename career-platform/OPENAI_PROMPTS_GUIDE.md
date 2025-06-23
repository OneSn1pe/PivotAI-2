# OpenAI Prompts Documentation

This document contains all OpenAI prompts used in the PivotAI Career Platform, their locations, purposes, and parameters.

## Table of Contents
1. [Resume Analysis Prompt](#resume-analysis-prompt)
2. [Career Roadmap Generation Prompt](#career-roadmap-generation-prompt)
3. [Configuration & Parameters](#configuration--parameters)

---

## Resume Analysis Prompt

### Location
`/src/app/api/analyze-resume/route.ts` (Lines 210-226)

### Purpose
Analyzes uploaded resume text to extract structured information about the candidate's professional profile.

### System Prompt
```
You are a helpful resume analysis assistant. Extract key information from resumes and provide structured data in JSON format.
```

### User Prompt Template
```
Analyze the following resume and extract key information. Return the data in the following JSON structure:
{
  "skills": [list of technical and soft skills as an array of strings],
  "experience": [list of job titles/positions as an array of strings],
  "education": [list of educational qualifications as an array of strings],
  "strengths": [list of strong points as an array of strings],
  "weaknesses": [list of areas for improvement as an array of strings],
  "recommendations": [list of recommended job roles based on the profile as an array of strings],
  "summary": "A brief 2-3 sentence summary of the candidate's profile",
  "languages": [list of languages as an array of strings],
  "quality_score": number from 1-10
}

IMPORTANT: Use the EXACT field names shown above. Make sure all arrays are properly formatted.
For any field that cannot be determined, use an empty array [] or appropriate default value.
```

### Parameters
- **Model**: `gpt-4o` (consistent across all endpoints)
- **Temperature**: `0.2` (low for consistent output)
- **Max Tokens**: `1500`
- **Response Format**: `{ type: 'json_object' }`

### Output Structure
```typescript
{
  skills: string[];
  experience: string[];
  education: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary?: string;
  languages?: string[];
  quality_score?: number;
}
```

---

## Career Roadmap Generation Prompt

### Location
`/src/app/api/generate-roadmap/route.ts` (Lines 158-331)

### Purpose
Generates a personalized, leveled career roadmap based on resume analysis and target companies.

### System Prompt
```
You are a career coach specializing in helping candidates prepare for roles at top companies.
```

### User Prompt Template
```
Create a personalized LEVELED career roadmap for a candidate targeting positions at the following companies: [COMPANY_LIST] within the next 1-2 years.

IMPORTANT: This roadmap uses a PROGRESSIVE LEVELING SYSTEM where milestones are organized into levels that build upon each other. Include both SKILL DEVELOPMENT milestones and CAREER PROGRESSION milestones with appropriate level assignments.

LEVELING SYSTEM REQUIREMENTS:
- Assign each milestone an appropriate LEVEL (1-10) based on difficulty and prerequisites
- Lower level milestones (1-3) should focus on fundamentals and entry-level skills
- Mid level milestones (4-6) should build practical application and specialization
- Higher level milestones (7-10) should emphasize leadership, expertise, and advanced skills

Return a structured JSON roadmap with these components:
{
  "milestones": [
    {
      "id": "[UUID]",
      "title": "Milestone name",
      "description": "Detailed description with actionable steps",
      "category": "technical|fundamental|niche|soft|career",
      "subcategory": "Optional specific classification",
      "skills": ["skill1", "skill2"],
      "timeframe": "1-3 months",
      "completed": false,
      "difficulty": 1-5,
      "priority": "low|medium|high|critical",
      "estimatedHours": 40,
      "level": 2,
      "successCriteria": ["criterion1", "criterion2"],
      "attributes": {
        "career": {
          "positionLevel": "entry-level|junior|mid-level|senior|lead|principal|executive",
          "targetRole": "Specific job title",
          "experienceRequired": "1-2 years",
          "keyResponsibilities": ["responsibility1", "responsibility2"],
          "advancement_path": {
            "toRole": "Next career step",
            "timeInRole": "12-18 months",
            "promotionCriteria": ["criteria1", "criteria2"]
          },
          "skillRequirements": {
            "technical": ["skill1", "skill2"],
            "soft": ["skill1", "skill2"]
          },
          "compensation": {
            "salaryRange": "$60k-80k",
            "growthPotential": "Strong upward trajectory"
          },
          "applicationStrategy": {
            "whereToApply": ["Company types or specific companies"],
            "networking": ["strategy1", "strategy2"],
            "portfolioNeeds": ["requirement1", "requirement2"]
          },
          "experienceBuilding": {
            "projectTypes": ["type1", "type2"],
            "certifications": ["cert1", "cert2"]
          },
          "careerImpact": "stepping-stone|destination|specialization|leadership-track",
          "marketDemand": "high|medium|low"
        }
      },
      "resources": [
        {
          "title": "Actual resource title (e.g., 'React - The Complete Guide' on Udemy)",
          "url": "https://actual-url.com (MUST be a real, working URL)",
          "type": "course|book|project|article|documentation|certification|video|tutorial|tool",
          "estimatedTime": "2 weeks",
          "cost": "free|paid|freemium",
          "description": "Brief description of what this resource covers"
        }
      ],
      "tasks": [
        {
          "id": "task-1",
          "description": "Complete tutorial",
          "completed": false
        }
      ]
    },
    ...
  ],
  "candidateGapAnalysis": {
    "currentStrengths": ["strength1", ...],
    "criticalGaps": ["gap1", ...]
  },
  "targetRoleRequirements": ["requirement1", ...],
  "successMetrics": ["metric1", ...]
}

MILESTONE CATEGORIES:
- "technical": Programming, software development, frameworks, databases, APIs, coding projects
- "fundamental": Problem-solving, system design, architecture, debugging, testing, core concepts
- "niche": Specialized technologies like blockchain, AI/ML, AR/VR, IoT, emerging technologies
- "soft": Communication, leadership, teamwork, emotional intelligence, time management, networking
- "career": INTERMEDIATE POSITIONS and work experience opportunities (NEW FOCUS AREA)

CAREER PROGRESSION STRATEGY:
For each target company/position, identify 2-3 intermediate positions that would build relevant experience:

Example Career Progression Path for "Google - Senior Software Engineer":
1. Junior Software Developer (6-12 months experience building)
2. Software Developer (1-2 years gaining mid-level experience) 
3. Senior Software Developer (2-3 years developing leadership skills)
4. Target: Senior Software Engineer at Google

[Additional detailed instructions for each category...]

Candidate's current profile:
- Skills: [SKILLS_LIST]
- Experience: [EXPERIENCE_LIST]
- Education: [EDUCATION_LIST]
- Strengths: [STRENGTHS_LIST]
- Weaknesses: [WEAKNESSES_LIST]

Guidelines:
- Create exactly 6 milestones (2 technical, 2 fundamental, 1 niche, 1 soft)
- Each milestone needs a unique ID
- LEVEL ASSIGNMENT: Distribute milestones across levels 1-6 with logical progression
- Include exactly 3 specific resources per milestone
- Add 1-3 tasks per milestone for progress tracking
- Include success criteria for each milestone
- Estimate hours required (20-100 hours per milestone)
- Set appropriate difficulty (1-5) and priority levels
- Ensure level progression feels rewarding and logical
- Resources should be high-quality, free or low-cost, and directly relevant
- Prefer official documentation and well-known learning platforms
- CRITICAL: All resources must be real, verified, and from reputable sources
- Return ONLY valid JSON with no additional text or formatting
```

### Parameters
- **Model**: `gpt-4o` (consistent across all endpoints)
- **Temperature**: `0.2` (low for consistent output)
- **Max Tokens**: `3000`

### Dynamic Elements
- Company list from user's target companies
- Resume analysis data (skills, experience, education, strengths, weaknesses)
- Unique UUID generated for each milestone

---

## Configuration & Parameters

### OpenAI Client Configuration
**Location**: `/src/app/api/generate-roadmap/route.ts` (Lines 24-28)

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 300000, // 5 minute timeout
  maxRetries: 3,   // Retry 3 times on transient errors
});
```

### Error Handling
Both endpoints implement:
- Retry logic with exponential backoff for rate limits
- Timeout handling (2-5 minutes depending on endpoint)
- Fallback responses for OpenAI failures
- Detailed error logging and debugging

### Response Validation
- JSON parsing with error handling
- Field validation and fallback values
- Alternative field name mapping (e.g., `skills` → `technical_skills`)
- Empty array defaults for missing fields

---

## Resource Generation Guidelines

The roadmap generation prompt includes specific requirements for learning resources:

### Required Resource Attributes
- **Real URLs**: Must link to actual, working websites
- **Descriptive Titles**: Match the actual resource name
- **Type Classification**: course, book, video, tutorial, documentation, etc.
- **Time Estimates**: Realistic completion timeframes
- **Cost Information**: free, paid, or freemium
- **Description**: Brief summary of content covered

### Approved Resource Sources
1. **Online Learning Platforms**
   - Coursera, Udemy, edX, Pluralsight
   - LinkedIn Learning, Skillshare, Codecademy
   - FreeCodeCamp, The Odin Project

2. **Documentation & References**
   - Official documentation (React.dev, Vue.js, Angular.io)
   - MDN Web Docs, W3Schools
   - GitHub repositories with learning materials

3. **Video Content**
   - YouTube channels (freeCodeCamp, Traversy Media, etc.)
   - Conference talks and tutorials
   - MIT OpenCourseWare

4. **Books & Publications**
   - O'Reilly Learning, Amazon
   - Publisher websites
   - Free programming books repositories

5. **Interactive Resources**
   - Coding challenge platforms
   - Interactive tutorials
   - Project-based learning repositories

### Example Resource Formats
```json
{
  "title": "JavaScript Algorithms and Data Structures",
  "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
  "type": "course",
  "estimatedTime": "300 hours",
  "cost": "free",
  "description": "Interactive coding challenges covering fundamental JavaScript concepts"
}
```

---

## Usage Notes

1. **Resume Analysis**: Called when users upload resumes, expects plain text input
2. **Roadmap Generation**: Called after resume analysis, requires target companies
3. **Both prompts use JSON response format** for structured, predictable outputs
4. **Low temperature (0.2)** ensures consistent, focused responses
5. **Detailed field specifications** prevent ambiguous outputs
6. **Fallback mechanisms** ensure the app continues working even if OpenAI fails
7. **Resource URLs must be real and verifiable** - no placeholder or generic links

---

## Future Enhancements

Potential areas for prompt improvement:
- Industry-specific resume analysis
- Multi-language support
- More granular skill categorization
- Dynamic milestone count based on experience level
- Integration with real-time job market data

---

*Last Updated: December 2024*