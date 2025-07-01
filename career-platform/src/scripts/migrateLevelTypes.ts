#!/usr/bin/env node

/**
 * Migration script to add level types to existing roadmaps
 * Run with: npm run migrate:level-types
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { LevelType, getNextLevelType } from '../types/levelTypes';
import { Milestone } from '../types/user';
import { getMilestoneTypeIndicators } from '../utils/levelValidation';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore(app);

interface MigrationStats {
  totalRoadmaps: number;
  migratedRoadmaps: number;
  totalMilestones: number;
  migratedMilestones: number;
  errors: string[];
}

async function detectLevelType(milestones: Milestone[]): Promise<LevelType> {
  let skillCount = 0;
  let projectCount = 0;
  let positionCount = 0;

  milestones.forEach(milestone => {
    const indicators = getMilestoneTypeIndicators(milestone);
    
    if (indicators.isSkillMilestone) skillCount++;
    if (indicators.isProjectMilestone) projectCount++;
    if (indicators.isPositionMilestone) positionCount++;
  });

  // Determine dominant type
  if (projectCount > skillCount && projectCount > positionCount) {
    return 'project';
  } else if (positionCount > skillCount && positionCount > projectCount) {
    return 'position';
  } else {
    return 'skill'; // Default to skill
  }
}

async function migrateRoadmap(roadmapId: string, roadmapData: any): Promise<boolean> {
  try {
    const milestones = roadmapData.milestones || [];
    if (milestones.length === 0) {
      console.log(`Skipping roadmap ${roadmapId}: No milestones`);
      return false;
    }

    // Group milestones by level
    const milestonesByLevel: { [level: number]: Milestone[] } = {};
    milestones.forEach((milestone: Milestone) => {
      const level = milestone.level || 1;
      if (!milestonesByLevel[level]) {
        milestonesByLevel[level] = [];
      }
      milestonesByLevel[level].push(milestone);
    });

    // Create level structure
    const levelStructure: any = {};
    const updatedMilestones: Milestone[] = [];

    for (const [levelStr, levelMilestones] of Object.entries(milestonesByLevel)) {
      const level = parseInt(levelStr);
      
      // Detect level type based on milestone content
      const detectedType = await detectLevelType(levelMilestones);
      
      // Or use the progression pattern
      const patternType = getNextLevelType(level);
      
      // Use pattern type by default, but log if detection differs significantly
      const levelType = patternType;
      if (detectedType !== patternType) {
        console.log(`Level ${level}: Pattern suggests ${patternType}, content suggests ${detectedType}`);
      }

      // Update milestones with level type
      levelMilestones.forEach(milestone => {
        updatedMilestones.push({
          ...milestone,
          levelType: levelType
        });
      });

      // Store level structure
      levelStructure[level] = {
        levelNumber: level,
        levelType: levelType,
        milestones: levelMilestones.map(m => m.id),
        generatedAt: new Date()
      };
    }

    // Update roadmap with typed milestones
    await db.collection('roadmaps').doc(roadmapId).update({
      milestones: updatedMilestones,
      updatedAt: new Date()
    });

    // Store level structure
    const candidateId = roadmapData.candidateId;
    if (candidateId) {
      await db.collection('levelStructures').doc(candidateId).set({
        candidateId,
        levels: levelStructure,
        currentLevel: Math.max(...Object.keys(levelStructure).map(k => parseInt(k))),
        totalLevels: Object.keys(levelStructure).length,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    return true;
  } catch (error) {
    console.error(`Error migrating roadmap ${roadmapId}:`, error);
    return false;
  }
}

async function runMigration(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalRoadmaps: 0,
    migratedRoadmaps: 0,
    totalMilestones: 0,
    migratedMilestones: 0,
    errors: []
  };

  try {
    console.log('Starting level type migration...');
    
    // Get all roadmaps
    const roadmapsSnapshot = await db.collection('roadmaps').get();
    stats.totalRoadmaps = roadmapsSnapshot.size;
    
    console.log(`Found ${stats.totalRoadmaps} roadmaps to migrate`);

    // Process in batches
    const batchSize = 10;
    const roadmaps = roadmapsSnapshot.docs;
    
    for (let i = 0; i < roadmaps.length; i += batchSize) {
      const batch = roadmaps.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(roadmaps.length / batchSize)}`);
      
      const results = await Promise.all(
        batch.map(async (doc) => {
          const data = doc.data();
          stats.totalMilestones += (data.milestones || []).length;
          
          const migrated = await migrateRoadmap(doc.id, data);
          if (migrated) {
            stats.migratedRoadmaps++;
            stats.migratedMilestones += (data.milestones || []).length;
          }
          return migrated;
        })
      );
      
      // Log progress
      console.log(`Batch complete. Total migrated: ${stats.migratedRoadmaps}/${stats.totalRoadmaps}`);
    }

    console.log('\nMigration completed successfully!');
    console.log('Migration Statistics:');
    console.log(`- Total roadmaps: ${stats.totalRoadmaps}`);
    console.log(`- Migrated roadmaps: ${stats.migratedRoadmaps}`);
    console.log(`- Total milestones: ${stats.totalMilestones}`);
    console.log(`- Migrated milestones: ${stats.migratedMilestones}`);
    
    if (stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      stats.errors.forEach(error => console.log(`- ${error}`));
    }

  } catch (error) {
    console.error('Migration failed:', error);
    stats.errors.push(String(error));
  }

  return stats;
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration, migrateRoadmap };