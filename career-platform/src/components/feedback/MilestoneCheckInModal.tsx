'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle, AlertCircle, Clock, Target, Sparkles } from 'lucide-react';
import { MilestoneCheckInModalState, MilestoneCheckIn, Milestone } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MilestoneCheckInModalProps extends MilestoneCheckInModalState {
  milestone: Milestone;
}

export function MilestoneCheckInModal({ 
  isOpen, 
  milestone, 
  onClose, 
  onSubmit 
}: MilestoneCheckInModalProps) {
  // Form state
  const [resourcesHelpful, setResourcesHelpful] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [resourcesUsed, setResourcesUsed] = useState<string[]>([]);
  const [favoriteResource, setFavoriteResource] = useState('');
  const [missingResources, setMissingResources] = useState('');
  
  const [objectiveClear, setObjectiveClear] = useState(true);
  const [objectiveAchieved, setObjectiveAchieved] = useState(true);
  const [timeToComplete, setTimeToComplete] = useState<'less-than-expected' | 'as-expected' | 'more-than-expected'>('as-expected');
  const [actualHours, setActualHours] = useState<number | undefined>(undefined);
  
  const [skillsGained, setSkillsGained] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [applicability, setApplicability] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  const [challenges, setChallenges] = useState('');
  const [breakthroughs, setBreakthroughs] = useState('');
  
  const [readyForNext, setReadyForNext] = useState(true);
  const [additionalPracticeNeeded, setAdditionalPracticeNeeded] = useState<string[]>([]);
  
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [additionalComments, setAdditionalComments] = useState('');
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleResourceToggle = (resourceTitle: string) => {
    setResourcesUsed(prev => 
      prev.includes(resourceTitle)
        ? prev.filter(r => r !== resourceTitle)
        : [...prev, resourceTitle]
    );
  };

  const handleSkillToggle = (skill: string) => {
    setSkillsGained(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = () => {
    const checkIn: Omit<MilestoneCheckIn, 'id' | 'userId' | 'createdAt'> = {
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      completedAt: new Date(),
      resourcesHelpful,
      resourcesUsed,
      favoriteResource: favoriteResource.trim() || undefined,
      missingResources: missingResources.trim() || undefined,
      objectiveClear,
      objectiveAchieved,
      timeToComplete,
      actualHours,
      skillsGained,
      confidenceLevel,
      applicability,
      challenges: challenges.trim() || undefined,
      breakthroughs: breakthroughs.trim() || undefined,
      readyForNext,
      additionalPracticeNeeded: additionalPracticeNeeded.length > 0 ? additionalPracticeNeeded : undefined,
      wouldRecommend,
      additionalComments: additionalComments.trim() || undefined,
    };
    
    onSubmit(checkIn);
    onClose();
  };

  const renderStarRating = (
    value: 1 | 2 | 3 | 4 | 5,
    onChange: (value: 1 | 2 | 3 | 4 | 5) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star as 1 | 2 | 3 | 4 | 5)}
            className="transition-all hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Feedback</h3>
              <p className="text-sm text-gray-600">How helpful were the resources provided?</p>
            </div>

            {renderStarRating(resourcesHelpful, setResourcesHelpful, "How helpful were the resources?")}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Which resources did you use?
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {milestone.resources.map((resource, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={resourcesUsed.includes(resource.title)}
                      onChange={() => handleResourceToggle(resource.title)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{resource.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Which resource was most helpful? (Optional)
              </label>
              <input
                type="text"
                value={favoriteResource}
                onChange={(e) => setFavoriteResource(e.target.value)}
                placeholder="Enter resource name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                What additional resources would have helped? (Optional)
              </label>
              <textarea
                value={missingResources}
                onChange={(e) => setMissingResources(e.target.value)}
                placeholder="E.g., video tutorials, practice exercises, etc."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective Achievement</h3>
              <p className="text-sm text-gray-600">Did you achieve the milestone objectives?</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={objectiveClear}
                  onChange={(e) => setObjectiveClear(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">The objective was clear</span>
                  <p className="text-xs text-gray-500">I understood what I needed to accomplish</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={objectiveAchieved}
                  onChange={(e) => setObjectiveAchieved(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">I achieved the objective</span>
                  <p className="text-xs text-gray-500">I completed what was expected</p>
                </div>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time to complete
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['less-than-expected', 'as-expected', 'more-than-expected'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTimeToComplete(option)}
                    className={`p-3 text-xs font-medium rounded-lg border transition-all ${
                      timeToComplete === option
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option === 'less-than-expected' && 'Less than expected'}
                    {option === 'as-expected' && 'As expected'}
                    {option === 'more-than-expected' && 'More than expected'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Actual hours spent (Optional)
              </label>
              <input
                type="number"
                value={actualHours || ''}
                onChange={(e) => setActualHours(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Enter hours"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Outcomes</h3>
              <p className="text-sm text-gray-600">What did you gain from this milestone?</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Skills gained (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {milestone.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      skillsGained.includes(skill)
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {renderStarRating(confidenceLevel, setConfidenceLevel, "How confident do you feel with the material?")}
            {renderStarRating(applicability, setApplicability, "How applicable is this to your career goals?")}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Challenges faced (Optional)
              </label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="What was difficult about this milestone?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Breakthroughs or aha moments (Optional)
              </label>
              <textarea
                value={breakthroughs}
                onChange={(e) => setBreakthroughs(e.target.value)}
                placeholder="Any key insights or breakthroughs?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Steps</h3>
              <p className="text-sm text-gray-600">Almost done! Just a few more questions.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={readyForNext}
                  onChange={(e) => setReadyForNext(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">I'm ready for the next milestone</span>
                  <p className="text-xs text-gray-500">I feel prepared to move forward</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">I would recommend this milestone</span>
                  <p className="text-xs text-gray-500">This was valuable for my career development</p>
                </div>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional comments (Optional)
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Any other feedback you'd like to share?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h4 className="text-sm font-medium text-gray-900">Thank you for your feedback!</h4>
              </div>
              <p className="text-xs text-gray-600">
                Your input helps us improve the learning experience for everyone. 
                Your responses will be used to enhance future milestones and resources.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-gray-900" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Milestone Check-in</h2>
                      <p className="text-xs text-gray-500">{milestone.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 flex items-center gap-2">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        index < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {renderStep()}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </span>

                {currentStep < totalSteps ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Submit Feedback
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}