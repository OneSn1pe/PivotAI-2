import { MilestoneTask } from './user';

export type CharacterClass = 'Tech Wizard' | 'Business Paladin' | 'Creative Bard' | 'Data Ranger' | 'Marketing Alchemist';

export type AttributeName = 'intelligence' | 'charisma' | 'strength' | 'dexterity' | 'wisdom' | 'constitution';

export interface CharacterAttributes {
  intelligence: number;
  charisma: number;
  strength: number;
  dexterity: number;
  wisdom: number;
  constitution: number;
}

export interface CharacterProgress {
  level: number;
  characterClass: CharacterClass;
  attributes: CharacterAttributes;
}

export type QuestDifficulty = 1 | 2 | 3 | 4 | 5;
export type QuestType = 'main' | 'side' | 'daily';
export type QuestStatus = 'available' | 'in-progress' | 'completed' | 'locked';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

export interface QuestReward {
  coins?: number;
  items?: Array<{
    id: string;
    name: string;
    rarity: ItemRarity;
  }>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  rewards: QuestReward;
  requiredLevel?: number;
  objectives?: QuestObjective[];
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  type: 'skill' | 'achievement' | 'equipment';
  attributes?: Partial<CharacterAttributes>;
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: {
    current: number;
    required: number;
  };
}

// Helper function to convert a milestone to a quest
export const milestoneToQuest = (
  milestone: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    tasks?: MilestoneTask[];
  }, 
  index: number
): Quest => {
  return {
    id: `milestone-${milestone.id}`,
    title: milestone.title,
    description: milestone.description,
    type: index === 0 ? 'main' : 'side',
    difficulty: Math.min(5, Math.max(1, Math.ceil(index / 2) + 1)) as QuestDifficulty,
    status: milestone.completed ? 'completed' : 'available',
    rewards: {
      coins: 10
    },
    objectives: milestone.tasks ? milestone.tasks.map((task, taskIndex) => ({
      id: `task-${index}-${taskIndex}`,
      description: task.description,
      completed: task.completed
    })) : []
  };
};

// Calculate level should not be based on milestone count
// Levels are determined by completing ALL milestones within a level
// This function is deprecated - use userProgress.currentLevel directly
export const calculateLevel = (completedMilestones: number): number => {
  console.warn('calculateLevel is deprecated. Levels should be determined by completing all milestones in a level, not by count.');
  // Return 1 as default - actual level should come from UserProgress
  return 1;
}; 