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
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className="inline-block mr-2">{icon}</span>
          <span className="text-sm font-medium text-slate-700 font-inter">{name}</span>
        </div>
        <span className="text-xs font-medium text-slate-600">{value}/{maxValue}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`${attributeClass} h-full rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export interface ProfessionalAttributesProps {
  attributes: {
    knowledge: number;
    communication: number;
    execution: number;
    adaptability: number;
    strategy: number;
    balance: number;
  };
  className?: string;
}

const ProfessionalAttributes: React.FC<ProfessionalAttributesProps> = ({ 
  attributes,
  className = ''
}) => {
  return (
    <div className={`${className} bg-white p-5 rounded-lg shadow-card border border-slate-200`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 font-inter">Professional Attributes</h3>
        <p className="text-sm text-slate-600 mt-1">These metrics represent your core professional capabilities</p>
      </div>
      
      <div className="space-y-1">
        <AttributeBar 
          name="Knowledge" 
          value={attributes.knowledge} 
          maxValue={100} 
          attributeClass="bg-blue-500"
          icon="🧠" 
        />
        <AttributeBar 
          name="Communication" 
          value={attributes.communication} 
          maxValue={100} 
          attributeClass="bg-violet-500"
          icon="💬" 
        />
        <AttributeBar 
          name="Execution" 
          value={attributes.execution} 
          maxValue={100} 
          attributeClass="bg-red-500"
          icon="🎯" 
        />
        <AttributeBar 
          name="Adaptability" 
          value={attributes.adaptability} 
          maxValue={100} 
          attributeClass="bg-emerald-500"
          icon="🔄" 
        />
        <AttributeBar 
          name="Strategy" 
          value={attributes.strategy} 
          maxValue={100} 
          attributeClass="bg-indigo-500"
          icon="📈" 
        />
        <AttributeBar 
          name="Balance" 
          value={attributes.balance} 
          maxValue={100} 
          attributeClass="bg-orange-500"
          icon="⚖️" 
        />
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">Attributes increase as you complete related tasks and milestones</p>
      </div>
    </div>
  );
};

export default ProfessionalAttributes; 