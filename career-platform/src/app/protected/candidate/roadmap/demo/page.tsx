'use client';

import React from 'react';
import CategorizedCareerRoadmap from '@/components/candidate/CategorizedCareerRoadmap';
import { CareerRoadmap, Milestone } from '@/types/user';

const sampleMilestones: Milestone[] = [
  {
    id: 'tech-001',
    title: 'Build Full-Stack E-commerce Application',
    description: 'Develop a complete e-commerce platform with React frontend, Node.js backend, and PostgreSQL database',
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
  }
];

const sampleRoadmap: CareerRoadmap = {
  id: 'demo-roadmap',
  candidateId: 'demo-user',
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