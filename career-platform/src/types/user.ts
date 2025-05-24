export enum UserRole {
    CANDIDATE = 'candidate',
    RECRUITER = 'recruiter',
  }
  
  // Professional field types
  export type ProfessionalField = 'computer-science' | 'engineering' | 'medicine' | 'business' | 'law';

  // Field-specific category types
  export type CSCategories = 'technical' | 'fundamental' | 'niche' | 'soft';
  export type EngineeringCategories = 'design' | 'analysis' | 'implementation' | 'safety' | 'regulatory';
  export type MedicineCategories = 'clinical' | 'research' | 'patient-care' | 'diagnostic' | 'compliance';
  export type BusinessCategories = 'strategy' | 'operations' | 'finance' | 'leadership' | 'market-analysis';
  export type LawCategories = 'research' | 'litigation' | 'advisory' | 'compliance' | 'negotiation';

  export type MilestoneCategory = CSCategories | EngineeringCategories | MedicineCategories | BusinessCategories | LawCategories;

  // Professional competency areas (replacing RPG attributes)
  export interface ProfessionalCompetencies {
    // Core competencies across all fields
    technical_expertise: number;      // Domain-specific technical skills
    communication: number;            // Written and verbal communication
    problem_solving: number;          // Analytical and creative problem solving
    project_management: number;       // Planning, organization, execution
    continuous_learning: number;      // Adaptation and skill development
    professional_ethics: number;     // Ethical decision-making and integrity
  }

  // Field-specific competency extensions
  export interface EngineeringCompetencies extends ProfessionalCompetencies {
    design_thinking: number;          // Creative design and innovation
    safety_awareness: number;         // Risk assessment and safety protocols
    regulatory_knowledge: number;     // Standards and compliance understanding
  }

  export interface MedicineCompetencies extends ProfessionalCompetencies {
    clinical_judgment: number;        // Medical decision-making
    patient_care: number;            // Empathy and bedside manner
    evidence_based_practice: number; // Research and data-driven decisions
  }

  export interface BusinessCompetencies extends ProfessionalCompetencies {
    strategic_thinking: number;       // Long-term planning and vision
    financial_acumen: number;        // Financial analysis and planning
    market_insight: number;          // Customer and market understanding
  }

  export interface LawCompetencies extends ProfessionalCompetencies {
    legal_reasoning: number;         // Analysis and argumentation
    research_skills: number;        // Case law and precedent research
    client_relations: number;       // Trust-building and communication
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
    professionalField?: ProfessionalField;        // NEW: Field selection
    specialization?: string;                      // NEW: Field-specific specialization
    resumeUrl?: string;
    resumeFileName?: string;
    resumeAnalysis?: ResumeAnalysis;
    jobPreferences?: JobPreferences;
    targetCompanies?: TargetCompany[];
    skills?: string[];
    competencies?: ProfessionalCompetencies;      // NEW: Professional competencies
    updatedAt?: Date;
    licenseStatus?: {                             // NEW: Professional licensing
      required: boolean;
      obtained: string[];
      pursuing: string[];
    };
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
    professionalField?: ProfessionalField;        // NEW: Detected field
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
    industry?: ProfessionalField;  // NEW: Target industry for this company
  }
  
  export interface CareerRoadmap {
    id: string;
    candidateId: string;
    professionalField: ProfessionalField;         // NEW: Field-specific roadmaps
    milestones: Milestone[];
    createdAt: Date;
    updatedAt: Date;
  }

  // Field-specific milestone attributes
  
  // Computer Science attributes
  export interface CSAttributes {
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
    learningPath: 'guided' | 'self-directed' | 'mentored' | 'bootcamp';
    certificationAvailable?: boolean;
  }

  // Engineering attributes
  export interface EngineeringAttributes {
    engineeringDiscipline: 'mechanical' | 'electrical' | 'civil' | 'chemical' | 'software' | 'aerospace' | 'biomedical' | 'industrial';
    designTools: string[];                     // CAD software, simulation tools
    standards: string[];                       // ISO, ASME, IEEE standards
    safetyRequirements: string[];             // Safety protocols and compliance
    projectScale: 'component' | 'system' | 'facility' | 'infrastructure';
    deliverables: {
      type: 'design-drawings' | 'prototype' | 'analysis-report' | 'specification' | 'certification';
      description: string;
      url?: string;
    }[];
    regulatoryCompliance: string[];           // Required certifications and approvals
    professionalDevelopment: string[];       // PE license, certifications
  }

  // Medicine attributes  
  export interface MedicineAttributes {
    medicalSpecialty: 'primary-care' | 'surgery' | 'pediatrics' | 'cardiology' | 'neurology' | 'psychiatry' | 'radiology' | 'pathology' | 'emergency' | 'other';
    clinicalSkills: string[];                // Patient care skills
    diagnosticTools: string[];               // Medical equipment and procedures
    treatmentProtocols: string[];            // Evidence-based practices
    patientPopulation: string[];             // Demographics served
    deliverables: {
      type: 'case-study' | 'research-paper' | 'clinical-protocol' | 'patient-outcome' | 'presentation';
      description: string;
      url?: string;
    }[];
    cmeRequirements: number;                 // Continuing medical education hours
    boardCertifications: string[];          // Specialty certifications
    ethicsTraining: boolean;                 // Medical ethics compliance
  }

  // Business attributes
  export interface BusinessAttributes {
    businessFunction: 'strategy' | 'operations' | 'finance' | 'marketing' | 'sales' | 'hr' | 'consulting' | 'entrepreneurship';
    industryKnowledge: string[];             // Sector expertise
    analyticalTools: string[];              // Excel, SQL, Tableau, etc.
    leadershipScope: 'individual' | 'team' | 'department' | 'organization';
    financialImpact: string;                 // Budget size, revenue impact
    deliverables: {
      type: 'business-plan' | 'financial-model' | 'market-analysis' | 'strategy-document' | 'presentation';
      description: string;
      url?: string;
    }[];
    certifications: string[];               // MBA, CPA, PMP, etc.
    networkingGoals: string[];              // Professional connections
  }

  // Law attributes
  export interface LawAttributes {
    practiceArea: 'corporate' | 'litigation' | 'criminal' | 'family' | 'intellectual-property' | 'real-estate' | 'tax' | 'immigration' | 'employment';
    jurisdiction: string[];                  // State/federal bar admissions
    clientType: 'individual' | 'small-business' | 'corporate' | 'government' | 'non-profit';
    legalResearch: string[];                // Databases and resources used
    caseExperience: number;                 // Years of practice
    deliverables: {
      type: 'legal-brief' | 'contract' | 'case-analysis' | 'legal-memo' | 'court-filing';
      description: string;
      url?: string;
    }[];
    barAdmissions: string[];               // State bar memberships
    cleRequirements: number;               // Continuing legal education hours
    specializations: string[];             // Niche legal expertise
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

  // Field and category-specific attributes interface
  export interface MilestoneAttributes {
    // Computer Science
    cs?: CSAttributes;
    // Engineering
    engineering?: EngineeringAttributes;
    // Medicine
    medicine?: MedicineAttributes;
    // Business
    business?: BusinessAttributes;
    // Law
    law?: LawAttributes;
    // Legacy support
    technical?: CSAttributes;
    fundamental?: FundamentalAttributes;
    niche?: NicheAttributes;
    soft?: SoftAttributes;
  }

  // Enhanced milestone interface with field support
  export interface Milestone {
    id: string;
    title: string;
    description: string;
    professionalField: ProfessionalField;        // NEW: Field this milestone belongs to
    category: MilestoneCategory;
    subcategory?: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    prerequisites?: string[];
    estimatedHours?: number;
    createdAt?: Date;
    completedAt?: Date;
    
    // Field and category-specific attributes
    attributes: MilestoneAttributes;
    
    // Enhanced resources with field-specific types
    resources: {
      title: string;
      url: string;
      type: 'article' | 'video' | 'course' | 'book' | 'documentation' | 'project' | 'certification' 
            | 'cad-tutorial' | 'simulation-software' | 'standards-document' | 'technical-drawing'
            | 'clinical-guideline' | 'medical-journal' | 'cme-course' | 'case-study' | 'medical-database'
            | 'market-report' | 'financial-model' | 'business-plan-template'
            | 'case-law' | 'statute' | 'legal-brief' | 'bar-exam-prep' | 'legal-database';
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
    assessmentMethods?: ('self-assessment' | 'peer-review' | 'project-demo' | 'certification' | 'interview' | 'clinical-evaluation' | 'case-presentation')[];
    
    // Professional development tracking
    competencyImpact?: {
      [key in keyof ProfessionalCompetencies]?: number;  // How much this milestone improves each competency (0-10)
    };
    
    // Legacy support for backward compatibility
    skillType?: 'technical' | 'soft';
    difficulty?: 1 | 2 | 3 | 4 | 5;  // Made optional for backward compatibility
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
  export const migrateLegacyMilestone = (legacy: LegacyMilestone, professionalField: ProfessionalField = 'computer-science'): Milestone => {
    const category = categorizeMilestone(legacy);
    
    return {
      ...legacy,
      professionalField,
      category,
      difficulty: 3 as const, // Default difficulty
      priority: 'medium' as const, // Default priority
      attributes: {},
      successCriteria: ['Complete all learning resources', 'Apply skills in practical context'],
      competencyImpact: {
        technical_expertise: 5,
        continuous_learning: 3
      },
      skillType: legacy.skillType, // Maintain backward compatibility
    };
  };