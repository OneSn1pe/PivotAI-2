import React, { useState } from "react";
import { CareerRoadmap } from "@/types/user";

interface RoadmapViewerProps {
  roadmap: CareerRoadmap;
  accessType: "owner" | "recruiter" | "none";
  candidateName?: string;
}

export default function RoadmapViewer({ 
  roadmap, 
  accessType,
  candidateName
}: RoadmapViewerProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  
  if (!roadmap) return null;
  
  const isOwner = accessType === "owner";
  const isRecruiter = accessType === "recruiter";

  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isRecruiter && candidateName 
              ? `${candidateName}'s Career Roadmap` 
              : "Your Career Roadmap"}
          </h1>
          <p className="text-gray-600">
            {isRecruiter 
              ? "View this candidate's career development plan" 
              : "Your personalized career development plan"}
          </p>
        </div>
        
        {isOwner && (
          <div>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => console.log("Edit roadmap")}
            >
              Edit Roadmap
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
        {roadmap.milestones && roadmap.milestones.map((milestone, index) => {
          const isExpanded = expandedMilestones[milestone.id || `milestone-${index}`] || false;
          
          return (
            <div 
              key={milestone.id || index} 
              className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                isExpanded ? 'md:col-span-2 lg:col-span-3 row-span-2' : ''
              }`}
              style={{
                transition: 'all 0.3s ease-in-out',
                transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                zIndex: isExpanded ? 10 : 1,
                boxShadow: isExpanded ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleExpand(milestone.id || `milestone-${index}`)}
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(milestone.id || `milestone-${index}`);
                  }
                }}
              >
                <div>
                  <h3 className="text-lg font-semibold">{milestone.title}</h3>
                  <p className="text-gray-600 text-sm">{milestone.timeframe}</p>
                </div>
                <div className="flex items-center">
                  {isOwner && (
                    <div className="flex items-center mr-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2 h-5 w-5"
                      />
                      <span className="text-sm text-gray-600">
                        {milestone.completed ? "Completed" : "Mark as complete"}
                      </span>
                    </div>
                  )}
                  {isRecruiter && milestone.completed && (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-4">
                      Completed
                    </div>
                  )}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Content - conditionally shown based on expanded state */}
              <div className={`mt-4 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'hidden opacity-0'}`}>
                <p className="text-gray-700">{milestone.description}</p>
                
                {milestone.skills && milestone.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {milestone.skills.map((skill, i) => (
                        <span 
                          key={i}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {milestone.resources && milestone.resources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Resources</h4>
                    <ul className="mt-3 space-y-4">
                      {milestone.resources.map((resource, i) => (
                        <li key={i} className="bg-gray-50 p-4 rounded border border-gray-100">
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:underline text-sm flex items-center font-medium"
                          >
                            <span className="mr-2">
                              {resource.type === 'article' && '📄'}
                              {resource.type === 'video' && '🎥'}
                              {resource.type === 'course' && '📚'}
                              {resource.type === 'book' && '📖'}
                              {resource.type === 'documentation' && '📋'}
                              {!['article', 'video', 'course', 'book', 'documentation'].includes(resource.type) && '🔗'}
                            </span>
                            {resource.title} <span className="text-gray-500 ml-1">({resource.type})</span>
                          </a>
                          
                          <div className="mt-2">
                            <h5 className="text-xs font-medium text-gray-700 mt-2 mb-1">How to use effectively:</h5>
                            {resource.usageGuide ? (
                              <p className="text-xs text-gray-600">{resource.usageGuide}</p>
                            ) : (
                              <>
                                {resource.type === 'article' && (
                                  <p className="text-xs text-gray-600">
                                    Read this article thoroughly and take notes on key points. Try to apply the concepts discussed to your current skill development. Consider creating a summary to reinforce your understanding.
                                  </p>
                                )}
                                {resource.type === 'video' && (
                                  <p className="text-xs text-gray-600">
                                    Watch the complete video, pausing to take notes on important concepts. Consider implementing what you learn in a small practice project to reinforce your understanding.
                                  </p>
                                )}
                                {resource.type === 'course' && (
                                  <p className="text-xs text-gray-600">
                                    Follow this course from start to finish, completing all exercises and projects. Set a consistent schedule and allocate dedicated time each week to make steady progress.
                                  </p>
                                )}
                                {resource.type === 'book' && (
                                  <p className="text-xs text-gray-600">
                                    Read thoroughly, taking notes on key concepts. Consider creating a study group to discuss chapters or implementing code examples as you progress through the material.
                                  </p>
                                )}
                                {resource.type === 'documentation' && (
                                  <p className="text-xs text-gray-600">
                                    Use as a reference while working on projects. Focus on sections most relevant to your current skills gap. Practice implementing examples to solidify your understanding.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Minimize button */}
                <div className="mt-6 text-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(milestone.id || `milestone-${index}`);
                    }}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50"
                    aria-label="Minimize milestone details"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1 rotate-180" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Minimize
                  </button>
                </div>
              </div>
              
              {/* Preview hint when collapsed */}
              {!isExpanded && milestone.description && (
                <div className="mt-3 mb-3">
                  <p className="text-gray-600 text-sm line-clamp-2">{milestone.description}</p>
                  <div className="mt-2 text-center">
                    <button 
                      onClick={() => toggleExpand(milestone.id || `milestone-${index}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                    >
                      Click to expand
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {isRecruiter && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800">Recruiter Notes</h3>
          <p className="text-gray-700 mt-2">
            This view shows you the candidate's career roadmap. You can see their
            milestones and skills they're developing, but cannot edit the roadmap.
          </p>
        </div>
      )}
    </div>
  );
} 