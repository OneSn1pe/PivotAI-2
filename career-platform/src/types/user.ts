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
  }
  
  export interface CandidateProfile extends User {
    role: UserRole.CANDIDATE;
    resumeUrl?: string;
    resumeFileName?: string;
    resumePlainTextUrl?: string;
    originalResumePath?: string; // Path to the original file in storage
    plaintextResumePath?: string; // Path to the plaintext version in storage
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
  
  export interface SkillLevel {
    skill: string;
    level: number;
    evidence: string;
  }
  
  export interface ResumeAnalysis {
    skills: string[];
    skillLevels: SkillLevel[];
    experience: string[];
    education: string[];
    certifications: string[];
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
  
  export interface Resource {
    title: string;
    url: string;
    type: 'course' | 'book' | 'project' | 'article' | 'documentation';
  }
  
  export interface Milestone {
    id: string;
    title: string;
    description: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
    resources: Resource[];
  }
  
  export interface CandidateGapAnalysis {
    currentStrengths: string[];
    criticalGaps: string[];
  }
  
  export interface CareerRoadmap {
    id?: string;
    candidateId: string;
    milestones: Milestone[];
    candidateGapAnalysis: CandidateGapAnalysis;
    targetRoleRequirements: string[];
    successMetrics: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }