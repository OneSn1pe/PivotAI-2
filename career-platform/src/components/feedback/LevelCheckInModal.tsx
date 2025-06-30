'use client';

import React, { useState } from 'react';
import { X, Star, ChevronRight, MessageSquare, Target, Clock, Brain } from 'lucide-react';
import { LevelFeedback, ProfessionalField } from '@/types/user';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelCheckInModalProps {
  isOpen: boolean;
  level: number;
  professionalField: ProfessionalField;
  onClose: () => void;
  onSubmit: (feedback: Omit<LevelFeedback, 'id' | 'userId' | 'createdAt'>) => void;
}

export default function LevelCheckInModal({
  isOpen,
  level,
  professionalField,
  onClose,
  onSubmit
}: LevelCheckInModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<Partial<Omit<LevelFeedback, 'id' | 'userId' | 'createdAt'>>>({
    level,
    professionalField,
    completedAt: new Date(),
    overallSatisfaction: undefined,
    contentRelevance: undefined,
    difficultyLevel: undefined,
    timeInvestment: undefined,
    mostValuable: '',
    improvements: '',
    additionalComments: '',
    skillsImproved: [],
    confidenceLevel: undefined,
    readyForNext: true,
    favoriteActivities: [],
    challengingAreas: [],
    openToFollowUp: false
  });

  const steps = [
    { title: 'Overall Experience', icon: Star },
    { title: 'Content & Difficulty', icon: Target },
    { title: 'Time & Progress', icon: Clock },
    { title: 'Skills & Learning', icon: Brain },
    { title: 'Additional Feedback', icon: MessageSquare }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(feedback as Omit<LevelFeedback, 'id' | 'userId' | 'createdAt'>);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Overall Experience
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How satisfied are you with Level {level}?
              </h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedback({ ...feedback, overallSatisfaction: rating as 1 | 2 | 3 | 4 | 5 })}
                    className={`p-3 rounded-lg transition-all ${
                      feedback.overallSatisfaction === rating
                        ? 'bg-blue-500 text-white scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${feedback.overallSatisfaction && feedback.overallSatisfaction >= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How relevant was the content to your career goals?
              </h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedback({ ...feedback, contentRelevance: rating as 1 | 2 | 3 | 4 | 5 })}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      feedback.contentRelevance === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Not relevant</span>
                <span>Very relevant</span>
              </div>
            </div>
          </div>
        );

      case 1: // Content & Difficulty
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How would you rate the difficulty of this level?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'too-easy', label: 'Too Easy', description: 'I could have handled more challenging content' },
                  { value: 'just-right', label: 'Just Right', description: 'The difficulty was appropriate for my skill level' },
                  { value: 'too-hard', label: 'Too Hard', description: 'I struggled with many of the concepts' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFeedback({ ...feedback, difficultyLevel: option.value as 'too-easy' | 'just-right' | 'too-hard' })}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      feedback.difficultyLevel === option.value
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Time & Progress
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How was the time investment for this level?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'too-little', label: 'Too Little', description: 'I finished much faster than expected' },
                  { value: 'appropriate', label: 'Appropriate', description: 'The time commitment was reasonable' },
                  { value: 'too-much', label: 'Too Much', description: 'It took longer than I anticipated' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFeedback({ ...feedback, timeInvestment: option.value as 'too-little' | 'appropriate' | 'too-much' })}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      feedback.timeInvestment === option.value
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Do you feel ready for the next level?
              </h3>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => setFeedback({ ...feedback, readyForNext: true })}
                  className={`px-8 py-3 rounded-lg transition-all ${
                    feedback.readyForNext === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Yes, I'm ready!
                </button>
                <button
                  onClick={() => setFeedback({ ...feedback, readyForNext: false })}
                  className={`px-8 py-3 rounded-lg transition-all ${
                    feedback.readyForNext === false
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Not quite yet
                </button>
              </div>
            </div>
          </div>
        );

      case 3: // Skills & Learning
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How confident do you feel with the material from this level?
              </h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedback({ ...feedback, confidenceLevel: rating as 1 | 2 | 3 | 4 | 5 })}
                    className={`px-6 py-3 rounded-lg transition-all ${
                      feedback.confidenceLevel === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Not confident</span>
                <span>Very confident</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What was most valuable about this level?
              </label>
              <textarea
                value={feedback.mostValuable}
                onChange={(e) => setFeedback({ ...feedback, mostValuable: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Share what you found most helpful..."
              />
            </div>
          </div>
        );

      case 4: // Additional Feedback
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What could be improved about this level?
              </label>
              <textarea
                value={feedback.improvements}
                onChange={(e) => setFeedback({ ...feedback, improvements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any suggestions for improvement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any additional comments? (Optional)
              </label>
              <textarea
                value={feedback.additionalComments}
                onChange={(e) => setFeedback({ ...feedback, additionalComments: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Anything else you'd like to share..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="followUp"
                checked={feedback.openToFollowUp}
                onChange={(e) => setFeedback({ ...feedback, openToFollowUp: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="followUp" className="ml-2 block text-sm text-gray-900">
                I'm open to being contacted for more detailed feedback
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return feedback.overallSatisfaction && feedback.contentRelevance;
      case 1:
        return feedback.difficultyLevel;
      case 2:
        return feedback.timeInvestment && feedback.readyForNext !== undefined;
      case 3:
        return feedback.confidenceLevel && feedback.mostValuable;
      case 4:
        return feedback.improvements;
      default:
        return true;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Level {level} Check-in</h2>
                  <p className="text-blue-100 mt-1">Help us improve your learning experience</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        index <= currentStep
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-6" style={{ minHeight: '300px' }}>
              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back
              </button>

              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  canProceed()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{currentStep === steps.length - 1 ? 'Submit' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}