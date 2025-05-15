import React, { useState, useEffect } from 'react';
import { CharacterAttributes } from '@/types/game';

export interface LevelUpModalProps {
  show: boolean;
  onClose: () => void;
  newLevel: number;
  previousAttributes?: CharacterAttributes;
  newAttributes: CharacterAttributes;
  newUnlocks?: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  show,
  onClose,
  newLevel,
  previousAttributes,
  newAttributes,
  newUnlocks = []
}) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  
  // Reset animation state when modal is opened
  useEffect(() => {
    if (show) {
      setAnimationStage(0);
      const timer1 = setTimeout(() => setAnimationStage(1), 1000);
      const timer2 = setTimeout(() => setShowParticles(true), 500);
      const timer3 = setTimeout(() => setAnimationStage(2), 2500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setShowParticles(false);
    }
  }, [show]);
  
  if (!show) return null;
  
  // Calculate attribute increases
  const getAttributeIncrease = (attr: keyof CharacterAttributes): number => {
    if (!previousAttributes) return 0;
    return newAttributes[attr] - previousAttributes[attr];
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 max-w-lg w-full mx-4">
        {/* Particles effect */}
        {showParticles && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-70"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float-up ${2 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
        
        <div className="parchment p-8 text-center relative overflow-hidden">
          {/* Golden border animation */}
          <div className="absolute inset-0 border-8 border-amber-500 opacity-0 animate-pulse" 
               style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          
          {/* Level up text with animation */}
          <div className={`transition-all duration-1000 transform ${
            animationStage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}>
            <h2 className="text-4xl font-bold text-amber-600 mb-2 animate-pulse" style={{ textShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}>
              LEVEL UP!
            </h2>
            <div className="text-2xl font-semibold text-slate-800 mb-6">
              You are now level <span className="text-amber-700">{newLevel}</span>
            </div>
            
            {/* Attribute changes */}
            <div className={`transition-all duration-1000 delay-500 ${
              animationStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Attribute Improvements</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries(newAttributes).map(([key, value]) => {
                  const attrKey = key as keyof CharacterAttributes;
                  const increase = getAttributeIncrease(attrKey);
                  
                  // Determine attribute icon
                  let icon = '⚡';
                  switch(attrKey) {
                    case 'intelligence': icon = '🧠'; break;
                    case 'charisma': icon = '💬'; break;
                    case 'strength': icon = '💪'; break;
                    case 'dexterity': icon = '⚡'; break;
                    case 'wisdom': icon = '🧙'; break;
                    case 'constitution': icon = '❤️'; break;
                  }
                  
                  return (
                    <div key={key} className="flex items-center">
                      <span className="text-xl mr-2">{icon}</span>
                      <div>
                        <div className="font-medium text-slate-800 capitalize">{key}</div>
                        <div className="flex items-center">
                          {previousAttributes && (
                            <span className="text-slate-500 line-through mr-2">{previousAttributes[attrKey]}</span>
                          )}
                          <span className="text-slate-800">{value}</span>
                          {increase > 0 && (
                            <span className="text-green-600 ml-1">+{increase}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* New unlocks */}
              {newUnlocks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-700 mb-4">New Unlocks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newUnlocks.map((unlock, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start">
                        <span className="text-2xl mr-3">{unlock.icon}</span>
                        <div className="text-left">
                          <h4 className="font-medium text-amber-800">{unlock.name}</h4>
                          <p className="text-xs text-slate-600">{unlock.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-lg text-lg font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
              >
                Continue Adventure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal; 