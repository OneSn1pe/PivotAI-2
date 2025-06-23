// Shared constants for OpenAI prompts to reduce redundancy

export const PROMPT_CONSTANTS = {
  // Common instructions
  JSON_FORMAT: "Return ONLY valid JSON with no additional text or formatting.",
  RESOURCE_QUALITY: "All resources must be real, verified URLs from reputable sources (Coursera, Udemy, official docs, etc.).",
  FIELD_NAMES: "Use exact field names as specified in the JSON structure.",
  
  // System messages
  SYSTEM_MESSAGES: {
    RESUME_ANALYST: "You are an AI resume analyst. Extract structured information from resumes in JSON format.",
    CAREER_COACH: "You are an expert career coach specializing in personalized career development.",
    CAREER_ADVISOR: "You are an expert career advisor and job market analyst."
  },
  
  // Resource examples (minimal set)
  RESOURCE_EXAMPLES: `Examples:
- Course: https://www.coursera.org/learn/react-basics
- Documentation: https://react.dev/learn
- Tutorial: https://www.freecodecamp.org/learn/
- Book: https://www.oreilly.com/library/
- Project: https://github.com/practical-tutorials/project-based-learning`,

  // Milestone categories
  CATEGORIES: {
    TECHNICAL: "Programming, frameworks, tools, coding projects",
    FUNDAMENTAL: "Problem-solving, system design, core concepts",
    NICHE: "Specialized technologies (AI/ML, blockchain, etc.)",
    SOFT: "Communication, leadership, teamwork",
    CAREER: "Job positions and career progression"
  },

  // Common milestone requirements
  MILESTONE_REQUIREMENTS: {
    RESOURCES_PER_MILESTONE: 3,
    TASKS_PER_MILESTONE: "1-3",
    HOURS_RANGE: "20-100",
    DIFFICULTY_RANGE: "1-5"
  }
};

// Simplified career attributes (only fields actually used in UI)
export const CAREER_ATTRIBUTES_SCHEMA = {
  targetRole: "string - Target job title",
  experienceRequired: "string - Years of experience needed",
  keyResponsibilities: "string[] - Main responsibilities",
  skillRequirements: {
    technical: "string[] - Technical skills needed",
    soft: "string[] - Soft skills needed"
  },
  careerImpact: "stepping-stone | destination | specialization",
  marketDemand: "high | medium | low"
};

// Simplified resume analysis schema (removed unused fields)
export const RESUME_ANALYSIS_SCHEMA = {
  skills: "string[] - Technical and soft skills",
  experience: "string[] - Work experiences",
  education: "string[] - Educational qualifications",
  strengths: "string[] - Key strengths",
  weaknesses: "string[] - Areas for improvement",
  recommendations: "string[] - Recommended job roles"
};