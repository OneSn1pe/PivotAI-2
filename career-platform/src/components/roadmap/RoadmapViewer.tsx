import React from "react";
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
  if (!roadmap) return null;
  
  const isOwner = accessType === "owner";
  const isRecruiter = accessType === "recruiter";
  
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
      
      <div className="space-y-8">
        {roadmap.milestones && roadmap.milestones.map((milestone, index) => (
          <div key={milestone.id || index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{milestone.title}</h3>
                <p className="text-gray-600 text-sm">{milestone.timeframe}</p>
              </div>
              {isOwner && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={() => console.log(`Toggle milestone ${milestone.id}`)}
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-sm text-gray-600">
                    {milestone.completed ? "Completed" : "Mark as complete"}
                  </span>
                </div>
              )}
              {isRecruiter && milestone.completed && (
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Completed
                </div>
              )}
            </div>
            
            <p className="mt-2">{milestone.description}</p>
            
            {milestone.skills && milestone.skills.length > 0 && (
              <div className="mt-3">
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
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700">Resources</h4>
                <ul className="mt-1 space-y-1">
                  {milestone.resources.map((resource, i) => (
                    <li key={i}>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {resource.title} ({resource.type})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
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