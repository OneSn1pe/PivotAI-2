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
    resumeAnalysis?: ResumeAnalysis;
    jobPreferences?: JobPreferences;
    targetCompanies?: TargetCompany[];
    skills?: string[];
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
  
  export interface Milestone {
    id: string;
    title: string;
    description: string;
    skills: string[];
    timeframe: string;
    completed: boolean;
  }