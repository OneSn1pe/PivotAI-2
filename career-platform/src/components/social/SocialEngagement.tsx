'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy,
  Users,
  Target,
  Calendar,
  Clock,
  Zap,
  Star,
  Gift,
  ChevronRight,
  User,
  Check
} from 'lucide-react';
import { UserProgress, Achievement } from '@/types/user';

interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants?: number;
  rewards: {
    achievements: string[];
    badges: string[];
  };
  requirements: {
    type: 'milestones' | 'streak' | 'skills';
    target: number;
    description: string;
  };
  progress?: number;
  isJoined?: boolean;
  isCompleted?: boolean;
}

interface CommunityUpdate {
  id: string;
  type: 'achievement' | 'milestone' | 'challenge' | 'announcement';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
}

interface SocialEngagementProps {
  userProgress: UserProgress;
  userField?: string;
  className?: string;
}

export function SocialEngagement({ 
  userProgress, 
  userField = 'technology',
  className = '' 
}: SocialEngagementProps) {
  const [activeTab, setActiveTab] = useState<'challenges' | 'community'>('challenges');
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      
      // Mock challenges data
      const mockChallenges: CommunityChallenge[] = [
        {
          id: 'challenge1',
          title: 'Weekly Learning Sprint',
          description: 'Complete 3 milestones this week',
          type: 'weekly',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          participants: 234,
          rewards: {
            achievements: ['Sprint Master'],
            badges: ['Weekly Champion']
          },
          requirements: {
            type: 'milestones',
            target: 3,
            description: 'Complete any 3 milestones'
          },
          progress: 33,
          isJoined: true
        },
        {
          id: 'challenge2',
          title: 'Monthly Streak Master',
          description: 'Maintain a 30-day learning streak',
          type: 'monthly',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          participants: 512,
          rewards: {
            achievements: ['Streak Legend'],
            badges: ['Consistency Crown']
          },
          requirements: {
            type: 'streak',
            target: 30,
            description: 'Learn for 30 consecutive days'
          },
          progress: 20
        }
      ];

      // Mock community updates
      const mockUpdates: CommunityUpdate[] = [
        {
          id: 'update1',
          type: 'announcement',
          title: 'New React Course Available',
          description: 'Advanced React patterns course is now live',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: <Star className="h-5 w-5 text-yellow-500" />
        },
        {
          id: 'update2',
          type: 'achievement',
          title: 'Community Milestone',
          description: '10,000 total milestones completed by our community!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          icon: <Trophy className="h-5 w-5 text-purple-500" />
        }
      ];
      
      setChallenges(mockChallenges);
      setCommunityUpdates(mockUpdates);
      setLoading(false);
    } catch (error) {
      console.error('Error loading social data:', error);
      setLoading(false);
    }
  };

  const joinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, isJoined: true, participants: challenge.participants + 1 }
        : challenge
    ));
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days remaining`;
    if (hours > 0) return `${hours} hours remaining`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Community
            </CardTitle>
            <div className="flex bg-gray-200 rounded-lg p-1">
              {[
                { id: 'challenges', label: 'Challenges', icon: Target },
                { id: 'community', label: 'Updates', icon: Users }
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

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {challenges.map(challenge => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-800">{challenge.title}</h3>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          challenge.type === 'weekly' ? 'text-blue-600' :
                          challenge.type === 'monthly' ? 'text-purple-600' :
                          'text-orange-600'
                        }`}
                      >
                        {challenge.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {challenge.participants} participants
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(challenge.endDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {challenge.isJoined ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => joinChallenge(challenge.id)}
                      >
                        Join Challenge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {challenge.isJoined && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Your Progress</span>
                        <span className="font-semibold">{challenge.progress}%</span>
                      </div>
                      <Progress value={challenge.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Gift className="h-3 w-3 text-purple-500" />
                        <span>Rewards: {challenge.rewards.badges.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          {communityUpdates.map(update => (
            <Card key={update.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {update.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{update.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(update.timestamp).toRelativeTimeString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Add this extension to Date prototype for relative time
declare global {
  interface Date {
    toRelativeTimeString(): string;
  }
}

Date.prototype.toRelativeTimeString = function() {
  const now = new Date();
  const diff = now.getTime() - this.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};