import React, { useState } from 'react';
import { CharacterAttributes, CharacterClass, Achievement, InventoryItem } from '@/types/game';
import CharacterStats from './CharacterStats';

export interface CharacterSheetProps {
  characterName: string;
  characterClass: CharacterClass;
  level: number;
  xp: number;
  nextLevelXp: number;
  attributes: CharacterAttributes;
  skills: string[];
  achievements: Achievement[];
  inventory: InventoryItem[];
  experience: Array<{
    id: string;
    title: string;
    organization: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    period: string;
  }>;
  className?: string;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({
  characterName,
  characterClass,
  level,
  xp,
  nextLevelXp,
  attributes,
  skills,
  achievements,
  inventory,
  experience,
  education,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills' | 'achievements' | 'history'>('attributes');
  
  // Get class icon
  const getClassIcon = (characterClass: CharacterClass): string => {
    switch (characterClass) {
      case 'Tech Wizard':
        return '🧙‍♂️';
      case 'Business Paladin':
        return '🛡️';
      case 'Creative Bard':
        return '🎨';
      case 'Data Ranger':
        return '📊';
      case 'Marketing Alchemist':
        return '⚗️';
      default:
        return '👤';
    }
  };
  
  // Get rarity color
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 bg-gray-50';
      case 'uncommon':
        return 'border-green-400 bg-green-50';
      case 'rare':
        return 'border-blue-400 bg-blue-50';
      case 'epic':
        return 'border-purple-400 bg-purple-50';
      case 'legendary':
        return 'border-amber-400 bg-amber-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };
  
  return (
    <div className={`parchment p-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Character header */}
        <div className="md:w-1/3">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">{getClassIcon(characterClass)}</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{characterName}</h1>
              <div className="text-amber-700">
                Level {level} {characterClass}
              </div>
            </div>
          </div>
          
          {/* Character stats */}
          <CharacterStats 
            level={level}
            xp={xp}
            nextLevelXp={nextLevelXp}
            attributes={attributes}
            className="mb-6"
          />
        </div>
        
        {/* Character details */}
        <div className="md:w-2/3">
          {/* Tab navigation */}
          <div className="flex border-b border-amber-300 mb-4">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'attributes' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-slate-600 hover:text-amber-700'}`}
              onClick={() => setActiveTab('attributes')}
            >
              Attributes
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'skills' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-slate-600 hover:text-amber-700'}`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'achievements' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-slate-600 hover:text-amber-700'}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-amber-800 border-b-2 border-amber-500' : 'text-slate-600 hover:text-amber-700'}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
          
          {/* Tab content */}
          <div className="p-2">
            {/* Attributes tab */}
            {activeTab === 'attributes' && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Character Attributes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium text-slate-700 mb-2">Intelligence ({attributes.intelligence})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your knowledge-based skills and learning capacity. Intelligence affects your ability to solve complex problems and master new technologies.
                    </p>
                    
                    <h3 className="text-md font-medium text-slate-700 mb-2">Charisma ({attributes.charisma})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your communication and networking abilities. Charisma determines how effectively you can persuade others and build professional relationships.
                    </p>
                    
                    <h3 className="text-md font-medium text-slate-700 mb-2">Strength ({attributes.strength})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your project execution and deadline management. Strength represents your ability to push through challenges and deliver results under pressure.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-slate-700 mb-2">Dexterity ({attributes.dexterity})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your adaptability and quick problem-solving. Dexterity reflects how quickly you can pivot when circumstances change and respond to new challenges.
                    </p>
                    
                    <h3 className="text-md font-medium text-slate-700 mb-2">Wisdom ({attributes.wisdom})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your decision-making and strategic thinking. Wisdom affects your ability to make sound judgments and develop effective long-term strategies.
                    </p>
                    
                    <h3 className="text-md font-medium text-slate-700 mb-2">Constitution ({attributes.constitution})</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Your work-life balance and burnout resistance. Constitution represents your resilience and ability to maintain productivity over time.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Skills tab */}
            {activeTab === 'skills' && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Skills & Abilities</h2>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div 
                        key={index}
                        className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No skills have been added to your character sheet yet.</p>
                )}
                
                <h3 className="text-md font-medium text-slate-700 mt-6 mb-2">Inventory Items</h3>
                {inventory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {inventory.map(item => (
                      <div 
                        key={item.id}
                        className={`border-2 rounded-md p-3 ${getRarityColor(item.rarity)}`}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-xl mr-2">{item.icon}</span>
                          <h4 className="font-medium">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">Your inventory is empty.</p>
                )}
              </div>
            )}
            
            {/* Achievements tab */}
            {activeTab === 'achievements' && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Achievements</h2>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map(achievement => (
                      <div 
                        key={achievement.id}
                        className={`border rounded-md p-4 ${achievement.unlocked ? 'bg-amber-50 border-amber-300' : 'bg-slate-100 border-slate-300 opacity-60'}`}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">{achievement.icon}</span>
                          <div>
                            <h3 className="font-medium text-slate-800">{achievement.name}</h3>
                            {achievement.unlocked && achievement.unlockedAt && (
                              <div className="text-xs text-slate-500">
                                Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                        
                        {!achievement.unlocked && achievement.progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress.current}/{achievement.progress.required}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500"
                                style={{ width: `${(achievement.progress.current / achievement.progress.required) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No achievements unlocked yet. Complete quests to earn achievements!</p>
                )}
              </div>
            )}
            
            {/* History tab */}
            {activeTab === 'history' && (
              <div>
                <h2 className="text-lg font-semibold text-amber-800 mb-4">Adventure Log</h2>
                
                {/* Experience */}
                <h3 className="text-md font-medium text-slate-700 mb-3">Past Quests</h3>
                {experience.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {experience.map(exp => (
                      <div key={exp.id} className="border-l-2 border-amber-500 pl-4">
                        <h4 className="font-medium text-slate-800">{exp.title}</h4>
                        <div className="text-sm text-amber-700 mb-1">{exp.organization} • {exp.period}</div>
                        <p className="text-sm text-slate-600">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 mb-6">No past quests recorded.</p>
                )}
                
                {/* Education */}
                <h3 className="text-md font-medium text-slate-700 mb-3">Training & Knowledge</h3>
                {education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map(edu => (
                      <div key={edu.id} className="border-l-2 border-indigo-500 pl-4">
                        <h4 className="font-medium text-slate-800">{edu.degree}</h4>
                        <div className="text-sm text-indigo-700 mb-1">{edu.institution} • {edu.period}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No training history recorded.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet; 