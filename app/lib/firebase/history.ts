import { db } from './config';
import { Recommendation, MoodAnalysis } from '@/app/types';

// Save a recommendation session to history
export async function saveRecommendationHistory(
  userId: string, 
  recommendations: Recommendation[], 
  mood: MoodAnalysis
) {
  try {
    const historyRef = db.collection('users').doc(userId).collection('history');
    
    // Add to history with timestamp
    await historyRef.add({
      recommendations,
      mood,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving history:', error);
    return { success: false };
  }
}

// Get recommendation history for a user
export async function getRecommendationHistory(userId: string, limit = 10) {
  try {
    const historyRef = db.collection('users').doc(userId).collection('history');
    
    // Get history, ordered by timestamp
    const querySnapshot = await historyRef
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    // Convert to array of history items
    const history = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        recommendations: data.recommendations,
        mood: data.mood,
        timestamp: data.timestamp
      };
    });
    
    return { success: true, history };
  } catch (error) {
    console.error('Error getting history:', error);
    return { success: false, history: [] };
  }
}

// Delete a history item
export async function deleteHistoryItem(userId: string, historyId: string) {
  try {
    const historyRef = db.collection('users').doc(userId).collection('history').doc(historyId);
    
    // Delete the document
    await historyRef.delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting history item:', error);
    return { success: false };
  }
}