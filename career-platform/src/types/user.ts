export enum UserRole {
    CANDIDATE = 'candidate',
    RECRUITER = 'recruiter',
  }
  
  export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
    lastLogin: Date;
    provider?: 'password' | 'google' | 'linkedin';
  }
  
  export interface CandidateProfile extends User {
    role: UserRole.CANDIDATE;
    resumeUrl?: string;
    resumeFileName?: string;
    resumeAnalysis?: ResumeAnalysis;
    jobPreferences?: JobPreferences;
    targetCompanies?: TargetCompany[];
    skills?: string[];
    updatedAt?: Date;
  }
  
  export interface RecruiterProfile extends User {
    role: UserRole.RECRUITER;
    company: string;
    position: string;
    bookmarkedCandidates?: string[];
  }
  
  export interface ResumeAnalysis {
    skills: string[];
    experience: string[];
    education: string[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    _error?: string;
    _rawResponse?: string;
    _debug?: {
      processingTime?: number;
      openaiTime?: number;
      resumeLength?: number;
      resumeTruncated?: boolean;
      timestamp?: string;
      [key: string]: any;
    };
  }
  
  export interface JobPreferences {
    roles: string[];
    locations: string[];
    remotePreference: 'remote' | 'hybrid' | 'onsite';
    salaryExpectation: number;
    industries: string[];
  }

  export interface TargetCompany {
    name: string;
    position: string;
  }
  
  export interface CareerRoadmap {
    id: string;
    candidateId: string;
    milestones: Milestone[];
    createdAt: Date;
    updatedAt: Date;
  }

  // Enhanced milestone categorization types
  export type MilestoneCategory = 'technical' | 'fundamental' | 'niche' | 'soft';

  // Technical milestone attributes
  export interface TechnicalAttributes {
    technologies: string[];
    programmingLanguages?: string[];
    frameworks?: string[];
    tools?: string[];
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'ai-ml';
    complexityLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    deliverables: {
      type: 'code-repository' | 'deployed-app' | 'api' | 'documentation' | 'demo';
      description: string;
      url?: string;
    }[];
    performanceTargets?: {
      metric: string;
      target: string;
    }[];
    learningPath: 'guided' | 'self-directed' | 'mentored' | 'bootcamp';
    certificationAvailable?: boolean;
  }

  // Fundamental milestone attributes
  export interface FundamentalAttributes {
    competencyArea: 'problem-solving' | 'analytical-thinking' | 'research' | 'documentation' | 'testing' | 'debugging';
    industryScope: 'universal' | 'tech-specific' | 'domain-specific';
    careerStage: 'entry-level' | 'mid-level' | 'senior-level' | 'all-levels';
    conceptualAreas: string[];
    theoreticalDepth: 'surface' | 'intermediate' | 'deep' | 'research-level';
    applicationAreas: string[];
    buildsUpon: string[];
    enablesAdvancement: string[];
    knowledgeType: 'declarative' | 'procedural' | 'conceptual' | 'metacognitive';
  }

  // Niche milestone attributes
  export interface NicheAttributes {
    specializationDomain: string;
    marketDemand: 'emerging' | 'growing' | 'stable' | 'declining';
    expertiseLevel: 'awareness' | 'working-knowledge' | 'proficiency' | 'expertise' | 'thought-leadership';
    industryAdoption: 'experimental' | 'early-adopter' | 'mainstream' | 'mature';
    competitorLandscape: 'few-experts' | 'moderate-competition' | 'highly-competitive';
    careerImpact: 'differentiator' | 'requirement' | 'nice-to-have' | 'cutting-edge';
    salaryPremium?: number;
    learningCurve: 'steep' | 'moderate' | 'gradual';
    resourceAvailability: 'abundant' | 'moderate' | 'scarce';
    communitySize: 'large' | 'medium' | 'small' | 'niche';
    trendDirection: 'rising' | 'stable' | 'declining';
    longevityEstimate: '1-2 years' | '3-5 years' | '5+ years' | 'evergreen';
  }

  // Soft skill milestone attributes
  export interface SoftAttributes {
    skillCategory: 'communication' | 'leadership' | 'teamwork' | 'emotional-intelligence' | 'time-management' | 'adaptability' | 'creativity' | 'critical-thinking';
    developmentMethod: 'practice-based' | 'feedback-driven' | 'mentorship' | 'self-reflection' | 'training-program';
    applicationScenarios: string[];
    roleRelevance: 'individual-contributor' | 'team-lead' | 'manager' | 'executive' | 'all-roles';
    assessmentDifficulty: 'objective' | 'somewhat-subjective' | 'highly-subjective';
    measurementMethods: string[];
    behavioralMarkers: {
      indicator: string;
      frequency: 'daily' | 'weekly' | 'project-based' | 'situational';
    }[];
    developmentTimeframe: 'weeks' | 'months' | 'years' | 'career-long';
    improvementPattern: 'linear' | 'plateau-breakthrough' | 'continuous' | 'milestone-based';
  }

  // Category-specific attributes interface
  export interface MilestoneAttributes {
    technical?: TechnicalAttributes;
    fundamental?: FundamentalAttributes;
    niche?: NicheAttributes;
    soft?: SoftAttributes;
  }

  // Enhanced milestone interface
  export interface Milestone {
    id: string;
    title: string;
    description: string;
    category: MilestoneCategory;
    subcategory?: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
    difficulty: 1 | 2 | 3 | 4 | 5;
    priority: 'low' | 'medium' | 'high' | 'critical';
    prerequisites?: string[];
    estimatedHours?: number;
    createdAt?: Date;
    completedAt?: Date;
    
    // Category-specific attributes
    attributes: MilestoneAttributes;
    
    // Enhanced resources
    resources: {
      title: string;
      url: string;
      type: 'article' | 'video' | 'course' | 'book' | 'documentation' | 'project' | 'certification';
      usageGuide?: string;
      estimatedTime?: string;
      cost?: 'free' | 'paid' | 'freemium';
    }[];
    
    // Progress tracking
    tasks?: {
      id: string;
      description: string;
      completed: boolean;
      dueDate?: Date;
      notes?: string;
    }[];
    
    // Assessment criteria
    successCriteria: string[];
    assessmentMethods?: ('self-assessment' | 'peer-review' | 'project-demo' | 'certification' | 'interview')[];
    
    // Legacy support for backward compatibility
    skillType?: 'technical' | 'soft';
  }

  // Legacy milestone interface for backward compatibility
  export interface LegacyMilestone {
    id: string;
    title: string;
    description: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
    skillType: 'technical' | 'soft';
    createdAt?: Date;
    resources: {
      title: string;
      url: string;
      type: 'article' | 'video' | 'course' | 'book' | 'documentation' | 'project' | 'certification';
      usageGuide?: string;
      estimatedTime?: string;
      cost?: 'free' | 'paid' | 'freemium';
    }[];
  }

  // Milestone task interface
  export interface MilestoneTask {
    id: string;
    description: string;
    completed: boolean;
    dueDate?: Date;
    notes?: string;
  }

  // Helper function to categorize milestones
  export const categorizeMilestone = (milestone: Partial<Milestone> | LegacyMilestone): MilestoneCategory => {
    const title = milestone.title?.toLowerCase() || '';
    const description = milestone.description?.toLowerCase() || '';
    const skills = milestone.skills?.map(s => s.toLowerCase()) || [];
    
    // Technical indicators
    const technicalKeywords = [
      'code', 'programming', 'development', 'api', 'database', 'framework',
      'algorithm', 'software', 'frontend', 'backend', 'deployment', 'testing',
      'react', 'node', 'javascript', 'python', 'java', 'sql', 'docker', 'git'
    ];
    
    // Fundamental indicators
    const fundamentalKeywords = [
      'problem-solving', 'analytical', 'research', 'documentation', 'debugging',
      'system-design', 'architecture', 'best-practices', 'methodology', 'principles',
      'foundations', 'concepts', 'theory', 'fundamentals'
    ];
    
    // Niche indicators
    const nicheKeywords = [
      'blockchain', 'ai', 'machine-learning', 'quantum', 'vr', 'ar',
      'iot', 'cybersecurity', 'data-science', 'devops', 'cloud-native',
      'cryptocurrency', 'smart-contracts', 'neural-networks', 'augmented-reality'
    ];
    
    // Soft skill indicators
    const softKeywords = [
      'communication', 'leadership', 'teamwork', 'presentation', 'networking',
      'emotional-intelligence', 'time-management', 'collaboration', 'mentoring',
      'negotiation', 'conflict-resolution', 'public-speaking', 'coaching'
    ];
    
    const content = `${title} ${description} ${skills.join(' ')}`;
    
    // Check for niche first (most specific)
    if (nicheKeywords.some(keyword => content.includes(keyword))) {
      return 'niche';
    }
    
    // Then check for technical
    if (technicalKeywords.some(keyword => content.includes(keyword))) {
      return 'technical';
    }
    
    // Check for soft skills
    if (softKeywords.some(keyword => content.includes(keyword))) {
      return 'soft';
    }
    
    // Default to fundamental
    return 'fundamental';
  };

  // Helper function to convert legacy milestones to new format
  export const migrateLegacyMilestone = (legacy: LegacyMilestone): Milestone => {
    const category = categorizeMilestone(legacy);
    
    return {
      ...legacy,
      category,
      difficulty: 3 as const, // Default difficulty
      priority: 'medium' as const, // Default priority
      attributes: {},
      successCriteria: ['Complete all learning resources', 'Apply skills in practical context'],
      skillType: legacy.skillType, // Maintain backward compatibility
    };
  };