import React, { useState, useEffect } from 'react';
import { CareerRoadmap as RoadmapType, Milestone, MilestoneCategory, categorizeMilestone, migrateLegacyMilestone } from '@/types/user';
import { safeTimestampToDate } from '@/utils/firebaseUtils';

interface CategorizedCareerRoadmapProps {
  roadmap: RoadmapType;
  onMilestoneToggle?: (milestoneId: string, completed: boolean) => Promise<void>;
  isEditable?: boolean;
}

const CategorizedCareerRoadmap: React.FC<CategorizedCareerRoadmapProps> = ({ 
  roadmap, 
  onMilestoneToggle,
  isEditable = false
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'all'>('all');
  const [localToggling, setLocalToggling] = useState<Record<string, boolean>>({});
  const [sanitizedRoadmap, setSanitizedRoadmap] = useState<RoadmapType | null>(null);

  // Category configurations
  const categoryConfig = {
    technical: {
      name: 'Technical',
      icon: '💻',
      color: 'teal',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-800',
      description: 'Programming, frameworks, and technical implementations'
    },
    fundamental: {
      name: 'Fundamental',
      icon: '🏗️',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      description: 'Core concepts, architecture, and problem-solving skills'
    },
    niche: {
      name: 'Niche',
      icon: '🚀',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      description: 'Specialized technologies and emerging domains'
    },
    soft: {
      name: 'Soft Skills',
      icon: '🤝',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      description: 'Communication, leadership, and interpersonal skills'
    }
  };

  // Sanitize and migrate roadmap data
  useEffect(() => {
    if (!roadmap) return;

    try {
      const sanitized: RoadmapType = {
        ...roadmap,
        id: roadmap.id || `roadmap-${Math.random().toString(36).substring(2, 9)}`,
        candidateId: roadmap.candidateId || '',
        createdAt: safeTimestampToDate(roadmap.createdAt) || new Date(),
        updatedAt: safeTimestampToDate(roadmap.updatedAt) || new Date(),
        milestones: []
      };

      if (Array.isArray(roadmap.milestones)) {
        sanitized.milestones = roadmap.milestones.map((milestone, index) => {
          const id = milestone.id || `milestone-${Math.random().toString(36).substring(2, 9)}`;
          let processedMilestone: Milestone;

          // Check if milestone has new categorization or needs migration
          if ('category' in milestone && milestone.category) {
            // Already has new format
            processedMilestone = {
              ...milestone,
              id,
              createdAt: safeTimestampToDate(milestone.createdAt) || new Date(),
              title: milestone.title || 'Untitled Milestone',
              description: milestone.description || 'No description provided',
              timeframe: milestone.timeframe || 'No timeframe specified',
              completed: !!milestone.completed,
              skills: Array.isArray(milestone.skills) ? milestone.skills : [],
              resources: Array.isArray(milestone.resources) ? milestone.resources : [],
              difficulty: milestone.difficulty || 3,
              priority: milestone.priority || 'medium',
              attributes: milestone.attributes || {},
              successCriteria: milestone.successCriteria || ['Complete all learning resources']
            } as Milestone;
          } else {
            // Legacy format - migrate
            const legacyMilestone = {
              ...milestone,
              id,
              title: milestone.title || 'Untitled Milestone',
              description: milestone.description || 'No description provided',
              timeframe: milestone.timeframe || 'No timeframe specified',
              completed: !!milestone.completed,
              skills: Array.isArray(milestone.skills) ? milestone.skills : [],
              resources: Array.isArray(milestone.resources) ? milestone.resources : [],
              skillType: (milestone as any).skillType || 'technical',
              createdAt: safeTimestampToDate(milestone.createdAt) || new Date()
            };

            processedMilestone = migrateLegacyMilestone(legacyMilestone);
          }

          return processedMilestone;
        });
      }

      setSanitizedRoadmap(sanitized);
    } catch (error) {
      console.error('[CATEGORIZED-ROADMAP] Error processing roadmap:', error);
    }
  }, [roadmap]);

  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // Group milestones by category
  const categorizedMilestones = React.useMemo(() => {
    if (!sanitizedRoadmap?.milestones) {
      return {
        technical: [],
        fundamental: [],
        niche: [],
        soft: []
      } as Record<MilestoneCategory, Milestone[]>;
    }

    const grouped: Record<MilestoneCategory, Milestone[]> = {
      technical: [],
      fundamental: [],
      niche: [],
      soft: []
    };

    sanitizedRoadmap.milestones.forEach(milestone => {
      const category = milestone.category || categorizeMilestone(milestone);
      grouped[category].push(milestone);
    });

    return grouped;
  }, [sanitizedRoadmap]);

  // Get filtered milestones based on selected category
  const getFilteredMilestones = () => {
    if (selectedCategory === 'all') {
      return sanitizedRoadmap?.milestones || [];
    }
    return categorizedMilestones[selectedCategory] || [];
  };

  // Get category stats
  const getCategoryStats = () => {
    const stats: Record<MilestoneCategory, { total: number; completed: number }> = {
      technical: { total: 0, completed: 0 },
      fundamental: { total: 0, completed: 0 },
      niche: { total: 0, completed: 0 },
      soft: { total: 0, completed: 0 }
    };

    Object.entries(categorizedMilestones).forEach(([category, milestones]) => {
      stats[category as MilestoneCategory] = {
        total: milestones.length,
        completed: milestones.filter((m: Milestone) => m.completed).length
      };
    });

    return stats;
  };

  const renderMilestoneCard = (milestone: Milestone, index: number) => {
    const isExpanded = expandedMilestones[milestone.id] || false;
    const category = milestone.category || categorizeMilestone(milestone);
    const config = categoryConfig[category];

    return (
      <div 
        key={milestone.id} 
        className={`bg-white rounded-lg shadow-card border-2 ${config.borderColor} transition-all duration-300 hover:shadow-card-hover ${
          isExpanded ? 'col-span-full' : ''
        }`}
      >
        {/* Category indicator bar */}
        <div className={`h-1 w-full ${config.bgColor} rounded-t-lg`}></div>
        
        <div className="p-4">
          {/* Header */}
          <div 
            className="flex justify-between items-start mb-3 cursor-pointer"
            onClick={() => toggleExpand(milestone.id)}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{config.icon}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.textColor} font-medium`}>
                  {config.name}
                </span>
                <span className="text-xs text-slate-500">
                  Difficulty: {'★'.repeat(milestone.difficulty || 3)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  milestone.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  milestone.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  milestone.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {milestone.priority || 'medium'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 font-inter">{milestone.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{milestone.timeframe}</p>
              {milestone.estimatedHours && (
                <p className="text-xs text-slate-500">Est. {milestone.estimatedHours}h</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {milestone.completed && (
                <span className="text-emerald-600 text-xl">✓</span>
              )}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              {/* Description */}
              <p className="text-slate-700">{milestone.description}</p>

              {/* Skills */}
              {milestone.skills && milestone.skills.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Skills to develop:</h4>
                  <div className="flex flex-wrap gap-1">
                    {milestone.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Criteria */}
              {milestone.successCriteria && milestone.successCriteria.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Success Criteria:</h4>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {milestone.successCriteria.map((criteria, idx) => (
                      <li key={idx}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tasks */}
              {milestone.tasks && milestone.tasks.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Tasks:</h4>
                  <div className="space-y-2">
                    {milestone.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={task.completed} 
                          readOnly
                          className="h-4 w-4 text-teal-600 rounded"
                        />
                        <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {milestone.resources && milestone.resources.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Learning Resources:</h4>
                  <div className="space-y-2">
                    {milestone.resources.map((resource, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:text-teal-800 font-medium text-sm"
                          >
                            {resource.title}
                          </a>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 capitalize">{resource.type}</span>
                            {resource.estimatedTime && (
                              <span className="text-xs text-slate-500">• {resource.estimatedTime}</span>
                            )}
                            {resource.cost && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                resource.cost === 'free' ? 'bg-green-100 text-green-800' :
                                resource.cost === 'paid' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {resource.cost}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category-specific attributes */}
              {milestone.attributes && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 mb-2">Additional Details:</h4>
                  <div className="bg-slate-50 p-3 rounded text-xs">
                    {milestone.attributes.technical && (
                      <div className="space-y-1">
                        <p><strong>Technologies:</strong> {milestone.attributes.technical.technologies.join(', ')}</p>
                        <p><strong>Project Type:</strong> {milestone.attributes.technical.projectType}</p>
                        <p><strong>Complexity:</strong> {milestone.attributes.technical.complexityLevel}</p>
                      </div>
                    )}
                    {milestone.attributes.niche && (
                      <div className="space-y-1">
                        <p><strong>Domain:</strong> {milestone.attributes.niche.specializationDomain}</p>
                        <p><strong>Market Demand:</strong> {milestone.attributes.niche.marketDemand}</p>
                        <p><strong>Career Impact:</strong> {milestone.attributes.niche.careerImpact}</p>
                      </div>
                    )}
                    {milestone.attributes.soft && (
                      <div className="space-y-1">
                        <p><strong>Skill Category:</strong> {milestone.attributes.soft.skillCategory}</p>
                        <p><strong>Development Method:</strong> {milestone.attributes.soft.developmentMethod}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Completion toggle */}
              {isEditable && onMilestoneToggle && (
                <div className="flex items-center pt-2 border-t">
                  <input
                    type="checkbox"
                    id={`milestone-${milestone.id}`}
                    checked={milestone.completed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setLocalToggling(prev => ({ ...prev, [milestone.id]: true }));
                      
                      onMilestoneToggle(milestone.id, checked)
                        .then(() => {
                          setLocalToggling(prev => ({ ...prev, [milestone.id]: false }));
                        })
                        .catch((err) => {
                          console.error('Error toggling milestone:', err);
                          setLocalToggling(prev => ({ ...prev, [milestone.id]: false }));
                        });
                    }}
                    className="mr-3 h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <label htmlFor={`milestone-${milestone.id}`} className="text-sm text-slate-700">
                    {milestone.completed ? 'Completed' : 'Mark as completed'}
                  </label>
                  {localToggling[milestone.id] && (
                    <span className="ml-2 text-xs text-slate-500">Updating...</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const stats = getCategoryStats();
  const filteredMilestones = getFilteredMilestones();

  if (!sanitizedRoadmap) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 font-inter">Career Development Roadmap</h2>
        <p className="text-slate-600 mt-2">Your personalized journey organized by skill categories</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-slate-800 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All ({sanitizedRoadmap.milestones.length})
        </button>
        {Object.entries(categoryConfig).map(([category, config]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as MilestoneCategory)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === category
                ? `${config.bgColor} ${config.textColor} border-2 ${config.borderColor}`
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{config.icon}</span>
            <span>{config.name}</span>
            <span className="bg-white px-2 py-0.5 rounded-full text-xs">
              {stats[category as MilestoneCategory].completed}/{stats[category as MilestoneCategory].total}
            </span>
          </button>
        ))}
      </div>

      {/* Category description */}
      {selectedCategory !== 'all' && (
        <div className={`p-4 rounded-lg ${categoryConfig[selectedCategory].bgColor} ${categoryConfig[selectedCategory].borderColor} border`}>
          <p className={`text-sm ${categoryConfig[selectedCategory].textColor}`}>
            {categoryConfig[selectedCategory].description}
          </p>
        </div>
      )}

      {/* Milestones grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMilestones.map((milestone: Milestone, index: number) => 
          renderMilestoneCard(milestone, index)
        )}
      </div>

      {filteredMilestones.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No milestones found</h3>
          <p className="text-slate-500">
            {selectedCategory === 'all' 
              ? 'No milestones have been created yet.' 
              : `No ${categoryConfig[selectedCategory as MilestoneCategory]?.name.toLowerCase()} milestones found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorizedCareerRoadmap; 