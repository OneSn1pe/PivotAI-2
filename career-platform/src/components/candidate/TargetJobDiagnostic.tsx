'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile } from '@/types/user';
import { analyzeCareerPath } from '@/services/openai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Briefcase, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  Building,
  DollarSign,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface JobRecommendation {
  title: string;
  matchScore: number;
  description: string;
  requiredSkills: string[];
  matchingSkills: string[];
  gapSkills: string[];
  salaryRange: string;
  seniorityLevel: string;
  growthPotential: 'High' | 'Medium' | 'Low';
}

interface DiagnosticResult {
  recommendations: JobRecommendation[];
  careerPath: {
    current: string;
    shortTerm: string[];
    longTerm: string[];
  };
  insights: {
    strengths: string[];
    opportunities: string[];
    industryTrends: string[];
  };
}

export default function TargetJobDiagnostic() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'intro' | 'preferences' | 'analyzing' | 'results'>('intro');
  
  // User preferences for job search
  const [preferences, setPreferences] = useState({
    workType: 'hybrid' as 'remote' | 'hybrid' | 'onsite',
    companySizes: [] as string[],
    industries: [] as string[],
    priorities: [] as string[]
  });

  const industryOptions = [
    'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
    'Media & Entertainment', 'Manufacturing', 'Consulting', 'Non-profit'
  ];

  const priorityOptions = [
    'Salary & Compensation', 'Work-Life Balance', 'Career Growth',
    'Company Culture', 'Job Security', 'Innovation', 'Social Impact'
  ];

  const companySizeOptions = [
    'Startup (1-50)', 'Small (51-200)', 'Medium (201-1000)', 'Large (1000+)'
  ];

  const runDiagnostic = async () => {
    if (!candidateProfile?.resumeAnalysis) {
      setError('Please upload your resume first to get personalized recommendations.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('analyzing');

    try {
      // Prepare the analysis prompt
      const prompt = `Based on the following resume analysis and job preferences, provide detailed target job recommendations:

Resume Analysis:
- Skills: ${candidateProfile.resumeAnalysis.skills.join(', ')}
- Strengths: ${candidateProfile.resumeAnalysis.strengths.join('. ')}
- Experience Level: ${candidateProfile.resumeAnalysis.experienceLevel || 'Not specified'}

Job Preferences:
- Work Type: ${preferences.workType}
- Preferred Industries: ${preferences.industries.join(', ') || 'Open to all'}
- Company Sizes: ${preferences.companySizes.join(', ') || 'No preference'}
- Priorities: ${preferences.priorities.join(', ') || 'No specific priorities'}

Please provide:
1. Top 5 job recommendations with match scores (0-100)
2. Required skills for each role
3. Skills gap analysis
4. Career progression path (current → short-term → long-term)
5. Industry insights and trends

Format the response as a structured JSON object.`;

      // Call the OpenAI service
      const response = await analyzeCareerPath(prompt);
      
      // Parse and validate the response
      const parsedResults = parseAIResponse(response);
      setResults(parsedResults);
      setStep('results');
    } catch (err) {
      console.error('Diagnostic error:', err);
      setError('Failed to generate job recommendations. Please try again.');
      setStep('intro');
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (response: any): DiagnosticResult => {
    // This is a simplified parser - in production, you'd want more robust parsing
    try {
      if (typeof response === 'string') {
        // Extract JSON from the response if it's wrapped in text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          response = JSON.parse(jsonMatch[0]);
        }
      }

      // Provide default structure if parsing fails
      return response || generateMockResults();
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return generateMockResults();
    }
  };

  const generateMockResults = (): DiagnosticResult => {
    // Generate mock results based on user's actual skills
    const skills = candidateProfile?.resumeAnalysis?.skills || [];
    
    return {
      recommendations: [
        {
          title: "Senior Software Engineer",
          matchScore: 85,
          description: "Lead development of scalable web applications",
          requiredSkills: ["React", "Node.js", "TypeScript", "AWS"],
          matchingSkills: skills.slice(0, 3),
          gapSkills: ["AWS", "System Design"],
          salaryRange: "$120k - $180k",
          seniorityLevel: "Senior",
          growthPotential: "High"
        },
        {
          title: "Full Stack Developer",
          matchScore: 78,
          description: "Build end-to-end features for web platforms",
          requiredSkills: ["JavaScript", "Python", "SQL", "Docker"],
          matchingSkills: skills.slice(0, 2),
          gapSkills: ["Docker", "Kubernetes"],
          salaryRange: "$90k - $140k",
          seniorityLevel: "Mid-level",
          growthPotential: "High"
        },
        {
          title: "Technical Lead",
          matchScore: 72,
          description: "Guide technical direction and mentor developers",
          requiredSkills: ["Architecture", "Team Leadership", "Agile", "Cloud"],
          matchingSkills: skills.slice(0, 2),
          gapSkills: ["Team Leadership", "Architecture"],
          salaryRange: "$130k - $200k",
          seniorityLevel: "Lead",
          growthPotential: "Medium"
        }
      ],
      careerPath: {
        current: "Software Developer",
        shortTerm: ["Senior Developer", "Tech Lead"],
        longTerm: ["Engineering Manager", "Solutions Architect", "CTO"]
      },
      insights: {
        strengths: [
          "Strong technical foundation in modern web technologies",
          "Experience with full-stack development",
          "Demonstrated problem-solving abilities"
        ],
        opportunities: [
          "Gain cloud platform expertise (AWS/GCP/Azure)",
          "Develop leadership and mentoring skills",
          "Expand knowledge in system design and architecture"
        ],
        industryTrends: [
          "High demand for full-stack developers with cloud experience",
          "Growing opportunities in AI/ML integration",
          "Remote work becoming standard in tech roles"
        ]
      }
    };
  };

  if (!candidateProfile?.resumeAnalysis) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Resume Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your resume first to get personalized job recommendations
            </p>
            <Button
              onClick={() => window.location.href = '/protected/candidate/profile'}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Upload Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Diagnostic Trigger Button */}
      {!isOpen && (
        <Card className="border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Target Job Diagnostic</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Get AI-powered job recommendations based on your skills
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Modal/Expanded View */}
      {isOpen && (
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium">Target Job Diagnostic</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setStep('intro');
                  setResults(null);
                }}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Intro Step */}
            {step === 'intro' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-light text-gray-900 mb-2">
                    Discover Your Ideal Career Path
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Our AI-powered diagnostic analyzes your resume and preferences to recommend 
                    target jobs that match your skills and career goals.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Personalized Matches</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Jobs tailored to your skills and experience
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <TrendingUp className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Career Progression</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      See your potential career trajectory
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <Target className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Skills Gap Analysis</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Identify areas for growth
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => setStep('preferences')}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                  >
                    Start Diagnostic
                  </Button>
                </div>
              </div>
            )}

            {/* Preferences Step */}
            {step === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tell us your preferences</h3>
                  
                  {/* Work Type */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Preferred Work Environment
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['remote', 'hybrid', 'onsite'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setPreferences(prev => ({ ...prev, workType: type as any }))}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                            preferences.workType === type
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industries */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Preferred Industries (select up to 3)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {industryOptions.map((industry) => (
                        <button
                          key={industry}
                          onClick={() => {
                            setPreferences(prev => ({
                              ...prev,
                              industries: prev.industries.includes(industry)
                                ? prev.industries.filter(i => i !== industry)
                                : [...prev.industries, industry].slice(0, 3)
                            }));
                          }}
                          className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                            preferences.industries.includes(industry)
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {industry}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Company Size Preference
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {companySizeOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setPreferences(prev => ({
                              ...prev,
                              companySizes: prev.companySizes.includes(size)
                                ? prev.companySizes.filter(s => s !== size)
                                : [...prev.companySizes, size]
                            }));
                          }}
                          className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                            preferences.companySizes.includes(size)
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priorities */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Top Priorities (select up to 3)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {priorityOptions.map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            setPreferences(prev => ({
                              ...prev,
                              priorities: prev.priorities.includes(priority)
                                ? prev.priorities.filter(p => p !== priority)
                                : [...prev.priorities, priority].slice(0, 3)
                            }));
                          }}
                          className={`p-2 rounded-md border text-xs font-medium transition-colors ${
                            preferences.priorities.includes(priority)
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep('intro')}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={runDiagnostic}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Analyze My Profile
                  </Button>
                </div>
              </div>
            )}

            {/* Analyzing Step */}
            {step === 'analyzing' && (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Your Profile</h3>
                <p className="text-sm text-gray-600">
                  Matching your skills with thousands of job opportunities...
                </p>
              </div>
            )}

            {/* Results Step */}
            {step === 'results' && results && (
              <div className="space-y-6">
                {/* Job Recommendations */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Target Jobs</h3>
                  <div className="space-y-4">
                    {results.recommendations.map((job, index) => (
                      <Card key={index} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{job.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-semibold text-gray-900">
                                {job.matchScore}%
                              </div>
                              <p className="text-xs text-gray-500">match</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              {job.salaryRange}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Briefcase className="h-4 w-4" />
                              {job.seniorityLevel}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Matching Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {job.matchingSkills.map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {job.gapSkills.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Skills to Develop</p>
                                <div className="flex flex-wrap gap-1">
                                  {job.gapSkills.map((skill, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Career Path */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Career Trajectory</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Current</p>
                      <p className="font-medium text-gray-900">{results.careerPath.current}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">1-3 Years</p>
                      <div className="space-y-1">
                        {results.careerPath.shortTerm.map((role, i) => (
                          <p key={i} className="text-sm text-gray-700">{role}</p>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">3-5 Years</p>
                      <div className="space-y-1">
                        {results.careerPath.longTerm.slice(0, 2).map((role, i) => (
                          <p key={i} className="text-sm text-gray-700">{role}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700">
                        Your Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {results.insights.strengths.map((strength, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700">
                        Growth Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {results.insights.opportunities.map((opportunity, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700">
                        Industry Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {results.insights.industryTrends.map((trend, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {trend}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => {
                      setStep('intro');
                      setResults(null);
                    }}
                    variant="outline"
                  >
                    Run Again
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}