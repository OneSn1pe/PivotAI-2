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
  xp: number;
  nextLevelXp: number;
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
  xp: number;
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
      xp: 25,
      coins: 10
    },
    objectives: milestone.tasks ? milestone.tasks.map((task, taskIndex) => ({
      id: `task-${index}-${taskIndex}`,
      description: task.description,
      completed: task.completed
    })) : []
  };
};

// Calculate level based on XP
export const calculateLevel = (xp: number): number => {
  // Simple level calculation: 1 level per 100 XP
  return Math.max(1, Math.floor(xp / 100) + 1);
};

// Calculate XP needed for next level
export const calculateNextLevelXp = (level: number): number => {
  return level * 100;
}; 