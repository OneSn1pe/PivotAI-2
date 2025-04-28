import React, { useState } from 'react';
import { CareerRoadmap as RoadmapType, Milestone } from '@/types/user';

interface CareerRoadmapProps {
  roadmap: RoadmapType;
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => Promise<void>;
  onSubtaskToggle?: (milestoneId: string, subtaskId: string, completed: boolean) => Promise<void>;
  isEditable?: boolean;
  userSkills?: string[];
}

const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ 
  roadmap, 
  onMilestoneToggle,
  onSubtaskToggle,
  isEditable = false,
  userSkills = []
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [localToggling, setLocalToggling] = useState<Record<string, boolean>>({});
  const [subtaskToggling, setSubtaskToggling] = useState<Record<string, boolean>>({});

  // Toggle milestone expansion to show/hide details
  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // Toggle milestone completion status
  const toggleComplete = async (milestone: Milestone) => {
    if (!onMilestoneToggle || !isEditable) return;
    setLoading(prev => ({ ...prev, [milestone.id]: true }));
    try {
      await onMilestoneToggle(milestone.id, !milestone.completed);
    } catch (error) {
      console.error('Failed to update milestone:', error);
    } finally {
      setLoading(prev => ({ ...prev, [milestone.id]: false }));
    }
  };

  // Toggle subtask completion
  const toggleSubtask = async (milestone: Milestone, subtaskId: string, completed: boolean) => {
    if (!onSubtaskToggle || !isEditable) return;
    setSubtaskToggling(prev => ({ ...prev, [subtaskId]: true }));
    try {
      await onSubtaskToggle(milestone.id, subtaskId, completed);
    } catch (error) {
      console.error('Failed to update subtask:', error);
    } finally {
      setSubtaskToggling(prev => ({ ...prev, [subtaskId]: false }));
    }
  };

  // Sort milestones by timeframe if possible
  const sortedMilestones = [...roadmap.milestones].sort((a, b) => {
    const aMonths = parseInt(a.timeframe.match(/(\d+)/)?.[1] || '0');
    const bMonths = parseInt(b.timeframe.match(/(\d+)/)?.[1] || '0');
    if (aMonths && bMonths) {
      return aMonths - bMonths;
    }
    return a.timeframe.localeCompare(b.timeframe);
  });

  // Helper: Skill gap for a milestone
  const getSkillGap = (milestone: Milestone) => {
    if (!milestone.requiredSkills) return [];
    return milestone.requiredSkills.filter(skill => !userSkills.includes(skill));
  };

  // Helper: Subtask progress
  const getSubtaskProgress = (milestone: Milestone) => {
    if (!milestone.subtasks || milestone.subtasks.length === 0) return 0;
    const completed = milestone.subtasks.filter(st => st.completed).length;
    return Math.round((completed / milestone.subtasks.length) * 100);
  };

  // Helper: Overdue
  const isOverdue = (milestone: Milestone) => {
    if (!milestone.targetDate || milestone.completed) return false;
    const today = new Date().toISOString().slice(0, 10);
    return milestone.targetDate < today;
  };

  return (
    <div className="w-full px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Career Roadmap</h2>
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No milestones found in your roadmap.</p>
          <p className="text-sm text-gray-400 mt-2">Generate a roadmap based on your resume and target companies.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200 z-0"></div>
          {/* Milestones */}
          <div className="relative z-10">
            {sortedMilestones.map((milestone, index) => {
              const skillGap = getSkillGap(milestone);
              const subtaskProgress = getSubtaskProgress(milestone);
              const overdue = isOverdue(milestone);
              return (
                <div key={milestone.id} className={`flex flex-col md:flex-row mb-10 items-center`}>
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full shadow ${
                      milestone.completed ? 'bg-green-500' : overdue ? 'bg-red-500' : 'bg-blue-500'
                    } z-10`}></div>
                  </div>
                  {/* Content container with alternating sides */}
                  <div className={`flex ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} w-full items-center`}>
                    <div className="hidden md:block md:w-1/2"></div>
                    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                        <span className="text-sm text-gray-500">{milestone.timeframe}</span>
                      </div>
                      <p className="text-gray-700 mb-4">{milestone.description}</p>
                      {/* Company tags */}
                      {milestone.companyTags && milestone.companyTags.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {milestone.companyTags.map((tag, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                      {/* Target date and overdue */}
                      {milestone.targetDate && (
                        <div className="mb-2 text-sm">
                          <span className="font-semibold">Target Date:</span> {milestone.targetDate}
                          {overdue && !milestone.completed && (
                            <span className="ml-2 text-red-600 font-semibold">Overdue!</span>
                          )}
                        </div>
                      )}
                      {/* Subtasks and progress */}
                      {milestone.subtasks && milestone.subtasks.length > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold text-sm text-gray-600">Subtasks</h4>
                            <span className="text-xs text-gray-500">{subtaskProgress}% complete</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${subtaskProgress}%` }}
                            ></div>
                          </div>
                          <ul className="space-y-1">
                            {milestone.subtasks.map(subtask => (
                              <li key={subtask.id} className="flex items-center">
                                {isEditable ? (
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    disabled={subtaskToggling[subtask.id]}
                                    onChange={() => toggleSubtask(milestone, subtask.id, !subtask.completed)}
                                    className="mr-2"
                                  />
                                ) : (
                                  <span className="inline-block w-4 h-4 mr-2 rounded border border-gray-300 bg-gray-100">
                                    {subtask.completed && <span className="block w-full h-full bg-green-400 rounded"></span>}
                                  </span>
                                )}
                                <span className={subtask.completed ? 'line-through text-gray-400' : ''}>{subtask.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Skills needed for milestone */}
                      {milestone.requiredSkills && milestone.requiredSkills.length > 0 ? (
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm text-gray-600 mb-2">Required Skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {milestone.requiredSkills.map((skill, skillIndex) => (
                              <span key={skillIndex} className={`px-2 py-1 rounded text-xs ${userSkills.includes(skill) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                          {skillGap.length > 0 && (
                            <div className="mt-2 text-xs text-yellow-700">
                              <span className="font-semibold">Skill gap:</span> {skillGap.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm text-gray-600 mb-2">Required Skills:</h4>
                          <p className="text-xs text-gray-500 italic">No specific required skills listed for this milestone.</p>
                        </div>
                      )}
                      {/* Completion checkbox that triggers parent handler */}
                      {isEditable && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`milestone-${milestone.id}`}
                            checked={milestone.completed}
                            onChange={(e) => {
                              if (onMilestoneToggle) {
                                const checked = e.target.checked;
                                setLocalToggling((prev) => ({ 
                                  ...prev, 
                                  [milestone.id]: true 
                                }));
                                onMilestoneToggle(milestone.id, checked)
                                  .then(() => {
                                    setLocalToggling((prev) => ({ 
                                      ...prev, 
                                      [milestone.id]: false 
                                    }));
                                  })
                                  .catch((err) => {
                                    console.error('Error toggling milestone:', err);
                                    setLocalToggling((prev) => ({ 
                                      ...prev, 
                                      [milestone.id]: false 
                                    }));
                                  });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            disabled={localToggling[milestone.id]}
                          />
                          <label
                            htmlFor={`milestone-${milestone.id}`}
                            className={`ml-2 text-sm font-medium ${
                              milestone.completed ? 'text-green-600' : 'text-gray-700'
                            }`}
                          >
                            {milestone.completed ? 'Completed' : 'Mark as complete'}
                            {localToggling[milestone.id] && (
                              <span className="ml-2 inline-block animate-pulse">
                                Updating...
                              </span>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap; 