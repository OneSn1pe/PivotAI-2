import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharacterAttributes, CharacterClass, CharacterProgress, calculateLevel } from '@/types/game';
import { useAuth } from './AuthContext';

interface GameContextType {
  characterProgress: CharacterProgress;
  updateCharacterClass: (characterClass: CharacterClass) => void;
  updateAttributes: (attributes: Partial<CharacterAttributes>) => void;
  addMilestoneCompletion: () => Promise<{
    leveledUp: boolean;
    previousLevel: number;
    newLevel: number;
    previousAttributes?: CharacterAttributes;
    newAttributes: CharacterAttributes;
  }>;
  isLoading: boolean;
}

const defaultAttributes: CharacterAttributes = {
  intelligence: 50,
  charisma: 50,
  strength: 50,
  dexterity: 50,
  wisdom: 50,
  constitution: 50
};

const defaultCharacterProgress: CharacterProgress = {
  level: 1,
  characterClass: 'Tech Wizard',
  attributes: defaultAttributes
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [characterProgress, setCharacterProgress] = useState<CharacterProgress>(defaultCharacterProgress);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load character progress from localStorage or API on mount
  useEffect(() => {
    const loadCharacterProgress = async () => {
      if (!userProfile?.uid) {
        setIsLoading(false);
        return;
      }
      
      try {
        // In a real app, fetch from API/database
        const savedProgress = localStorage.getItem(`character_${userProfile.uid}`);
        
        if (savedProgress) {
          setCharacterProgress(JSON.parse(savedProgress));
        } else {
          // Initialize with default values
          setCharacterProgress({
            ...defaultCharacterProgress,
            // Could initialize based on user profile data
          });
        }
      } catch (error) {
        console.error('Error loading character progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCharacterProgress();
  }, [userProfile?.uid]);
  
  // Save character progress to localStorage when it changes
  useEffect(() => {
    if (userProfile?.uid && !isLoading) {
      localStorage.setItem(`character_${userProfile.uid}`, JSON.stringify(characterProgress));
      
      // In a real app, also save to API/database
      // saveCharacterProgressToAPI(userProfile.uid, characterProgress);
    }
  }, [characterProgress, userProfile?.uid, isLoading]);
  
  const updateCharacterClass = (characterClass: CharacterClass) => {
    setCharacterProgress(prev => ({
      ...prev,
      characterClass
    }));
  };
  
  const updateAttributes = (attributes: Partial<CharacterAttributes>) => {
    setCharacterProgress(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        ...attributes
      }
    }));
  };
  
  const addMilestoneCompletion = async () => {
    // Store current state for comparison
    const previousLevel = characterProgress.level;
    const previousAttributes = { ...characterProgress.attributes };
    
    // Calculate new level based on milestone completion
    // This would normally come from the user's actual completed milestone count
    const completedMilestones = previousLevel * 5; // Placeholder calculation
    const newLevel = calculateLevel(completedMilestones + 1);
    const leveledUp = newLevel > previousLevel;
    
    // Calculate attribute increases if leveled up
    let newAttributes = { ...previousAttributes };
    
    if (leveledUp) {
      // Increase attributes based on character class and level difference
      const levelDifference = newLevel - previousLevel;
      
      // Different classes gain different attribute bonuses
      switch (characterProgress.characterClass) {
        case 'Tech Wizard':
          newAttributes.intelligence += 2 * levelDifference;
          newAttributes.wisdom += 1 * levelDifference;
          break;
        case 'Business Paladin':
          newAttributes.strength += 2 * levelDifference;
          newAttributes.charisma += 1 * levelDifference;
          break;
        case 'Creative Bard':
          newAttributes.charisma += 2 * levelDifference;
          newAttributes.dexterity += 1 * levelDifference;
          break;
        case 'Data Ranger':
          newAttributes.intelligence += 1 * levelDifference;
          newAttributes.dexterity += 2 * levelDifference;
          break;
        case 'Marketing Alchemist':
          newAttributes.charisma += 1 * levelDifference;
          newAttributes.wisdom += 2 * levelDifference;
          break;
        default:
          // Default attribute increase
          newAttributes.intelligence += 1 * levelDifference;
          newAttributes.constitution += 1 * levelDifference;
      }
      
      // Cap attributes at 100
      Object.keys(newAttributes).forEach(key => {
        const attrKey = key as keyof CharacterAttributes;
        newAttributes[attrKey] = Math.min(100, newAttributes[attrKey]);
      });
    }
    
    // Update state
    setCharacterProgress(prev => ({
      ...prev,
      level: newLevel,
      attributes: newAttributes
    }));
    
    return {
      leveledUp,
      previousLevel,
      newLevel,
      previousAttributes: leveledUp ? previousAttributes : undefined,
      newAttributes
    };
  };
  
  const value = {
    characterProgress,
    updateCharacterClass,
    updateAttributes,
    addMilestoneCompletion,
    isLoading
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext; 