'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProgress, CandidateProfile } from '@/types/user';
import { SocialEngagement } from '@/components/social/SocialEngagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Trophy, 
  Target, 
  Share2,
  TrendingUp,
  Award,
  Crown,
  Star
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SocialPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProgress();
  }, [userProfile]);

  const loadUserProgress = async () => {
    if (!userProfile) return;
    
    try {
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
      
      setUserProgress(mockProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user progress:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading social features" />
      </div>
    );
  }

  if (!userProgress) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-card border border-slate-200">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">No Progress Data</h2>
          <p className="text-slate-600">
            Complete some milestones to unlock social features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Community Hub</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Connect with fellow learners and share your achievements 
          with the community.
        </p>
      </div>

      {/* User Stats Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {candidateProfile?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-xl">{candidateProfile?.displayName || 'User'}</div>
              <div className="text-sm text-gray-600">Level {userProgress.currentLevel}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{userProgress.currentLevel}</div>
              <div className="text-sm text-gray-600">Current Level</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <Trophy className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{userProgress.completedMilestones.length}</div>
              <div className="text-sm text-gray-600">Milestones</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{userProgress.achievements.length}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{userProgress.streakDays}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Social Engagement */}
      <SocialEngagement 
        userProgress={userProgress}
        userField="technology"
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-500" />
            Share Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Share Latest Achievement</h4>
              <p className="text-sm text-gray-600 mb-3">
                Show off your latest milestone completion to your network
              </p>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Achievement
              </Button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Invite Friends</h4>
              <p className="text-sm text-gray-600 mb-3">
                Invite colleagues to join PivotAI and compete together
              </p>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Send Invites
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Do's</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Celebrate others' achievements</li>
                <li>• Share helpful resources and tips</li>
                <li>• Participate in community challenges</li>
                <li>• Ask questions and help others</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Don'ts</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Share personal or sensitive information</li>
                <li>• Spam or self-promote excessively</li>
                <li>• Criticize others' progress</li>
                <li>• Share inappropriate content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}