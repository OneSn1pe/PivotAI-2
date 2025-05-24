import React from 'react';
import { ProfessionalCompetencies, ProfessionalField } from '@/types/user';

interface CompetencyBarProps {
  name: string;
  value: number;
  maxValue: number;
  color: string;
  icon: string;
  description: string;
}

const CompetencyBar: React.FC<CompetencyBarProps> = ({ 
  name, 
  value, 
  maxValue, 
  color,
  icon,
  description
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const level = percentage >= 80 ? 'Expert' : percentage >= 60 ? 'Advanced' : percentage >= 40 ? 'Intermediate' : percentage >= 20 ? 'Developing' : 'Novice';
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="text-xl mr-3">{icon}</span>
          <div>
            <h4 className="font-semibold text-slate-800">{name}</h4>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-slate-700">{value}/{maxValue}</span>
          <p className="text-xs text-slate-500">{level}</p>
        </div>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
        {/* Progress segments */}
        <div className="absolute inset-0 flex">
          {[20, 40, 60, 80].map((segment, index) => (
            <div 
              key={index}
              className="flex-1 border-r border-white last:border-r-0"
              style={{ borderRightWidth: index === 3 ? '0' : '1px' }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Novice</span>
        <span>Developing</span>
        <span>Intermediate</span>
        <span>Advanced</span>
        <span>Expert</span>
      </div>
    </div>
  );
};

export interface ProfessionalCompetenciesProps {
  competencies: ProfessionalCompetencies;
  professionalField: ProfessionalField;
  className?: string;
  showFieldSpecific?: boolean;
}

const ProfessionalCompetenciesComponent: React.FC<ProfessionalCompetenciesProps> = ({ 
  competencies,
  professionalField,
  className = '',
  showFieldSpecific = true
}) => {
  
  // Core competencies that apply to all fields
  const coreCompetencies = [
    {
      key: 'technical_expertise' as keyof ProfessionalCompetencies,
      name: 'Technical Expertise',
      icon: '🔧',
      description: 'Domain-specific technical skills and knowledge',
      color: 'bg-blue-500'
    },
    {
      key: 'communication' as keyof ProfessionalCompetencies,
      name: 'Communication',
      icon: '💬',
      description: 'Written and verbal communication effectiveness',
      color: 'bg-green-500'
    },
    {
      key: 'problem_solving' as keyof ProfessionalCompetencies,
      name: 'Problem Solving',
      icon: '🧩',
      description: 'Analytical and creative problem-solving abilities',
      color: 'bg-purple-500'
    },
    {
      key: 'project_management' as keyof ProfessionalCompetencies,
      name: 'Project Management',
      icon: '📋',
      description: 'Planning, organization, and execution skills',
      color: 'bg-orange-500'
    },
    {
      key: 'continuous_learning' as keyof ProfessionalCompetencies,
      name: 'Continuous Learning',
      icon: '📚',
      description: 'Adaptation and skill development mindset',
      color: 'bg-teal-500'
    },
    {
      key: 'professional_ethics' as keyof ProfessionalCompetencies,
      name: 'Professional Ethics',
      icon: '⚖️',
      description: 'Ethical decision-making and integrity',
      color: 'bg-indigo-500'
    }
  ];

  // Field-specific competency extensions
  const getFieldSpecificCompetencies = () => {
    switch (professionalField) {
      case 'engineering':
        return [
          {
            key: 'design_thinking' as any,
            name: 'Design Thinking',
            icon: '🎨',
            description: 'Creative design and innovation approach',
            color: 'bg-cyan-500'
          },
          {
            key: 'safety_awareness' as any,
            name: 'Safety Awareness',
            icon: '🛡️',
            description: 'Risk assessment and safety protocols',
            color: 'bg-red-500'
          },
          {
            key: 'regulatory_knowledge' as any,
            name: 'Regulatory Knowledge',
            icon: '📜',
            description: 'Standards and compliance understanding',
            color: 'bg-amber-500'
          }
        ];
      case 'medicine':
        return [
          {
            key: 'clinical_judgment' as any,
            name: 'Clinical Judgment',
            icon: '🩺',
            description: 'Medical decision-making abilities',
            color: 'bg-rose-500'
          },
          {
            key: 'patient_care' as any,
            name: 'Patient Care',
            icon: '❤️',
            description: 'Empathy and bedside manner',
            color: 'bg-pink-500'
          },
          {
            key: 'evidence_based_practice' as any,
            name: 'Evidence-Based Practice',
            icon: '🔬',
            description: 'Research and data-driven decisions',
            color: 'bg-violet-500'
          }
        ];
      case 'business':
        return [
          {
            key: 'strategic_thinking' as any,
            name: 'Strategic Thinking',
            icon: '🎯',
            description: 'Long-term planning and vision',
            color: 'bg-emerald-500'
          },
          {
            key: 'financial_acumen' as any,
            name: 'Financial Acumen',
            icon: '💰',
            description: 'Financial analysis and planning skills',
            color: 'bg-yellow-500'
          },
          {
            key: 'market_insight' as any,
            name: 'Market Insight',
            icon: '📈',
            description: 'Customer and market understanding',
            color: 'bg-lime-500'
          }
        ];
      case 'law':
        return [
          {
            key: 'legal_reasoning' as any,
            name: 'Legal Reasoning',
            icon: '⚖️',
            description: 'Analysis and argumentation skills',
            color: 'bg-slate-500'
          },
          {
            key: 'research_skills' as any,
            name: 'Research Skills',
            icon: '🔍',
            description: 'Case law and precedent research',
            color: 'bg-gray-500'
          },
          {
            key: 'client_relations' as any,
            name: 'Client Relations',
            icon: '🤝',
            description: 'Trust-building and communication',
            color: 'bg-sky-500'
          }
        ];
      default:
        return [];
    }
  };

  const fieldSpecificCompetencies = getFieldSpecificCompetencies();
  const extendedCompetencies = competencies as any;

  const getFieldTitle = (field: ProfessionalField): string => {
    const titles = {
      'computer-science': 'Computer Science & Technology',
      'engineering': 'Engineering',
      'medicine': 'Medicine & Healthcare',
      'business': 'Business & Management',
      'law': 'Law & Legal Services'
    };
    return titles[field];
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-card border border-slate-200 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Professional Competencies</h3>
        <p className="text-sm text-slate-600">
          Track your professional development across core and field-specific competencies
        </p>
        <div className="mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full inline-block">
          {getFieldTitle(professionalField)}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
            <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
            Core Competencies
          </h4>
          {coreCompetencies.map(competency => (
            <CompetencyBar 
              key={competency.key}
              name={competency.name} 
              value={competencies[competency.key]} 
              maxValue={100} 
              color={competency.color}
              icon={competency.icon}
              description={competency.description}
            />
          ))}
        </div>

        {showFieldSpecific && fieldSpecificCompetencies.length > 0 && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
              {getFieldTitle(professionalField)} Competencies
            </h4>
            {fieldSpecificCompetencies.map(competency => (
              <CompetencyBar 
                key={competency.key}
                name={competency.name} 
                value={extendedCompetencies[competency.key] || 0} 
                maxValue={100} 
                color={competency.color}
                icon={competency.icon}
                description={competency.description}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Competencies improve as you complete milestones and gain professional experience
        </p>
      </div>
    </div>
  );
};

export default ProfessionalCompetenciesComponent; 