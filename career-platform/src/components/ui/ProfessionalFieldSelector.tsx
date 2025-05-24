import React, { useState } from 'react';
import { ProfessionalField } from '@/types/user';

interface FieldCardProps {
  field: ProfessionalField;
  title: string;
  icon: string;
  description: string;
  keyAreas: string[];
  careerPaths: string[];
  isSelected: boolean;
  onSelect: () => void;
}

const FieldCard: React.FC<FieldCardProps> = ({
  field,
  title,
  icon,
  description,
  keyAreas,
  careerPaths,
  isSelected,
  onSelect
}) => {
  return (
    <div 
      className={`p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
        isSelected 
          ? 'border-teal-500 bg-teal-50 shadow-lg' 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:-translate-y-1'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 m-4 bg-teal-600 text-white p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <span className="text-4xl mr-4">{icon}</span>
        <div>
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-600 capitalize">{field.replace('-', ' ')}</p>
        </div>
      </div>
      
      <p className="text-slate-600 mb-4 leading-relaxed">{description}</p>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Areas:</h4>
        <div className="flex flex-wrap gap-2">
          {keyAreas.map((area, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Career Paths:</h4>
        <ul className="space-y-1">
          {careerPaths.slice(0, 3).map((path, index) => (
            <li key={index} className="flex items-center text-sm text-slate-600">
              <span className="inline-block text-teal-500 mr-2">→</span>
              {path}
            </li>
          ))}
          {careerPaths.length > 3 && (
            <li className="text-xs text-slate-500 italic">+{careerPaths.length - 3} more...</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export interface ProfessionalFieldSelectorProps {
  onFieldSelect: (field: ProfessionalField) => void;
  selectedField?: ProfessionalField;
  className?: string;
}

const ProfessionalFieldSelector: React.FC<ProfessionalFieldSelectorProps> = ({ 
  onFieldSelect, 
  selectedField,
  className = ''
}) => {
  const [selected, setSelected] = useState<ProfessionalField | undefined>(selectedField);
  
  const handleSelect = (field: ProfessionalField) => {
    setSelected(field);
    onFieldSelect(field);
  };
  
  const fields: Array<Omit<FieldCardProps, 'isSelected' | 'onSelect'>> = [
    {
      field: 'computer-science',
      title: 'Computer Science & Technology',
      icon: '💻',
      description: 'Build software solutions, develop algorithms, and create digital innovations that shape the future.',
      keyAreas: ['Software Development', 'Data Structures', 'Algorithms', 'System Design', 'Database Management'],
      careerPaths: ['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'Tech Lead', 'Solutions Architect']
    },
    {
      field: 'engineering',
      title: 'Engineering',
      icon: '⚙️',
      description: 'Design, build, and optimize systems that solve real-world problems through applied science and innovation.',
      keyAreas: ['Design & Analysis', 'Safety Standards', 'Project Management', 'Regulatory Compliance', 'Quality Control'],
      careerPaths: ['Design Engineer', 'Project Engineer', 'Systems Engineer', 'Engineering Manager', 'Technical Consultant', 'Research Engineer']
    },
    {
      field: 'medicine',
      title: 'Medicine & Healthcare',
      icon: '⚕️',
      description: 'Provide compassionate care, advance medical knowledge, and improve patient outcomes through clinical excellence.',
      keyAreas: ['Patient Care', 'Clinical Diagnosis', 'Medical Research', 'Evidence-Based Practice', 'Medical Ethics'],
      careerPaths: ['Physician', 'Surgeon', 'Medical Researcher', 'Healthcare Administrator', 'Clinical Specialist', 'Medical Consultant']
    },
    {
      field: 'business',
      title: 'Business & Management',
      icon: '💼',
      description: 'Drive organizational success through strategic thinking, leadership, and innovative business solutions.',
      keyAreas: ['Strategic Planning', 'Financial Analysis', 'Operations Management', 'Market Research', 'Leadership'],
      careerPaths: ['Business Analyst', 'Management Consultant', 'Product Manager', 'Operations Manager', 'Executive', 'Entrepreneur']
    },
    {
      field: 'law',
      title: 'Law & Legal Services',
      icon: '⚖️',
      description: 'Advocate for justice, provide legal counsel, and navigate complex regulatory frameworks to protect rights.',
      keyAreas: ['Legal Research', 'Case Analysis', 'Client Advocacy', 'Regulatory Compliance', 'Negotiation'],
      careerPaths: ['Attorney', 'Legal Counsel', 'Judge', 'Legal Consultant', 'Compliance Officer', 'Legal Researcher']
    }
  ];
  
  return (
    <div className={`${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Choose Your Professional Field</h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Select your primary area of professional focus. This will customize your learning path, 
          milestone categories, and career development recommendations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fields.map(fieldInfo => (
          <FieldCard 
            key={fieldInfo.field}
            {...fieldInfo}
            isSelected={selected === fieldInfo.field}
            onSelect={() => handleSelect(fieldInfo.field)}
          />
        ))}
      </div>
      
      {selected && (
        <div className="mt-10 flex justify-center">
          <button 
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            onClick={() => onFieldSelect(selected)}
          >
            Continue with {fields.find(f => f.field === selected)?.title}
          </button>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Don't worry - you can change your field selection later in your profile settings.
        </p>
      </div>
    </div>
  );
};

export default ProfessionalFieldSelector; 