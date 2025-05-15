import React, { useState } from 'react';

export type CharacterClass = 'Tech Wizard' | 'Business Paladin' | 'Creative Bard' | 'Data Ranger' | 'Marketing Alchemist';

interface ClassCardProps {
  name: CharacterClass;
  icon: string;
  description: string;
  strengths: string[];
  isSelected: boolean;
  onSelect: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({
  name,
  icon,
  description,
  strengths,
  isSelected,
  onSelect
}) => {
  return (
    <div 
      className={`medieval-card p-4 transition-all duration-300 cursor-pointer relative overflow-hidden ${
        isSelected 
          ? 'ring-4 ring-purple-500 shadow-xl shadow-purple-500/20' 
          : 'hover:shadow-lg hover:-translate-y-1'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 m-2 bg-purple-700 text-white p-1 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      <div className="flex items-center mb-3">
        <span className="text-3xl mr-3">{icon}</span>
        <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      
      <div className="border-t border-slate-200 pt-3">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Strengths:</h4>
        <ul className="space-y-1">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-center text-xs text-slate-600">
              <span className="inline-block text-amber-500 mr-2">⚔️</span>
              {strength}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export interface ClassSelectorProps {
  onClassSelect: (characterClass: CharacterClass) => void;
  selectedClass?: CharacterClass;
  className?: string;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ 
  onClassSelect, 
  selectedClass,
  className = ''
}) => {
  const [selected, setSelected] = useState<CharacterClass | undefined>(selectedClass);
  
  const handleSelect = (characterClass: CharacterClass) => {
    setSelected(characterClass);
    onClassSelect(characterClass);
  };
  
  const classes: Array<Omit<ClassCardProps, 'isSelected' | 'onSelect'>> = [
    {
      name: 'Tech Wizard',
      icon: '🧙‍♂️',
      description: 'Masters of digital arcana who wield code and algorithms to create powerful solutions.',
      strengths: ['Software Development', 'Problem Solving', 'Technical Leadership', 'Continuous Learning']
    },
    {
      name: 'Business Paladin',
      icon: '🛡️',
      description: 'Noble defenders of business value who lead teams and protect project integrity.',
      strengths: ['Leadership', 'Strategic Planning', 'Negotiation', 'Project Management']
    },
    {
      name: 'Creative Bard',
      icon: '🎨',
      description: 'Artistic storytellers who craft compelling visual narratives and user experiences.',
      strengths: ['Design Thinking', 'Visual Communication', 'User Experience', 'Brand Development']
    },
    {
      name: 'Data Ranger',
      icon: '📊',
      description: 'Expert trackers who navigate vast data landscapes to extract valuable insights.',
      strengths: ['Analytics', 'Pattern Recognition', 'Data Visualization', 'Statistical Modeling']
    },
    {
      name: 'Marketing Alchemist',
      icon: '⚗️',
      description: 'Innovative mixers of strategies and tactics to create potent market positioning.',
      strengths: ['Campaign Strategy', 'Content Creation', 'Market Analysis', 'Social Engagement']
    }
  ];
  
  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Choose Your Character Class</h2>
      <p className="text-slate-600 mb-6">Your class determines your specialized skills and career path advantages.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(classInfo => (
          <ClassCard 
            key={classInfo.name}
            {...classInfo}
            isSelected={selected === classInfo.name}
            onSelect={() => handleSelect(classInfo.name)}
          />
        ))}
      </div>
      
      {selected && (
        <div className="mt-8 flex justify-center">
          <button 
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-3 rounded-lg text-lg font-medium shadow-md shadow-purple-500/30 transition-all duration-300 quest-btn"
            onClick={() => onClassSelect(selected)}
          >
            Confirm Class Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassSelector; 