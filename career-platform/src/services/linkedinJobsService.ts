import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('LinkedInJobsService');

// Type definitions based on common LinkedIn job data structure
export interface LinkedInJob {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    industry?: string;
    size?: string;
  };
  location: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY';
  experienceLevel: 'ENTRY_LEVEL' | 'ASSOCIATE' | 'MID_SENIOR' | 'DIRECTOR' | 'EXECUTIVE';
  postedDate: string;
  applyUrl: string;
  skills?: string[];
  remote?: boolean;
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  experienceLevel?: string[];
  employmentType?: string[];
  remote?: boolean;
  salaryMin?: number;
  company?: string;
  industry?: string;
  offset?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: LinkedInJob[];
  totalCount: number;
  hasMore: boolean;
  offset: number;
  searchParams: JobSearchFilters;
}

export interface JobMatchingResult {
  job: LinkedInJob;
  matchScore: number;
  matchReasons: string[];
  skillsMatch: {
    matching: string[];
    missing: string[];
    matchPercentage: number;
  };
  experienceMatch: boolean;
  locationMatch: boolean;
  salaryMatch: boolean;
}

class LinkedInJobsService {
  private baseUrl = 'https://linkedin-job-search-api.p.rapidapi.com';
  private apiKey: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_LINKEDIN_JOBS_KEY || '';
    this.headers = {
      'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com',
      'x-rapidapi-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    if (!this.apiKey) {
      log.warn('LinkedIn Jobs API key not configured');
    }
  }

  /**
   * Search for active jobs posted in the last hour
   */
  async searchActiveJobs(filters: JobSearchFilters = {}): Promise<JobSearchResponse> {
    try {
      const params = new URLSearchParams({
        offset: (filters.offset || 0).toString(),
        description_type: 'text',
        ...(filters.keywords && { keywords: filters.keywords }),
        ...(filters.location && { location: filters.location }),
        ...(filters.company && { company: filters.company }),
      });

      const response = await fetch(`${this.baseUrl}/active-jb-1h?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`LinkedIn Jobs API error: ${response.status}`, { error: errorText });
        throw new Error(`LinkedIn Jobs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.transformJobsResponse(data, filters);
    } catch (error) {
      log.error('Error fetching active jobs:', error);
      throw error;
    }
  }

  /**
   * Search for jobs with custom parameters
   */
  async searchJobs(filters: JobSearchFilters): Promise<JobSearchResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      if (filters.keywords) params.append('keywords', filters.keywords);
      if (filters.location) params.append('location', filters.location);
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.limit) params.append('limit', Math.min(filters.limit, 25).toString()); // LinkedIn API typically limits to 25
      if (filters.remote) params.append('remote', 'true');

      // Note: The actual endpoint may vary based on API documentation
      const endpoint = filters.keywords ? '/search' : '/active-jb-1h';
      
      const response = await fetch(`${this.baseUrl}${endpoint}?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error(`LinkedIn Jobs search error: ${response.status}`, { error: errorText });
        throw new Error(`LinkedIn Jobs search error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.transformJobsResponse(data, filters);
    } catch (error) {
      log.error('Error searching jobs:', error);
      throw error;
    }
  }

  /**
   * Transform API response to our standard format
   */
  private transformJobsResponse(apiData: any, filters: JobSearchFilters): JobSearchResponse {
    try {
      // Adapt this based on actual API response structure
      const jobs = Array.isArray(apiData.jobs) ? apiData.jobs : 
                   Array.isArray(apiData.data) ? apiData.data :
                   Array.isArray(apiData) ? apiData : [];

      const transformedJobs: LinkedInJob[] = jobs.map((job: any) => ({
        id: job.id || job.jobId || job.linkedin_job_id || `job_${Date.now()}_${Math.random()}`,
        title: job.title || job.jobTitle || job.position || 'Unknown Title',
        company: {
          name: job.company?.name || job.companyName || job.company || 'Unknown Company',
          logo: job.company?.logo || job.companyLogo,
          industry: job.company?.industry || job.industry,
          size: job.company?.size || job.companySize,
        },
        location: job.location || job.jobLocation || 'Remote',
        description: job.description || job.jobDescription || '',
        requirements: this.extractRequirements(job.description || job.jobDescription || ''),
        salaryRange: this.extractSalaryRange(job.salary || job.salaryRange),
        employmentType: this.mapEmploymentType(job.employmentType || job.jobType),
        experienceLevel: this.mapExperienceLevel(job.experienceLevel || job.seniorityLevel),
        postedDate: job.postedDate || job.datePosted || new Date().toISOString(),
        applyUrl: job.applyUrl || job.jobUrl || job.url || '#',
        skills: this.extractSkills(job.description || job.jobDescription || ''),
        remote: this.isRemoteJob(job.location || job.jobLocation || ''),
      }));

      return {
        jobs: transformedJobs,
        totalCount: apiData.totalCount || apiData.total || transformedJobs.length,
        hasMore: apiData.hasMore || (transformedJobs.length === (filters.limit || 25)),
        offset: filters.offset || 0,
        searchParams: filters,
      };
    } catch (error) {
      log.error('Error transforming jobs response:', error);
      throw new Error('Failed to process job data');
    }
  }

  /**
   * Extract requirements from job description
   */
  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lines = description.split('\n');
    
    let inRequirementsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('requirement') || 
          line.toLowerCase().includes('qualification') ||
          line.toLowerCase().includes('must have')) {
        inRequirementsSection = true;
        continue;
      }
      
      if (inRequirementsSection) {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          requirements.push(line.trim().substring(1).trim());
        } else if (line.trim() === '' && requirements.length > 0) {
          break; // End of requirements section
        }
      }
    }
    
    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  /**
   * Extract salary range from text
   */
  private extractSalaryRange(salaryText: string): LinkedInJob['salaryRange'] {
    if (!salaryText) return undefined;
    
    const salaryMatch = salaryText.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-?\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)?/);
    if (salaryMatch) {
      const min = parseInt(salaryMatch[1].replace(/,/g, ''));
      const max = salaryMatch[2] ? parseInt(salaryMatch[2].replace(/,/g, '')) : min;
      
      return {
        min: Math.min(min, max),
        max: Math.max(min, max),
        currency: 'USD',
      };
    }
    
    return undefined;
  }

  /**
   * Map employment type to standard format
   */
  private mapEmploymentType(type: string): LinkedInJob['employmentType'] {
    const typeStr = (type || '').toLowerCase();
    if (typeStr.includes('full') || typeStr.includes('permanent')) return 'FULL_TIME';
    if (typeStr.includes('part')) return 'PART_TIME';
    if (typeStr.includes('contract') || typeStr.includes('freelance')) return 'CONTRACT';
    if (typeStr.includes('intern')) return 'INTERNSHIP';
    if (typeStr.includes('temp')) return 'TEMPORARY';
    return 'FULL_TIME'; // Default
  }

  /**
   * Map experience level to standard format
   */
  private mapExperienceLevel(level: string): LinkedInJob['experienceLevel'] {
    const levelStr = (level || '').toLowerCase();
    if (levelStr.includes('entry') || levelStr.includes('junior') || levelStr.includes('graduate')) return 'ENTRY_LEVEL';
    if (levelStr.includes('associate')) return 'ASSOCIATE';
    if (levelStr.includes('senior') || levelStr.includes('mid')) return 'MID_SENIOR';
    if (levelStr.includes('director') || levelStr.includes('manager')) return 'DIRECTOR';
    if (levelStr.includes('executive') || levelStr.includes('vp')) return 'EXECUTIVE';
    return 'ASSOCIATE'; // Default
  }

  /**
   * Extract skills from job description
   */
  private extractSkills(description: string): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'Go', 'Rust', 'PHP',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD',
      'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas',
      'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Material UI',
      'Git', 'GitHub', 'GitLab', 'Jira', 'Agile', 'Scrum', 'Kanban',
      'REST', 'GraphQL', 'API', 'Microservices', 'DevOps', 'Testing', 'Jest'
    ];

    const foundSkills = commonSkills.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(description);
    });

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  /**
   * Check if job is remote
   */
  private isRemoteJob(location: string): boolean {
    const locationStr = location.toLowerCase();
    return locationStr.includes('remote') || 
           locationStr.includes('anywhere') || 
           locationStr.includes('work from home') ||
           locationStr.includes('distributed');
  }

  /**
   * Calculate job match score based on user profile
   */
  calculateJobMatch(job: LinkedInJob, userProfile: {
    skills: string[];
    experience: string[];
    targetRoles: string[];
    targetCompanies: string[];
    preferences: {
      remote?: boolean;
      locations?: string[];
      salaryMin?: number;
    };
  }): JobMatchingResult {
    let matchScore = 0;
    const matchReasons: string[] = [];

    // Skills matching (40% of total score)
    const jobSkills = job.skills || [];
    const userSkills = userProfile.skills || [];
    const matchingSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    const missingSkills = jobSkills.filter(skill => !matchingSkills.includes(skill));
    
    const skillsMatchPercentage = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;
    matchScore += (skillsMatchPercentage / 100) * 40;
    
    if (matchingSkills.length > 0) {
      matchReasons.push(`${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
    }

    // Title/Role matching (25% of total score)
    const titleMatch = userProfile.targetRoles.some(role => 
      job.title.toLowerCase().includes(role.toLowerCase()) ||
      role.toLowerCase().includes(job.title.toLowerCase())
    );
    if (titleMatch) {
      matchScore += 25;
      matchReasons.push('Job title matches target role');
    }

    // Company matching (15% of total score)
    const companyMatch = userProfile.targetCompanies.some(company =>
      job.company.name.toLowerCase().includes(company.toLowerCase()) ||
      company.toLowerCase().includes(job.company.name.toLowerCase())
    );
    if (companyMatch) {
      matchScore += 15;
      matchReasons.push('Target company match');
    }

    // Location matching (10% of total score)
    const locationMatch = !userProfile.preferences.locations?.length ||
      userProfile.preferences.locations.some(loc =>
        job.location.toLowerCase().includes(loc.toLowerCase())
      ) || (userProfile.preferences.remote && job.remote);
    
    if (locationMatch) {
      matchScore += 10;
      if (job.remote && userProfile.preferences.remote) {
        matchReasons.push('Remote work preference match');
      } else {
        matchReasons.push('Location preference match');
      }
    }

    // Salary matching (10% of total score)
    const salaryMatch = !userProfile.preferences.salaryMin || 
      !job.salaryRange || 
      job.salaryRange.min >= userProfile.preferences.salaryMin;
    
    if (salaryMatch && job.salaryRange && userProfile.preferences.salaryMin) {
      matchScore += 10;
      matchReasons.push('Salary expectations met');
    } else if (!job.salaryRange) {
      matchScore += 5; // Partial credit if no salary info
    }

    return {
      job,
      matchScore: Math.round(matchScore),
      matchReasons,
      skillsMatch: {
        matching: matchingSkills,
        missing: missingSkills,
        matchPercentage: Math.round(skillsMatchPercentage),
      },
      experienceMatch: titleMatch,
      locationMatch,
      salaryMatch,
    };
  }

  /**
   * Get recommended jobs for user profile
   */
  async getRecommendedJobs(
    userProfile: {
      skills: string[];
      experience: string[];
      targetRoles: string[];
      targetCompanies: string[];
      preferences: {
        remote?: boolean;
        locations?: string[];
        salaryMin?: number;
      };
    },
    filters: JobSearchFilters = {}
  ): Promise<JobMatchingResult[]> {
    try {
      log.info('Fetching recommended jobs for user profile');

      // Build search filters based on user profile
      const searchFilters: JobSearchFilters = {
        ...filters,
        keywords: filters.keywords || userProfile.targetRoles[0] || '',
        location: filters.location || userProfile.preferences.locations?.[0] || '',
        remote: userProfile.preferences.remote,
        offset: filters.offset || 0,
        limit: filters.limit || 25,
      };

      // Search for jobs
      const jobsResponse = await this.searchActiveJobs(searchFilters);
      
      // Calculate match scores for all jobs
      const matchingResults = jobsResponse.jobs.map(job => 
        this.calculateJobMatch(job, userProfile)
      );

      // Sort by match score (highest first) and return top matches
      const sortedResults = matchingResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .filter(result => result.matchScore > 20); // Only return jobs with >20% match

      log.info(`Found ${sortedResults.length} matching jobs out of ${jobsResponse.jobs.length} total jobs`);
      
      return sortedResults;
    } catch (error) {
      log.error('Error getting recommended jobs:', error);
      
      // Return empty results with error handling
      return [];
    }
  }

  /**
   * Get jobs by specific companies
   */
  async getJobsByCompanies(companies: string[], filters: JobSearchFilters = {}): Promise<JobSearchResponse> {
    try {
      const allJobs: LinkedInJob[] = [];
      
      // Search for each company
      for (const company of companies.slice(0, 5)) { // Limit to 5 companies to avoid rate limits
        try {
          const companyFilters = { ...filters, company };
          const response = await this.searchJobs(companyFilters);
          allJobs.push(...response.jobs);
        } catch (error) {
          log.warn(`Error fetching jobs for company: ${company}`, error);
          // Continue with other companies
        }
      }

      // Remove duplicates based on job ID
      const uniqueJobs = allJobs.filter((job, index, self) => 
        index === self.findIndex(j => j.id === job.id)
      );

      return {
        jobs: uniqueJobs,
        totalCount: uniqueJobs.length,
        hasMore: false,
        offset: filters.offset || 0,
        searchParams: filters,
      };
    } catch (error) {
      log.error('Error fetching jobs by companies:', error);
      throw error;
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get API status
   */
  async getApiStatus(): Promise<{ available: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { available: false, error: 'API key not configured' };
    }

    try {
      // Test with minimal request
      const response = await fetch(`${this.baseUrl}/active-jb-1h?offset=0&limit=1`, {
        method: 'GET',
        headers: this.headers,
      });

      return { 
        available: response.ok,
        error: response.ok ? undefined : `API returned ${response.status}`
      };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const linkedInJobsService = new LinkedInJobsService();
export default linkedInJobsService;