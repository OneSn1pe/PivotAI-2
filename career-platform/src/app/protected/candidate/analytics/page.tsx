'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProgress, CandidateProfile, Milestone } from '@/types/user';
import { InsightsDashboard } from '@/components/analytics/InsightsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  Download,
  Share2,
  RefreshCw,
  Info
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalyticsData();
  }, [userProfile]);

  const loadAnalyticsData = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      // Mock data for development - replace with actual Firebase calls
      const mockProgress: UserProgress = {
        userId: userProfile.uid,
        currentLevel: 1,
        currentXP: 0,
        totalXP: 0,
        maxUnlockedLevel: 1,
        completedMilestones: [],
        completedMicroMilestones: [],
        achievements: [],
        streakDays: 0,
        lastActiveDate: new Date(),
        skillProficiencies: {}
      };

      const mockProgressOLD: UserProgress = {
        userId: userProfile.uid,
        currentLevel: 1,
        currentXP: 0,
        totalXP: 0,
        maxUnlockedLevel: 1,
        completedMilestones: [],
        completedMicroMilestones: [],
        achievements: ['first_milestone', 'streak_5'],
        streakDays: 0,
        lastActiveDate: new Date(),
        skillProficiencies: {}
      };

      const mockMilestones: Milestone[] = [
        {
          id: 'milestone-1',
          title: 'Frontend Development Fundamentals',
          description: 'Master the basics of modern frontend development',
          completed: true,
          category: 'technical',
          priority: 'high',
          timeframe: '2 weeks',
          level: 1,
          skills: ['HTML', 'CSS', 'JavaScript'],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          resources: [
            {
              title: 'MDN Web Docs',
              type: 'documentation',
              url: 'https://developer.mozilla.org',
              description: 'Comprehensive web development documentation'
            }
          ],
          professionalField: 'computer-science' as const,
          attributes: {
            cs: {
              technologies: ['HTML', 'CSS', 'JavaScript'],
              projectType: 'frontend' as const,
              complexityLevel: 'beginner' as const,
              deliverables: [],
              learningPath: 'self-directed' as const
            }
          },
          successCriteria: ['Build a responsive webpage', 'Understand JavaScript fundamentals']
        },
        {
          id: 'milestone-2',
          title: 'React Component Architecture',
          description: 'Build scalable React applications with proper component design',
          completed: true,
          category: 'technical',
          priority: 'high',
          timeframe: '3 weeks',
          level: 2,
          skills: ['React', 'Component Design', 'State Management'],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          resources: [
            {
              title: 'React Documentation',
              type: 'documentation',
              url: 'https://react.dev',
              description: 'Official React documentation and tutorials'
            }
          ],
          professionalField: 'computer-science' as const,
          attributes: {
            cs: {
              technologies: ['React', 'Component Design', 'State Management'],
              projectType: 'frontend' as const,
              complexityLevel: 'intermediate' as const,
              deliverables: [],
              learningPath: 'self-directed' as const
            }
          },
          successCriteria: ['Create reusable components', 'Implement proper state management']
        },
        {
          id: 'milestone-3',
          title: 'Backend API Development',
          description: 'Create robust REST APIs with proper authentication',
          completed: false,
          category: 'technical',
          priority: 'medium',
          timeframe: '4 weeks',
          level: 3,
          skills: ['Node.js', 'Express', 'API Design', 'Authentication'],
          createdAt: new Date(),
          resources: [
            {
              title: 'Node.js Guide',
              type: 'tutorial',
              url: 'https://nodejs.org/en/docs/',
              description: 'Official Node.js documentation and guides'
            }
          ],
          professionalField: 'computer-science' as const,
          attributes: {
            cs: {
              technologies: ['Node.js', 'Express', 'API Design', 'Authentication'],
              projectType: 'backend' as const,
              complexityLevel: 'intermediate' as const,
              deliverables: [],
              learningPath: 'self-directed' as const
            }
          },
          successCriteria: ['Build a RESTful API', 'Implement JWT authentication']
        }
      ];
      
      setUserProgress(mockProgress);
      setMilestones(mockMilestones);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  const handleShareInsights = () => {
    // Implementation for sharing insights
    console.log('Sharing insights...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading analytics data" />
      </div>
    );
  }

  if (!userProgress) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-card border border-slate-200">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-slate-800">No Analytics Data</h2>
          <p className="text-slate-600 mb-6">
            Complete some milestones and activities to generate personalized analytics and insights.
          </p>
          <Button 
            onClick={() => window.location.href = '/protected/candidate/roadmap'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Target className="h-4 w-4 mr-2" />
            View Roadmap
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Learning Analytics</h1>
          <p className="text-slate-600 max-w-2xl">
            Gain insights into your learning patterns, track progress, and discover optimization opportunities 
            to accelerate your career development.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleShareInsights} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userProgress.currentLevel}</div>
            <div className="text-sm text-gray-600">Current Level</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userProgress.completedMilestones.length}</div>
            <div className="text-sm text-gray-600">Milestones</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{userProgress.streakDays}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleString()}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Real-time data
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Dashboard */}
      <InsightsDashboard 
        userProgress={userProgress}
        milestones={milestones}
      />

      {/* Data Privacy Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Privacy & Data Usage</h4>
              <p className="text-sm text-gray-600">
                Your analytics data is processed locally and used only to generate personalized insights. 
                No personal information is shared with third parties. You can export or delete your data at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}