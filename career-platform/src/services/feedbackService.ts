import { db } from '@/config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { LevelFeedback } from '@/types/user';

class FeedbackService {
  private readonly COLLECTION_NAME = 'levelFeedback';

  /**
   * Submit feedback for a completed level
   */
  async submitLevelFeedback(
    userId: string,
    feedback: Omit<LevelFeedback, 'id' | 'userId' | 'createdAt'>
  ): Promise<string> {
    try {
      const feedbackData = {
        ...feedback,
        userId,
        createdAt: serverTimestamp(),
        completedAt: Timestamp.fromDate(feedback.completedAt)
      };

      const docRef = await addDoc(
        collection(db, this.COLLECTION_NAME),
        feedbackData
      );

      console.log('Level feedback submitted successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting level feedback:', error);
      throw new Error('Failed to submit level feedback');
    }
  }

  /**
   * Get all feedback for a specific user
   */
  async getUserFeedback(userId: string): Promise<LevelFeedback[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      })) as LevelFeedback[];
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      throw new Error('Failed to fetch user feedback');
    }
  }

  /**
   * Get feedback for a specific level from a user
   */
  async getUserLevelFeedback(
    userId: string,
    level: number
  ): Promise<LevelFeedback | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('level', '==', level)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || new Date()
      } as LevelFeedback;
    } catch (error) {
      console.error('Error fetching level feedback:', error);
      throw new Error('Failed to fetch level feedback');
    }
  }

  /**
   * Check if user has already submitted feedback for a level
   */
  async hasSubmittedFeedback(
    userId: string,
    level: number
  ): Promise<boolean> {
    try {
      const feedback = await this.getUserLevelFeedback(userId, level);
      return feedback !== null;
    } catch (error) {
      console.error('Error checking feedback submission:', error);
      return false;
    }
  }

  /**
   * Get aggregated feedback statistics for a level
   */
  async getLevelFeedbackStats(level: number, professionalField?: string) {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('level', '==', level)
      );

      if (professionalField) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('level', '==', level),
          where('professionalField', '==', professionalField)
        );
      }

      const snapshot = await getDocs(q);
      const feedbackList = snapshot.docs.map(doc => doc.data() as LevelFeedback);

      if (feedbackList.length === 0) {
        return null;
      }

      // Calculate statistics
      const stats = {
        totalResponses: feedbackList.length,
        averageOverallSatisfaction: 0,
        averageContentRelevance: 0,
        averageConfidenceLevel: 0,
        difficultyDistribution: {
          'too-easy': 0,
          'just-right': 0,
          'too-hard': 0
        },
        timeInvestmentDistribution: {
          'too-little': 0,
          'appropriate': 0,
          'too-much': 0
        },
        readyForNextPercentage: 0,
        commonSkillsImproved: [] as { skill: string; count: number }[],
        commonChallenges: [] as { challenge: string; count: number }[]
      };

      // Calculate averages and distributions
      let satisfactionSum = 0;
      let relevanceSum = 0;
      let confidenceSum = 0;
      let readyForNextCount = 0;
      const skillsMap = new Map<string, number>();
      const challengesMap = new Map<string, number>();

      feedbackList.forEach(feedback => {
        satisfactionSum += feedback.overallSatisfaction;
        relevanceSum += feedback.contentRelevance;
        confidenceSum += feedback.confidenceLevel;
        
        if (feedback.readyForNext) readyForNextCount++;
        
        stats.difficultyDistribution[feedback.difficultyLevel]++;
        stats.timeInvestmentDistribution[feedback.timeInvestment]++;

        // Aggregate skills
        feedback.skillsImproved?.forEach(skill => {
          skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
        });

        // Aggregate challenges
        feedback.challengingAreas?.forEach(challenge => {
          challengesMap.set(challenge, (challengesMap.get(challenge) || 0) + 1);
        });
      });

      stats.averageOverallSatisfaction = satisfactionSum / feedbackList.length;
      stats.averageContentRelevance = relevanceSum / feedbackList.length;
      stats.averageConfidenceLevel = confidenceSum / feedbackList.length;
      stats.readyForNextPercentage = (readyForNextCount / feedbackList.length) * 100;

      // Convert maps to sorted arrays
      stats.commonSkillsImproved = Array.from(skillsMap.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      stats.commonChallenges = Array.from(challengesMap.entries())
        .map(([challenge, count]) => ({ challenge, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return stats;
    } catch (error) {
      console.error('Error calculating feedback statistics:', error);
      throw new Error('Failed to calculate feedback statistics');
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();