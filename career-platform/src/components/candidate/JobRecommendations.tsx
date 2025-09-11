'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile } from '@/types/user';
import { LinkedInJob, JobMatchingResult } from '@/services/linkedinJobsService';
import { Loading } from '@/components/ui/loading';
import { motion, AnimatePresence } from 'framer-motion';

interface JobRecommendationsProps {
  candidateProfile: CandidateProfile | null;
  className?: string;
}

export default function JobRecommendations({ candidateProfile, className = '' }: JobRecommendationsProps) {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<JobMatchingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<LinkedInJob | null>(null);
  const [compatibilityAnalysis, setCompatibilityAnalysis] = useState<any>(null);
  const [analyzingJob, setAnalyzingJob] = useState<string | null>(null);

  useEffect(() => {
    if (candidateProfile && currentUser) {
      fetchJobRecommendations();
    }
  }, [candidateProfile, currentUser]);

  const fetchJobRecommendations = async () => {
    if (!currentUser || !candidateProfile) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/recommendations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch job recommendations');
      }

      const data = await response.json();
      setRecommendations(data.data.recommendations || []);
      
      if (data.data.recommendations.length === 0) {
        setError('No job recommendations found. Try updating your profile or target roles.');
      }
    } catch (err) {
      console.error('Error fetching job recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const analyzeJobCompatibility = async (job: LinkedInJob) => {
    if (!currentUser || !candidateProfile) return;

    setAnalyzingJob(job.id);
    setSelectedJob(job);

    try {
      const userProfile = {
        skills: candidateProfile.resumeAnalysis?.skills || [],
        experience: candidateProfile.resumeAnalysis?.experience || [],
        targetRoles: candidateProfile.targetCompanies?.map(tc => tc.position) || [],
        targetCompanies: candidateProfile.targetCompanies?.map(tc => tc.name) || [],
        preferences: {
          remote: candidateProfile.jobPreferences?.remotePreference === 'remote',
          locations: candidateProfile.jobPreferences?.locations || [],
          salaryMin: candidateProfile.jobPreferences?.salaryExpectation,
        },
      };

      const response = await fetch('/api/jobs/compatibility', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobData: job,
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job compatibility');
      }

      const data = await response.json();
      setCompatibilityAnalysis(data.data);
    } catch (err) {
      console.error('Error analyzing job compatibility:', err);
      setError('Failed to analyze job compatibility');
    } finally {
      setAnalyzingJob(null);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatSalary = (salaryRange: LinkedInJob['salaryRange']) => {
    if (!salaryRange) return 'Not specified';
    return `$${salaryRange.min.toLocaleString()} - $${salaryRange.max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <Loading size="lg" />
          <p className="text-sm text-gray-600 mt-2">Finding job recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Job Recommendations Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">{error}</p>
              <button 
                onClick={fetchJobRecommendations}
                className="text-sm text-yellow-800 underline hover:text-yellow-900 mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Job Recommendations</h2>
          <p className="text-gray-600">Based on your profile and preferences</p>
        </div>
        <button
          onClick={fetchJobRecommendations}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v4h8v-4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Recommendations</h3>
          <p className="text-gray-600 mb-4">Complete your profile to get personalized job recommendations</p>
          <button
            onClick={() => window.location.href = '/protected/candidate/profile'}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((result, index) => (
            <motion.div
              key={result.job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{result.job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMatchScoreColor(result.matchScore)}`}>
                      {result.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">{result.job.company.name}</span> • {result.job.location}
                  </p>
                  <p className="text-sm text-gray-500">
                    {result.job.employmentType.replace('_', ' ')} • {result.job.experienceLevel.replace('_', ' ')}
                    {result.job.salaryRange && ` • ${formatSalary(result.job.salaryRange)}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => analyzeJobCompatibility(result.job)}
                    disabled={analyzingJob === result.job.id}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                  >
                    {analyzingJob === result.job.id ? 'Analyzing...' : 'Analyze Fit'}
                  </button>
                  <a
                    href={result.job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    Apply
                  </a>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Why this matches:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {result.matchReasons.map((reason, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {result.skillsMatch.matching.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Matching Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsMatch.matching.slice(0, 5).map(skill => (
                      <span key={skill} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.skillsMatch.missing.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Skills to Develop:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.skillsMatch.missing.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                Posted: {new Date(result.job.postedDate).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Job Compatibility Analysis Modal */}
      <AnimatePresence>
        {selectedJob && compatibilityAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setSelectedJob(null);
              setCompatibilityAnalysis(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Job Compatibility Analysis</h3>
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setCompatibilityAnalysis(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedJob.title}</h4>
                  <p className="text-gray-600">{selectedJob.company.name} • {selectedJob.location}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMatchScoreColor(compatibilityAnalysis.overallScore).split(' ')[0]}`}>
                      {compatibilityAnalysis.overallScore}%
                    </div>
                    <div className="text-sm text-gray-500">Compatibility</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {compatibilityAnalysis.aiAnalysis.timeToReadiness}
                    </div>
                    <div className="text-sm text-gray-500">Time to Readiness</div>
                  </div>
                </div>

                {compatibilityAnalysis.aiAnalysis.strengths.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Your Strengths</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {compatibilityAnalysis.aiAnalysis.strengths.map((strength: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {compatibilityAnalysis.aiAnalysis.concerns.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {compatibilityAnalysis.aiAnalysis.concerns.map((concern: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {compatibilityAnalysis.aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Recommendations</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {compatibilityAnalysis.aiAnalysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setCompatibilityAnalysis(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  <a
                    href={selectedJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}