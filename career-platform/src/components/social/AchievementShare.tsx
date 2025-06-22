'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Copy, 
  Check, 
  Twitter, 
  Linkedin, 
  Facebook,
  Download,
  Link,
  Trophy,
  Star,
  Sparkles
} from 'lucide-react';
import { Achievement, UserProgress } from '@/types/user';

interface AchievementShareProps {
  achievement: Achievement;
  userProgress: UserProgress;
  isVisible: boolean;
  onClose: () => void;
}

export function AchievementShare({ 
  achievement, 
  userProgress, 
  isVisible, 
  onClose 
}: AchievementShareProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const currentLevel = userProgress.levelsUnlocked || 1;
  const shareData = {
    title: `I just earned the "${achievement.title}" achievement on PivotAI Career Quest!`,
    text: `${achievement.description} - Level ${currentLevel}`,
    url: `${typeof window !== 'undefined' ? window.location.origin : ''}/achievements/${achievement.id}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        setSharing(true);
        await navigator.share(shareData);
      } catch (error) {
        console.log('Sharing cancelled or failed');
      } finally {
        setSharing(false);
      }
    } else {
      // Fallback to clipboard
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard');
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const generateShareableImage = () => {
    // This would generate a shareable image of the achievement
    // For now, we'll just create a simple card design
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 400;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    // Achievement content
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.title, 400, 150);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Level ${userProgress.levelsUnlocked} Achievement`, 400, 200);
    
    ctx.font = '20px Arial';
    ctx.fillText(achievement.description, 400, 250);
    
    ctx.font = '18px Arial';
    ctx.fillText('PivotAI Career Quest', 400, 350);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `achievement-${achievement.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
              <div className="text-6xl mb-4">{achievement.icon}</div>
              <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
              <Badge className="bg-white/20 text-white">
                Level {userProgress.levelsUnlocked} Achievement
              </Badge>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-center">{achievement.description}</p>
              
              {/* Achievement Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <div className="font-semibold text-yellow-700">Level {userProgress.levelsUnlocked}</div>
                  <div className="text-xs text-yellow-600">Current Level</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Star className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="font-semibold text-blue-700">{userProgress.completedMilestones.length}</div>
                  <div className="text-xs text-blue-600">Milestones Completed</div>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-center">Share Your Achievement</h4>
                
                {/* Quick Share */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleNativeShare}
                    disabled={sharing}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Share2 className="h-4 w-4" />
                    {sharing ? 'Sharing...' : 'Quick Share'}
                  </Button>
                  
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                {/* Social Platforms */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 text-center">Share on social media</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleSocialShare('twitter')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Twitter className="h-4 w-4 text-blue-400" />
                      Twitter
                    </Button>
                    
                    <Button
                      onClick={() => handleSocialShare('linkedin')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </Button>
                    
                    <Button
                      onClick={() => handleSocialShare('facebook')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Facebook className="h-4 w-4 text-blue-700" />
                      Facebook
                    </Button>
                  </div>
                </div>

                {/* Download Image */}
                <Button
                  onClick={generateShareableImage}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Achievement Image
                </Button>
              </div>

              {/* Close Button */}
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quick Share Button Component
interface QuickShareButtonProps {
  achievement: Achievement;
  userProgress: UserProgress;
  className?: string;
}

export function QuickShareButton({ 
  achievement, 
  userProgress, 
  className = '' 
}: QuickShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowShareModal(true)}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <AchievementShare
        achievement={achievement}
        userProgress={userProgress}
        isVisible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}

// Achievement Card with Share Integration
interface ShareableAchievementCardProps {
  achievement: Achievement;
  userProgress: UserProgress;
  size?: 'sm' | 'md' | 'lg';
}

export function ShareableAchievementCard({ 
  achievement, 
  userProgress, 
  size = 'md' 
}: ShareableAchievementCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const isUnlocked = !!achievement.unlockedAt;

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  if (!isUnlocked) return null;

  return (
    <>
      <motion.div
        className={`relative bg-white rounded-lg border shadow-md hover:shadow-lg transition-all cursor-pointer ${sizeClasses[size]}`}
        onClick={() => setShowShareModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Achievement Icon */}
        <div className={`${iconSizes[size]} text-center mb-2`}>
          {achievement.icon}
        </div>

        {/* Achievement Info */}
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {achievement.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {achievement.description}
          </p>
          
          {/* Share Indicator */}
          <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
            <Share2 className="h-3 w-3" />
            <span>Click to share</span>
          </div>
        </div>

        {/* Sparkle Effect */}
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </div>
      </motion.div>

      <AchievementShare
        achievement={achievement}
        userProgress={userProgress}
        isVisible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}