'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Eye,
  Settings,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateCareerRoadmap, analyzeResume } from '@/services/openai';
import { ResumeAnalysis, TargetCompany, CareerRoadmap } from '@/types/user';

interface TestResult {
  id: string;
  timestamp: Date;
  type: 'resume' | 'roadmap';
  status: 'pending' | 'success' | 'error' | 'timeout';
  duration: number;
  result?: any;
  error?: string;
  inputData?: any;
}

interface TestConfiguration {
  resumeText: string;
  targetCompanies: TargetCompany[];
  timeout: number;
  retries: number;
  useRealData: boolean;
  logLevel: 'minimal' | 'detailed' | 'verbose';
}

export function MilestoneGenerationTester() {
  const { userProfile } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [config, setConfig] = useState<TestConfiguration>({
    resumeText: `John Doe
Software Developer
Email: john.doe@email.com
Phone: (555) 123-4567

EXPERIENCE
Senior Software Engineer | TechCorp | 2020-2023
- Developed React applications with TypeScript
- Led team of 5 developers on microservices architecture
- Implemented CI/CD pipelines using Jenkins and Docker

Software Engineer | StartupXYZ | 2018-2020
- Built REST APIs using Node.js and Express
- Worked with MongoDB and PostgreSQL databases
- Collaborated with product teams on feature development

EDUCATION
Bachelor of Computer Science | University of Technology | 2018

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, MongoDB, PostgreSQL, Docker, AWS, Git, Agile`,
    targetCompanies: [
      { name: 'Google', position: 'Senior Software Engineer' },
      { name: 'Microsoft', position: 'Principal Software Engineer' }
    ],
    timeout: 300000, // 5 minutes
    retries: 3,
    useRealData: false,
    logLevel: 'detailed'
  });
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };

  const generateTestId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const runResumeAnalysisTest = async () => {
    const testId = generateTestId();
    const startTime = performance.now();
    
    const testResult: TestResult = {
      id: testId,
      timestamp: new Date(),
      type: 'resume',
      status: 'pending',
      duration: 0,
      inputData: { resumeText: config.resumeText.substring(0, 200) + '...' }
    };
    
    addTestResult(testResult);
    setCurrentTest(testId);
    
    try {
      if (config.logLevel === 'verbose') {
        console.log('🧪 Starting resume analysis test:', testId);
        console.log('📄 Resume text length:', config.resumeText.length);
      }
      
      const analysis = await analyzeResume(config.resumeText);
      const duration = performance.now() - startTime;
      
      const updatedResult: TestResult = {
        ...testResult,
        status: 'success',
        duration,
        result: analysis
      };
      
      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      
      if (config.logLevel !== 'minimal') {
        console.log('✅ Resume analysis completed:', {
          duration: Math.round(duration),
          skills: analysis.skills?.length || 0,
          experience: analysis.experience?.length || 0
        });
      }
      
      return analysis;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const status = error.name === 'AbortError' || error.message?.includes('timeout') ? 'timeout' : 'error';
      
      const updatedResult: TestResult = {
        ...testResult,
        status,
        duration,
        error: error.message || String(error)
      };
      
      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      
      console.error('❌ Resume analysis failed:', error);
      throw error;
    } finally {
      if (currentTest === testId) {
        setCurrentTest(null);
      }
    }
  };

  const runRoadmapGenerationTest = async (resumeAnalysis?: ResumeAnalysis) => {
    const testId = generateTestId();
    const startTime = performance.now();
    
    // Use provided analysis or run resume analysis first
    let analysis = resumeAnalysis;
    if (!analysis) {
      if (config.logLevel !== 'minimal') {
        console.log('🔄 Running resume analysis first...');
      }
      analysis = await runResumeAnalysisTest();
    }
    
    const testResult: TestResult = {
      id: testId,
      timestamp: new Date(),
      type: 'roadmap',
      status: 'pending',
      duration: 0,
      inputData: {
        targetCompanies: config.targetCompanies,
        skillsCount: analysis.skills?.length || 0,
        experienceCount: analysis.experience?.length || 0
      }
    };
    
    addTestResult(testResult);
    setCurrentTest(testId);
    
    try {
      if (config.logLevel === 'verbose') {
        console.log('🗺️ Starting roadmap generation test:', testId);
        console.log('🎯 Target companies:', config.targetCompanies);
        console.log('📊 Analysis data:', {
          skills: analysis.skills?.length,
          experience: analysis.experience?.length,
          education: analysis.education?.length
        });
      }
      
      const roadmap = await generateCareerRoadmap(
        analysis,
        config.targetCompanies,
        userProfile?.uid || 'test-candidate'
      );
      
      const duration = performance.now() - startTime;
      
      const updatedResult: TestResult = {
        ...testResult,
        status: 'success',
        duration,
        result: roadmap
      };
      
      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      
      if (config.logLevel !== 'minimal') {
        console.log('✅ Roadmap generation completed:', {
          duration: Math.round(duration),
          milestones: roadmap.milestones?.length || 0,
          milestonesCount: roadmap.milestones?.length || 0
        });
      }
      
      return roadmap;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const status = error.name === 'AbortError' || error.message?.includes('timeout') ? 'timeout' : 'error';
      
      const updatedResult: TestResult = {
        ...testResult,
        status,
        duration,
        error: error.message || String(error)
      };
      
      setTestResults(prev => prev.map(r => r.id === testId ? updatedResult : r));
      
      console.error('❌ Roadmap generation failed:', error);
      throw error;
    } finally {
      if (currentTest === testId) {
        setCurrentTest(null);
      }
    }
  };

  const runFullTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('🚀 Starting full milestone generation test suite');
      
      // Step 1: Analyze resume
      const analysis = await runResumeAnalysisTest();
      
      // Step 2: Generate roadmap
      await runRoadmapGenerationTest(analysis);
      
      console.log('🎉 Full test suite completed successfully');
    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const stopTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setCurrentTest(null);
  };

  const clearResults = () => {
    setTestResults([]);
    setSelectedResult(null);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `milestone_tests_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'border-blue-300 bg-blue-50';
      case 'success': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
      case 'timeout': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Milestone Generation Tester
        </h1>
        <p className="text-gray-600">
          Test and debug OpenAI milestone generation in development environment
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="30000"
                max="600000"
                step="30000"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Retries
              </label>
              <input
                type="number"
                value={config.retries}
                onChange={(e) => setConfig(prev => ({ ...prev, retries: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                max="5"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Log Level
              </label>
              <select
                value={config.logLevel}
                onChange={(e) => setConfig(prev => ({ ...prev, logLevel: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="minimal">Minimal</option>
                <option value="detailed">Detailed</option>
                <option value="verbose">Verbose</option>
              </select>
            </div>
          </div>

          {/* Target Companies */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Target Companies
            </label>
            <div className="space-y-2">
              {config.targetCompanies.map((company, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => {
                      const newCompanies = [...config.targetCompanies];
                      newCompanies[index].name = e.target.value;
                      setConfig(prev => ({ ...prev, targetCompanies: newCompanies }));
                    }}
                    placeholder="Company name"
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={company.position}
                    onChange={(e) => {
                      const newCompanies = [...config.targetCompanies];
                      newCompanies[index].position = e.target.value;
                      setConfig(prev => ({ ...prev, targetCompanies: newCompanies }));
                    }}
                    placeholder="Position"
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                  {config.targetCompanies.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCompanies = config.targetCompanies.filter((_, i) => i !== index);
                        setConfig(prev => ({ ...prev, targetCompanies: newCompanies }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    targetCompanies: [...prev.targetCompanies, { name: '', position: '' }]
                  }));
                }}
              >
                Add Company
              </Button>
            </div>
          </div>

          {/* Resume Text */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Test Resume Text
            </label>
            <textarea
              value={config.resumeText}
              onChange={(e) => setConfig(prev => ({ ...prev, resumeText: e.target.value }))}
              className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="Enter resume text for testing..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {config.resumeText.length} characters
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={runFullTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Run Full Test
            </Button>
            
            <Button
              onClick={runResumeAnalysisTest}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Test Resume Analysis
            </Button>
            
            <Button
              onClick={() => runRoadmapGenerationTest()}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Test Roadmap Generation
            </Button>
            
            {isRunning && (
              <Button
                onClick={stopTest}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Stop Test
              </Button>
            )}
            
            <div className="flex-1" />
            
            <Button
              onClick={exportResults}
              disabled={testResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Results
            </Button>
            
            <Button
              onClick={clearResults}
              disabled={testResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results ({testResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No test results yet. Run a test to see results here.
                </div>
              ) : (
                testResults.map(result => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      getStatusColor(result.status)
                    } ${selectedResult?.id === result.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDuration(result.duration)}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">{result.timestamp.toLocaleTimeString()}</div>
                      {result.error && (
                        <div className="text-red-600 text-xs mt-1 truncate">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Result Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {selectedResult.status}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(selectedResult.duration)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedResult.type}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedResult.timestamp.toLocaleString()}
                  </div>
                </div>
                
                {selectedResult.error && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Error:</h4>
                    <pre className="bg-red-50 p-3 rounded text-xs text-red-800 overflow-auto">
                      {selectedResult.error}
                    </pre>
                  </div>
                )}
                
                {selectedResult.result && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Result Summary:</h4>
                    <div className="bg-green-50 p-3 rounded text-sm">
                      {selectedResult.type === 'resume' && (
                        <div className="space-y-1">
                          <div>Skills: {selectedResult.result.skills?.length || 0}</div>
                          <div>Experience: {selectedResult.result.experience?.length || 0}</div>
                          <div>Education: {selectedResult.result.education?.length || 0}</div>
                        </div>
                      )}
                      {selectedResult.type === 'roadmap' && (
                        <div className="space-y-1">
                          <div>Milestones: {selectedResult.result.milestones?.length || 0}</div>
                          <div>Milestones: {selectedResult.result.milestones?.length || 0}</div>
                          <div>Categories: {new Set(selectedResult.result.milestones?.map((m: any) => m.category)).size || 0}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <details className="text-sm">
                  <summary className="font-medium cursor-pointer">Full Result Data</summary>
                  <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedResult, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a test result to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {testResults.filter(r => r.status === 'timeout').length}
                </div>
                <div className="text-sm text-gray-600">Timeouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {formatDuration(
                    testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length
                  )}
                </div>
                <div className="text-sm text-gray-600">Avg Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}