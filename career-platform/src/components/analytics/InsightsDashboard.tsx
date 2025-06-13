'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  Calendar, 
  Clock, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap, 
  Trophy, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Brain,
  Flame,
  Users,
  Activity
} from 'lucide-react';
import { UserProgress, Milestone } from '@/types/user';
import { AnalyticsService, ProgressInsights, Recommendation } from '@/services/analyticsService';
import { EmptyState } from '@/components/ui/empty-state';

interface InsightsDashboardProps {
  userProgress: UserProgress;
  milestones: Milestone[];
  className?: string;
}

export function InsightsDashboard({ 
  userProgress, 
  milestones, 
  className = '' 
}: InsightsDashboardProps) {
  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'recommendations' | 'goals'>('overview');

  useEffect(() => {
    loadInsights();
  }, [userProgress, milestones]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const progressInsights = await AnalyticsService.generateProgressInsights(
        userProgress.userId,
        userProgress,
        milestones
      );
      setInsights(progressInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <EmptyState
            illustration="NoData"
            title="No Insights Available"
            description="Complete more activities to generate personalized insights."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Learning Analytics & Insights
            </CardTitle>
            <div className="flex bg-gray-200 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'trends', label: 'Trends', icon: LineChart },
                { id: 'recommendations', label: 'Insights', icon: Lightbulb },
                { id: 'goals', label: 'Goals', icon: Target }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-all ${
                      activeTab === tab.id ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Completion Rate"
                  value={insights.performanceMetrics.completionRate}
                  suffix="%"
                  icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                  trend="up"
                />
                <MetricCard
                  title="Consistency"
                  value={insights.performanceMetrics.streakConsistency}
                  suffix="%"
                  icon={<Flame className="h-5 w-5 text-orange-500" />}
                  trend="neutral"
                />
                <MetricCard
                  title="Learning Velocity"
                  value={insights.performanceMetrics.learningVelocity}
                  suffix="pts"
                  icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                  trend="up"
                />
              </div>
            </CardContent>
          </Card>

          {/* Learning Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Learning Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Most Productive Days</h4>
                  <div className="space-y-2">
                    {insights.patterns.mostProductiveDays.map((day, index) => (
                      <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{day}</span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Learning Profile</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-sm font-medium text-blue-800">Optimal Time</div>
                      <div className="text-blue-600">{insights.patterns.optimalLearningTime}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Strengths</div>
                      <div className="flex flex-wrap gap-1">
                        {insights.patterns.strengths.slice(0, 3).map(strength => (
                          <Badge key={strength} className="bg-green-100 text-green-700 text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skill Gaps Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Priority Skill Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.skillGaps.slice(0, 3).map(gap => (
                  <SkillGapCard key={gap.skill} skillGap={gap} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <TrendsView trends={insights.trends} />
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <RecommendationsView 
            recommendations={insights.recommendations}
            skillGaps={insights.skillGaps}
            patterns={insights.patterns}
          />
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <GoalsView goalPrediction={insights.goalPrediction} userProgress={userProgress} />
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, suffix = '', icon, trend }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return null;
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        {icon}
        {getTrendIcon()}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

// Skill Gap Card Component
function SkillGapCard({ skillGap }: { skillGap: ProgressInsights['skillGaps'][0] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const progress = (skillGap.currentLevel / skillGap.targetLevel) * 100;

  return (
    <div className={`p-4 rounded-lg border ${getPriorityColor(skillGap.priority)}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">{skillGap.skill}</h4>
        <Badge 
          variant="outline" 
          className={`text-xs ${
            skillGap.priority === 'high' ? 'text-red-600' : 
            skillGap.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`}
        >
          {skillGap.priority} priority
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Current: {skillGap.currentLevel}%</span>
          <span>Target: {skillGap.targetLevel}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</div>
        <ul className="text-xs text-gray-600 space-y-1">
          {skillGap.recommendedActions.slice(0, 2).map((action, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className="text-gray-400">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Trends View Component
function TrendsView({ trends }: { trends: ProgressInsights['trends'] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Level Progress Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Level Progress Chart</h3>
              <p className="text-gray-600">Visual trend analysis would be displayed here</p>
              <div className="mt-4 text-sm text-gray-500">
                Last 30 days: {trends.levelProgression.length} data points
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Level Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.levelProgression.slice(-7).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{entry.date.toLocaleDateString()}</span>
                  <Badge variant="outline">Level {entry.level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Streak Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.streakPatterns.slice(-7).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{entry.date.toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-sm font-medium">{entry.streak} days</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Recommendations View Component
function RecommendationsView({ 
  recommendations, 
  skillGaps, 
  patterns 
}: { 
  recommendations: Recommendation[];
  skillGaps: ProgressInsights['skillGaps'];
  patterns: ProgressInsights['patterns'];
}) {
  return (
    <div className="space-y-6">
      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map(rec => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Focus Areas</h4>
              <div className="space-y-2">
                {patterns.improvementAreas.map(area => (
                  <div key={area} className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Your Strengths</h4>
              <div className="space-y-2">
                {patterns.strengths.map(strength => (
                  <div key={strength} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <Star className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{recommendation.title}</h4>
          <p className="text-sm text-gray-600">{recommendation.description}</p>
        </div>
        <Badge variant="outline" className="text-xs ml-2">
          {recommendation.priority}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="p-2 bg-white rounded border">
          <div className="text-xs font-medium text-gray-700 mb-1">Expected Impact</div>
          <div className="text-sm">
            {recommendation.expectedImpact.skillImprovement.length > 0 && (
              <span className="text-gray-600 ml-2">
                Skills: {recommendation.expectedImpact.skillImprovement.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-2 bg-white rounded border">
          <div className="text-xs font-medium text-gray-700 mb-1">Time Commitment</div>
          <div className="text-sm text-gray-600">{recommendation.estimatedTimeCommitment}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Action Items:</div>
        <ul className="text-xs text-gray-600 space-y-1">
          {recommendation.actionItems.slice(0, 3).map((item, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className="text-gray-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Goals View Component
function GoalsView({ 
  goalPrediction, 
  userProgress 
}: { 
  goalPrediction: ProgressInsights['goalPrediction'];
  userProgress: UserProgress;
}) {
  const daysUntilLevelUp = goalPrediction.daysToNextLevel;
  const confidencePercentage = Math.round(goalPrediction.confidenceScore * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Next Level Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {daysUntilLevelUp} days
              </div>
              <div className="text-sm text-blue-700">Until Level {userProgress.currentLevel + 1}</div>
              <div className="text-xs text-blue-600 mt-2">
                Est. {goalPrediction.estimatedLevelUpDate.toLocaleDateString()}
              </div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <Trophy className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-600 mb-2">
                {confidencePercentage}%
              </div>
              <div className="text-sm text-green-700">Prediction Confidence</div>
              <div className="text-xs text-green-600 mt-2">
                Based on current activity patterns
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="font-semibold text-purple-800">Milestone Target</span>
              </div>
              <Badge className="bg-purple-100 text-purple-700">
                {goalPrediction.requiredDailyMilestones} milestones/week
              </Badge>
            </div>
            <p className="text-sm text-purple-700">
              To reach Level {userProgress.currentLevel + 1} within the predicted timeframe, 
              aim for {goalPrediction.requiredDailyMilestones} milestones per week.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goal Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Maintain Consistency</h4>
              <p className="text-sm text-gray-600 mb-3">
                Keep your learning streak alive to maintain momentum and consistency.
              </p>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Current streak: {userProgress.streakDays} days</span>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Focus on High-Value Milestones</h4>
              <p className="text-sm text-gray-600">
                Prioritize high-impact milestones to accelerate progress.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Optimize Learning Schedule</h4>
              <p className="text-sm text-gray-600">
                Based on your patterns, you're most productive during morning hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}