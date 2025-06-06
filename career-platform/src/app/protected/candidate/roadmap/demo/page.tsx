'use client';

import React from 'react';
import CategorizedCareerRoadmap from '@/components/candidate/CategorizedCareerRoadmap';
import { CareerRoadmap, Milestone } from '@/types/user';

const sampleMilestones: Milestone[] = [
  {
    id: 'tech-001',
    title: 'Build Full-Stack E-commerce Application',
    description: 'Develop a complete e-commerce platform with React frontend, Node.js backend, and PostgreSQL database',
    professionalField: 'computer-science',
    category: 'technical',
    subcategory: 'full-stack-development',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Express.js', 'Redux'],
    timeframe: '3-4 months',
    completed: false,
    difficulty: 4,
    priority: 'high',
    estimatedHours: 120,
    attributes: {
      technical: {
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Express.js', 'Redux'],
        projectType: 'fullstack',
        complexityLevel: 'advanced',
        deliverables: [
          {
            type: 'deployed-app',
            description: 'Live e-commerce application with payment integration'
          },
          {
            type: 'code-repository',
            description: 'Well-documented GitHub repository'
          }
        ],
        learningPath: 'self-directed',
        certificationAvailable: false
      }
    },
    resources: [
      {
        title: 'Full Stack JavaScript Tutorial',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        type: 'course',
        estimatedTime: '4 weeks',
        cost: 'free'
      },
      {
        title: 'React E-commerce Project',
        url: 'https://github.com/basir/amazona',
        type: 'project',
        estimatedTime: '6 weeks',
        cost: 'free'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Set up development environment', completed: true },
      { id: 'task-2', description: 'Design database schema', completed: false },
      { id: 'task-3', description: 'Implement user authentication', completed: false },
      { id: 'task-4', description: 'Build product catalog', completed: false },
      { id: 'task-5', description: 'Integrate payment system', completed: false }
    ],
    successCriteria: [
      'Users can register and authenticate',
      'Product catalog with search functionality',
      'Working shopping cart and checkout',
      'Admin dashboard for order management',
      'Responsive design for mobile devices'
    ]
  },
  {
    id: 'fund-001',
    title: 'Master System Design Principles',
    description: 'Learn scalable system architecture, database design, and distributed systems concepts',
    professionalField: 'computer-science',
    category: 'fundamental',
    subcategory: 'system-architecture',
    skills: ['System Design', 'Database Design', 'Scalability', 'Load Balancing', 'Caching'],
    timeframe: '2-3 months',
    completed: false,
    difficulty: 5,
    priority: 'critical',
    estimatedHours: 80,
    attributes: {
      fundamental: {
        competencyArea: 'problem-solving',
        industryScope: 'tech-specific',
        careerStage: 'mid-level',
        conceptualAreas: ['System Architecture', 'Database Design', 'Scalability', 'Distributed Systems'],
        theoreticalDepth: 'deep',
        applicationAreas: ['Web Development', 'Backend Systems', 'Cloud Architecture'],
        buildsUpon: ['Programming Fundamentals', 'Database Basics'],
        enablesAdvancement: ['Senior Developer', 'Solution Architect', 'Technical Lead'],
        knowledgeType: 'conceptual'
      }
    },
    resources: [
      {
        title: 'Designing Data-Intensive Applications',
        url: 'https://dataintensive.net/',
        type: 'book',
        estimatedTime: '8 weeks',
        cost: 'paid'
      },
      {
        title: 'System Design Primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        type: 'documentation',
        estimatedTime: '4 weeks',
        cost: 'free'
      },
      {
        title: 'High Scalability Blog',
        url: 'http://highscalability.com/',
        type: 'article',
        estimatedTime: 'Ongoing',
        cost: 'free'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Study CAP theorem and ACID properties', completed: false },
      { id: 'task-2', description: 'Design a scalable chat application', completed: false },
      { id: 'task-3', description: 'Learn about microservices architecture', completed: false }
    ],
    successCriteria: [
      'Understand trade-offs between consistency and availability',
      'Design systems that can handle millions of users',
      'Explain caching strategies and load balancing',
      'Identify bottlenecks in system architecture'
    ]
  },
  {
    id: 'niche-001',
    title: 'Blockchain Development Specialization',
    description: 'Master blockchain technology, smart contracts, and decentralized application development',
    professionalField: 'computer-science',
    category: 'niche',
    subcategory: 'blockchain-development',
    skills: ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js', 'DeFi'],
    timeframe: '4-6 months',
    completed: false,
    difficulty: 5,
    priority: 'medium',
    estimatedHours: 150,
    attributes: {
      niche: {
        specializationDomain: 'blockchain',
        marketDemand: 'growing',
        expertiseLevel: 'working-knowledge',
        industryAdoption: 'early-adopter',
        competitorLandscape: 'few-experts',
        careerImpact: 'differentiator',
        salaryPremium: 30,
        learningCurve: 'steep',
        resourceAvailability: 'moderate',
        communitySize: 'medium',
        trendDirection: 'rising',
        longevityEstimate: '5+ years'
      }
    },
    resources: [
      {
        title: 'CryptoZombies - Learn Solidity',
        url: 'https://cryptozombies.io/',
        type: 'course',
        estimatedTime: '6 weeks',
        cost: 'free'
      },
      {
        title: 'Ethereum Smart Contract Tutorial',
        url: 'https://ethereum.org/en/developers/tutorials/',
        type: 'documentation',
        estimatedTime: '4 weeks',
        cost: 'free'
      },
      {
        title: 'Blockchain Specialization - Coursera',
        url: 'https://www.coursera.org/specializations/blockchain',
        type: 'certification',
        estimatedTime: '16 weeks',
        cost: 'paid'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Complete CryptoZombies course', completed: false },
      { id: 'task-2', description: 'Deploy first smart contract to testnet', completed: false },
      { id: 'task-3', description: 'Build DeFi yield farming app', completed: false }
    ],
    successCriteria: [
      'Write and deploy smart contracts',
      'Understand gas optimization techniques',
      'Build full-stack DApp with Web3 integration',
      'Implement security best practices'
    ]
  },
  {
    id: 'soft-001',
    title: 'Technical Leadership & Communication',
    description: 'Develop leadership skills, effective communication, and team management capabilities',
    professionalField: 'computer-science',
    category: 'soft',
    subcategory: 'leadership-communication',
    skills: ['Leadership', 'Technical Communication', 'Team Management', 'Mentoring', 'Public Speaking'],
    timeframe: '2-4 months',
    completed: true,
    difficulty: 3,
    priority: 'high',
    estimatedHours: 60,
    attributes: {
      soft: {
        skillCategory: 'leadership',
        developmentMethod: 'practice-based',
        applicationScenarios: ['Team meetings', 'Technical presentations', 'Code reviews', 'Client interactions'],
        roleRelevance: 'team-lead',
        assessmentDifficulty: 'somewhat-subjective',
        measurementMethods: ['360-feedback', 'peer-review', 'self-assessment'],
        behavioralMarkers: [
          { indicator: 'Leads effective team meetings', frequency: 'weekly' },
          { indicator: 'Provides constructive code review feedback', frequency: 'daily' },
          { indicator: 'Mentors junior developers', frequency: 'weekly' }
        ],
        developmentTimeframe: 'months',
        improvementPattern: 'continuous'
      }
    },
    resources: [
      {
        title: 'Technical Leadership Masterclass',
        url: 'https://www.linkedin.com/learning/technical-leadership',
        type: 'course',
        estimatedTime: '4 weeks',
        cost: 'paid'
      },
      {
        title: 'The Manager\'s Path',
        url: 'https://www.oreilly.com/library/view/the-managers-path/9781491973882/',
        type: 'book',
        estimatedTime: '6 weeks',
        cost: 'paid'
      },
      {
        title: 'Toastmasters International',
        url: 'https://www.toastmasters.org/',
        type: 'course',
        estimatedTime: 'Ongoing',
        cost: 'paid'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Complete leadership assessment', completed: true },
      { id: 'task-2', description: 'Lead weekly team standup meetings', completed: true },
      { id: 'task-3', description: 'Give technical presentation to stakeholders', completed: true },
      { id: 'task-4', description: 'Mentor a junior developer', completed: false }
    ],
    successCriteria: [
      'Lead productive team meetings',
      'Deliver clear technical presentations',
      'Receive positive feedback from team members',
      'Successfully mentor junior team members',
      'Resolve team conflicts effectively'
    ]
  },
  {
    id: 'tech-002',
    title: 'Advanced React & TypeScript',
    description: 'Master advanced React patterns, hooks, performance optimization, and TypeScript integration',
    professionalField: 'computer-science',
    category: 'technical',
    subcategory: 'frontend-specialization',
    skills: ['React', 'TypeScript', 'Redux Toolkit', 'React Query', 'Testing Library'],
    timeframe: '2-3 months',
    completed: false,
    difficulty: 3,
    priority: 'medium',
    estimatedHours: 80,
    attributes: {
      technical: {
        technologies: ['React', 'TypeScript', 'Redux Toolkit', 'React Query', 'Jest'],
        projectType: 'frontend',
        complexityLevel: 'advanced',
        deliverables: [
          {
            type: 'code-repository',
            description: 'Advanced React component library with TypeScript'
          }
        ],
        learningPath: 'guided',
        certificationAvailable: true
      }
    },
    resources: [
      {
        title: 'Epic React Course',
        url: 'https://epicreact.dev/',
        type: 'course',
        estimatedTime: '8 weeks',
        cost: 'paid'
      },
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/',
        type: 'documentation',
        estimatedTime: '4 weeks',
        cost: 'free'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Master React custom hooks', completed: false },
      { id: 'task-2', description: 'Implement component composition patterns', completed: false },
      { id: 'task-3', description: 'Set up comprehensive testing suite', completed: false }
    ],
    successCriteria: [
      'Build reusable component library',
      'Implement advanced React patterns',
      'Achieve 90%+ test coverage',
      'Optimize performance with profiling tools'
    ]
  },
  {
    id: 'fund-002',
    title: 'Algorithm & Data Structure Mastery',
    description: 'Strengthen fundamental computer science concepts for technical interviews and problem-solving',
    professionalField: 'computer-science',
    category: 'fundamental',
    subcategory: 'computer-science',
    skills: ['Algorithms', 'Data Structures', 'Time Complexity', 'Space Complexity', 'Problem Solving'],
    timeframe: '3-4 months',
    completed: false,
    difficulty: 4,
    priority: 'high',
    estimatedHours: 100,
    attributes: {
      fundamental: {
        competencyArea: 'analytical-thinking',
        industryScope: 'universal',
        careerStage: 'all-levels',
        conceptualAreas: ['Big O Notation', 'Graph Theory', 'Dynamic Programming', 'Recursion'],
        theoreticalDepth: 'deep',
        applicationAreas: ['Software Engineering', 'Technical Interviews', 'System Optimization'],
        buildsUpon: ['Basic Programming'],
        enablesAdvancement: ['Senior Engineer', 'Technical Architect'],
        knowledgeType: 'procedural'
      }
    },
    resources: [
      {
        title: 'LeetCode Problems',
        url: 'https://leetcode.com/',
        type: 'course',
        estimatedTime: 'Ongoing',
        cost: 'freemium'
      },
      {
        title: 'Introduction to Algorithms (CLRS)',
        url: 'https://mitpress.mit.edu/books/introduction-algorithms-third-edition',
        type: 'book',
        estimatedTime: '12 weeks',
        cost: 'paid'
      }
    ],
    tasks: [
      { id: 'task-1', description: 'Solve 100 LeetCode easy problems', completed: false },
      { id: 'task-2', description: 'Master dynamic programming patterns', completed: false },
      { id: 'task-3', description: 'Complete graph algorithms section', completed: false }
    ],
    successCriteria: [
      'Solve algorithmic problems efficiently',
      'Analyze time and space complexity',
      'Implement common data structures from scratch',
      'Pass technical coding interviews'
    ]
  },
  // NEW: Career Progression Milestone - Entry Level Position
  {
    id: 'career-1',
    professionalField: 'computer-science',
    title: 'Secure Junior Frontend Developer Position',
    description: 'Land an entry-level frontend development role to gain professional experience in React development and build foundation for career advancement. This position serves as a stepping stone toward more senior roles.',
    category: 'career',
    skills: ['Professional Development', 'Job Search', 'Interview Skills', 'Portfolio Building'],
    timeframe: '3-4 months',
    completed: false,
    difficulty: 3,
    priority: 'high',
    estimatedHours: 80,
    attributes: {
      career: {
        positionLevel: 'entry-level',
        targetRole: 'Junior Frontend Developer',
        experienceRequired: '0-1 years',
        keyResponsibilities: [
          'Build responsive user interfaces using React',
          'Collaborate with design team to implement UI/UX',
          'Write clean, maintainable JavaScript/TypeScript code',
          'Participate in code reviews and agile development',
          'Learn company coding standards and best practices'
        ],
        advancement_path: {
          toRole: 'Frontend Developer',
          timeInRole: '12-18 months',
          promotionCriteria: [
            'Master React ecosystem and modern JavaScript',
            'Lead small feature implementations independently',
            'Mentor new junior developers',
            'Contribute to architectural decisions'
          ]
        },
        industryExperience: {
          sectors: ['Technology', 'Software Development', 'SaaS'],
          domainKnowledge: ['Frontend development', 'User experience', 'Web technologies'],
          clientTypes: ['B2B SaaS', 'Consumer applications', 'E-commerce']
        },
        skillRequirements: {
          technical: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'REST APIs'],
          soft: ['Communication', 'Teamwork', 'Problem-solving', 'Adaptability'],
          specialized: ['Responsive design', 'State management', 'Testing frameworks']
        },
        compensation: {
          salaryRange: '$55k-75k',
          equity: true,
          benefits: ['Health insurance', 'PTO', 'Learning budget'],
          growthPotential: 'Strong potential for 15-25% annual increases with proven performance'
        },
        applicationStrategy: {
          whereToApply: ['Tech startups', 'Mid-size tech companies', 'Digital agencies', 'SaaS companies'],
          networking: [
            'Attend React meetups and frontend conferences',
            'Connect with developers on LinkedIn and Twitter',
            'Join Discord/Slack communities for React developers',
            'Contribute to open source React projects'
          ],
          portfolioNeeds: [
            '3-4 polished React applications',
            'Clean, well-documented GitHub profile',
            'Professional portfolio website',
            'Mobile-responsive projects demonstrating skills'
          ],
          interviewPrep: [
            'Practice React coding challenges',
            'Review JavaScript fundamentals',
            'Prepare to discuss portfolio projects in detail',
            'Study common frontend system design questions'
          ]
        },
        experienceBuilding: {
          projectTypes: ['E-commerce sites', 'Dashboard applications', 'Portfolio websites', 'API integrations'],
          certifications: ['React Developer Certification', 'JavaScript Algorithms and Data Structures'],
          sideProjects: ['Personal blog with React', 'Weather app with API integration', 'To-do app with authentication'],
          volunteering: ['Code for nonprofits', 'Teach coding workshops', 'Mentor bootcamp students']
        },
        successMetrics: [
          'Successfully complete assigned features within deadlines',
          'Receive positive peer feedback in code reviews',
          'Build strong relationships with team members',
          'Contribute to team productivity and morale'
        ],
        careerImpact: 'stepping-stone',
        marketDemand: 'high',
        competitionLevel: 'moderate'
      }
    },
    resources: [
      {
        title: 'How to Land Your First Frontend Developer Job',
        url: 'https://www.freecodecamp.org/news/how-to-land-your-first-developer-job/',
        type: 'article',
        estimatedTime: '30 minutes',
        cost: 'free'
      },
      {
        title: 'Frontend Interview Handbook',
        url: 'https://frontendinterviewhandbook.com/',
        type: 'documentation',
        estimatedTime: '2 weeks',
        cost: 'free'
      },
      {
        title: 'Building a Developer Portfolio',
        url: 'https://www.coursera.org/learn/portfolio-development',
        type: 'course',
        estimatedTime: '4 weeks',
        cost: 'freemium'
      }
    ],
    tasks: [
      {
        id: 'task-career-1',
        description: 'Update resume highlighting React projects and technical skills',
        completed: false
      },
      {
        id: 'task-career-2',
        description: 'Apply to 10 junior frontend developer positions',
        completed: false
      },
      {
        id: 'task-career-3',
        description: 'Complete 5 technical interviews and gather feedback',
        completed: false
      },
      {
        id: 'task-career-4',
        description: 'Network with 5 frontend developers in target companies',
        completed: false
      }
    ],
    successCriteria: [
      'Receive multiple interview invitations',
      'Successfully complete technical coding challenges',
      'Secure job offer with competitive compensation',
      'Start position with confidence in core skills'
    ]
  },
  // NEW: Career Progression Milestone - Mid-Level Position  
  {
    id: 'career-2',
    professionalField: 'computer-science',
    title: 'Advance to Mid-Level Frontend Developer',
    description: 'Progress from junior to mid-level frontend developer role, taking on more complex projects and beginning to mentor junior team members. This position builds expertise toward senior-level responsibilities.',
    category: 'career',
    skills: ['Technical Leadership', 'Mentoring', 'Architecture', 'Advanced React'],
    timeframe: '18-24 months',
    completed: false,
    difficulty: 4,
    priority: 'medium',
    estimatedHours: 120,
    attributes: {
      career: {
        positionLevel: 'mid-level',
        targetRole: 'Frontend Developer',
        experienceRequired: '2-3 years',
        keyResponsibilities: [
          'Lead frontend development for major features',
          'Make architectural decisions for component libraries',
          'Mentor junior developers and conduct code reviews',
          'Collaborate with backend team on API design',
          'Drive frontend best practices and standards'
        ],
        advancement_path: {
          fromRole: 'Junior Frontend Developer',
          toRole: 'Senior Frontend Developer',
          timeInRole: '18-24 months',
          promotionCriteria: [
            'Lead complex, multi-month projects successfully',
            'Demonstrate strong mentoring and leadership skills',
            'Contribute to technical strategy and architecture',
            'Build reputation as go-to expert for frontend challenges'
          ]
        },
        industryExperience: {
          sectors: ['Technology', 'FinTech', 'E-commerce', 'Enterprise Software'],
          domainKnowledge: ['Scalable frontend architecture', 'Performance optimization', 'Team leadership'],
          clientTypes: ['Enterprise clients', 'High-traffic applications', 'Complex business domains']
        },
        skillRequirements: {
          technical: ['Advanced React', 'TypeScript', 'Performance optimization', 'Testing', 'CI/CD'],
          soft: ['Leadership', 'Mentoring', 'Project management', 'Stakeholder communication'],
          leadership: ['Code review leadership', 'Technical decision-making', 'Knowledge sharing'],
          specialized: ['Micro-frontends', 'Advanced state management', 'Build optimization']
        },
        compensation: {
          salaryRange: '$75k-100k',
          equity: true,
          benefits: ['Health insurance', 'PTO', 'Learning budget', 'Conference attendance'],
          growthPotential: 'Clear path to senior level with 20-30% salary increases'
        },
        applicationStrategy: {
          whereToApply: ['Established tech companies', 'Growing startups', 'Companies with complex frontends'],
          networking: [
            'Speak at frontend conferences and meetups',
            'Write technical blog posts about React/frontend',
            'Contribute to popular open source projects',
            'Build relationships with senior developers'
          ],
          portfolioNeeds: [
            'Complex applications demonstrating architectural skills',
            'Open source contributions and leadership',
            'Technical writing and documentation',
            'Evidence of mentoring and team impact'
          ],
          interviewPrep: [
            'Study system design for frontend applications',
            'Prepare examples of leadership and mentoring',
            'Practice explaining complex technical decisions',
            'Review advanced React patterns and performance'
          ]
        },
        experienceBuilding: {
          projectTypes: ['Large-scale applications', 'Component libraries', 'Performance-critical apps'],
          certifications: ['AWS Frontend Certification', 'Advanced React Patterns'],
          sideProjects: ['Open source library maintenance', 'Technical blog', 'Conference speaking'],
          mentorship: ['Mentor junior developers', 'Tech lead responsibilities', 'Interview training']
        },
        successMetrics: [
          'Successfully lead projects with junior developers',
          'Improve team productivity and code quality',
          'Receive recognition for technical leadership',
          'Build reputation in the frontend community'
        ],
        careerImpact: 'specialization',
        marketDemand: 'high',
        competitionLevel: 'moderate'
      }
    },
          resources: [
        {
          title: 'The Frontend Lead\'s Handbook',
          url: 'https://frontendleads.com/',
          type: 'book',
          estimatedTime: '3 weeks',
          cost: 'paid'
        },
        {
          title: 'Advanced React Patterns',
          url: 'https://kentcdodds.com/courses/advanced-react-patterns',
          type: 'course',
          estimatedTime: '6 weeks',
          cost: 'paid'
        },
        {
          title: 'Frontend System Design Interview',
          url: 'https://frontendinterview.com/system-design',
          type: 'course',
          estimatedTime: '4 weeks',
          cost: 'freemium'
        }
      ],
      tasks: [
        {
          id: 'task-career-5',
          description: 'Lead a complex feature development from start to finish',
          completed: false
        },
        {
          id: 'task-career-6',
          description: 'Mentor 2 junior developers and track their progress',
          completed: false
        },
        {
          id: 'task-career-7',
          description: 'Present technical solutions to stakeholders',
          completed: false
        },
        {
          id: 'task-career-8',
          description: 'Contribute to open source project with 1000+ stars',
          completed: false
        }
      ],
      successCriteria: [
        'Successfully deliver complex projects on time',
        'Receive positive feedback from mentored developers',
        'Get promoted to senior level within target timeframe',
        'Build strong professional network and reputation'
      ]
  }
];

const sampleRoadmap: CareerRoadmap = {
  id: 'demo-roadmap',
  candidateId: 'demo-user',
  professionalField: 'computer-science',
  milestones: sampleMilestones,
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function RoadmapDemoPage() {
  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    console.log(`Toggling milestone ${milestoneId} to ${completed ? 'completed' : 'incomplete'}`);
    // In a real app, this would update the database
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 font-inter mb-4">
            Categorized Career Roadmap Demo
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            This demo showcases the new milestone categorization system with sample data across 
            technical, fundamental, niche, and soft skill categories.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-3xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Features demonstrated:</strong> Category filtering, difficulty indicators, 
              priority levels, progress tracking, detailed milestone attributes, and resource management.
            </p>
          </div>
        </div>

        {/* Roadmap Component */}
        <CategorizedCareerRoadmap 
          roadmap={sampleRoadmap}
          isEditable={true}
          onMilestoneToggle={handleMilestoneToggle}
        />
      </div>
    </div>
  );
} 