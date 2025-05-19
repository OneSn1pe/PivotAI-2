import React from 'react';

interface AttributeBarProps {
  name: string;
  value: number;
  maxValue: number;
  attributeClass: string;
  icon: string;
}

const AttributeBar: React.FC<AttributeBarProps> = ({ 
  name, 
  value, 
  maxValue, 
  attributeClass,
  icon
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className="inline-block mr-2">{icon}</span>
          <span className="text-sm font-medium text-slate-700">{name}</span>
        </div>
        <span className="text-xs font-medium text-slate-600">{value}/{maxValue}</span>
      </div>
      <div className="attribute-meter">
        <div 
          className={`${attributeClass}`} 
          style={{ width: `${percentage}%`, height: '100%' }}
        ></div>
      </div>
    </div>
  );
};

export interface CharacterStatsProps {
  attributes: {
    intelligence: number;
    charisma: number;
    strength: number;
    dexterity: number;
    wisdom: number;
    constitution: number;
  };
  className?: string;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ 
  attributes,
  className = ''
}) => {
  return (
    <div className={`${className} medieval-card p-4`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Character Stats</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-1">
        <AttributeBar 
          name="Intelligence" 
          value={attributes.intelligence} 
          maxValue={100} 
          attributeClass="attribute-intelligence"
          icon="🧠" 
        />
        <AttributeBar 
          name="Charisma" 
          value={attributes.charisma} 
          maxValue={100} 
          attributeClass="attribute-charisma"
          icon="💬" 
        />
        <AttributeBar 
          name="Strength" 
          value={attributes.strength} 
          maxValue={100} 
          attributeClass="attribute-strength"
          icon="💪" 
        />
        <AttributeBar 
          name="Dexterity" 
          value={attributes.dexterity} 
          maxValue={100} 
          attributeClass="attribute-dexterity"
          icon="⚡" 
        />
        <AttributeBar 
          name="Wisdom" 
          value={attributes.wisdom} 
          maxValue={100} 
          attributeClass="attribute-wisdom"
          icon="🧙" 
        />
        <AttributeBar 
          name="Constitution" 
          value={attributes.constitution} 
          maxValue={100} 
          attributeClass="attribute-constitution"
          icon="❤️" 
        />
      </div>
    </div>
  );
};

export default CharacterStats; 