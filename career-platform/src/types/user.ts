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
    resumeAnalysis?: ResumeAnalysis;
    jobPreferences?: JobPreferences;
    skills?: string[];
    updatedAt?: Date;
    targetCompanies?: TargetCompany[];
    targetRoles?: TargetRole[];
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
  
  export interface TargetRole {
    title: string;
    industry: string;
  }
  
  export interface CareerRoadmap {
    id: string;
    candidateId: string;
    milestones: Milestone[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Milestone {
    id: string;
    title: string;
    description: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
    createdAt?: Date;
    resources: {
      title: string;
      url: string;
      type: 'article' | 'video' | 'course' | 'book' | 'documentation';
    }[];
    tasks?: MilestoneTask[];
  }

  export interface MilestoneTask {
    id?: string;
    description: string;
    completed: boolean;
  }