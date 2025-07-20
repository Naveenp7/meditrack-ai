import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Feedback interface
export interface Feedback {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'doctor' | 'patient' | 'app';
  rating: number; // 1-5 stars
  comment?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create feedback
export const createFeedback = async (
  userId: string,
  targetId: string,
  targetType: 'doctor' | 'patient' | 'app',
  rating: number,
  comment?: string,
  isAnonymous: boolean = false
): Promise<string> => {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Check if user has already submitted feedback for this target
    const existingFeedback = await getUserFeedbackForTarget(userId, targetId);
    
    if (existingFeedback) {
      // Update existing feedback instead of creating new
      await updateFeedback(existingFeedback.id, rating, comment);
      return existingFeedback.id;
    }
    
    // Create new feedback
    const feedbackRef = await addDoc(collection(db, 'feedback'), {
      userId,
      targetId,
      targetType,
      rating,
      comment,
      isAnonymous,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update average rating for the target
    await updateAverageRating(targetId, targetType);
    
    return feedbackRef.id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

// Get feedback by ID
export const getFeedback = async (feedbackId: string): Promise<Feedback | null> => {
  try {
    const feedbackDoc = await getDoc(doc(db, 'feedback', feedbackId));
    
    if (!feedbackDoc.exists()) {
      return null;
    }
    
    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data()
    } as Feedback;
  } catch (error) {
    console.error('Error getting feedback:', error);
    throw error;
  }
};

// Get all feedback for a target
export const getTargetFeedback = async (
  targetId: string,
  targetType: 'doctor' | 'patient' | 'app',
  limitCount?: number
): Promise<Feedback[]> => {
  try {
    let q;
    
    if (limitCount !== undefined) {
      q = query(
        collection(db, 'feedback'),
        where('targetId', '==', targetId),
        where('targetType', '==', targetType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'feedback'),
        where('targetId', '==', targetId),
        where('targetType', '==', targetType),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const feedback: Feedback[] = [];
    
    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data()
      } as Feedback);
    });
    
    return feedback;
  } catch (error) {
    console.error('Error getting target feedback:', error);
    throw error;
  }
};

// Get feedback submitted by a user
export const getUserFeedback = async (userId: string): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const feedback: Feedback[] = [];
    
    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data()
      } as Feedback);
    });
    
    return feedback;
  } catch (error) {
    console.error('Error getting user feedback:', error);
    throw error;
  }
};

// Get feedback submitted by a user for a specific target
export const getUserFeedbackForTarget = async (userId: string, targetId: string): Promise<Feedback | null> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('userId', '==', userId),
      where('targetId', '==', targetId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const feedbackDoc = querySnapshot.docs[0];
    
    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data()
    } as Feedback;
  } catch (error) {
    console.error('Error getting user feedback for target:', error);
    throw error;
  }
};

// Update feedback
export const updateFeedback = async (
  feedbackId: string,
  rating?: number,
  comment?: string
): Promise<void> => {
  try {
    const feedbackDoc = await getDoc(doc(db, 'feedback', feedbackId));
    
    if (!feedbackDoc.exists()) {
      throw new Error('Feedback not found');
    }
    
    const feedbackData = feedbackDoc.data() as Feedback;
    
    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const updates: any = {
      updatedAt: serverTimestamp()
    };
    
    if (rating !== undefined) {
      updates.rating = rating;
    }
    
    if (comment !== undefined) {
      updates.comment = comment;
    }
    
    await updateDoc(doc(db, 'feedback', feedbackId), updates);
    
    // Update average rating for the target
    await updateAverageRating(feedbackData.targetId, feedbackData.targetType);
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
};

// Delete feedback
export const deleteFeedback = async (feedbackId: string): Promise<void> => {
  try {
    const feedbackDoc = await getDoc(doc(db, 'feedback', feedbackId));
    
    if (!feedbackDoc.exists()) {
      throw new Error('Feedback not found');
    }
    
    const feedbackData = feedbackDoc.data() as Feedback;
    
    await deleteDoc(doc(db, 'feedback', feedbackId));
    
    // Update average rating for the target
    await updateAverageRating(feedbackData.targetId, feedbackData.targetType);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

// Get average rating for a target
export const getAverageRating = async (targetId: string, targetType: 'doctor' | 'patient' | 'app'): Promise<{
  average: number;
  count: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        average: 0,
        count: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      };
    }
    
    let sum = 0;
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    
    querySnapshot.forEach((doc) => {
      const rating = doc.data().rating;
      sum += rating;
      distribution[rating as keyof typeof distribution]++;
    });
    
    const count = querySnapshot.size;
    const average = sum / count;
    
    return {
      average,
      count,
      distribution
    };
  } catch (error) {
    console.error('Error getting average rating:', error);
    throw error;
  }
};

// Update average rating for a target
const updateAverageRating = async (targetId: string, targetType: 'doctor' | 'patient' | 'app'): Promise<void> => {
  try {
    const { average, count } = await getAverageRating(targetId, targetType);
    
    // Update the target's rating in the appropriate collection
    if (targetType === 'doctor' || targetType === 'patient') {
      await updateDoc(doc(db, 'users', targetId), {
        rating: average,
        ratingCount: count,
        updatedAt: serverTimestamp()
      });
    } else if (targetType === 'app') {
      // For app-wide ratings, store in a separate document
      await updateDoc(doc(db, 'appMetrics', 'ratings'), {
        averageRating: average,
        ratingCount: count,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating average rating:', error);
    throw error;
  }
};

// Get recent feedback
export const getRecentFeedback = async (limitCount: number = 10): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    const feedback: Feedback[] = [];
    
    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data()
      } as Feedback);
    });
    
    return feedback;
  } catch (error) {
    console.error('Error getting recent feedback:', error);
    throw error;
  }
};

// Get feedback statistics
export const getFeedbackStatistics = async (): Promise<{
  totalFeedback: number;
  averageRating: number;
  doctorAverageRating: number;
  appAverageRating: number;
}> => {
  try {
    // Get all feedback
    const allFeedbackQuery = query(collection(db, 'feedback'));
    const allFeedbackSnapshot = await getDocs(allFeedbackQuery);
    
    // Get doctor feedback
    const doctorFeedbackQuery = query(
      collection(db, 'feedback'),
      where('targetType', '==', 'doctor')
    );
    const doctorFeedbackSnapshot = await getDocs(doctorFeedbackQuery);
    
    // Get app feedback
    const appFeedbackQuery = query(
      collection(db, 'feedback'),
      where('targetType', '==', 'app')
    );
    const appFeedbackSnapshot = await getDocs(appFeedbackQuery);
    
    // Calculate statistics
    let totalRating = 0;
    let doctorTotalRating = 0;
    let appTotalRating = 0;
    
    allFeedbackSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
    });
    
    doctorFeedbackSnapshot.forEach(doc => {
      doctorTotalRating += doc.data().rating;
    });
    
    appFeedbackSnapshot.forEach(doc => {
      appTotalRating += doc.data().rating;
    });
    
    const totalFeedback = allFeedbackSnapshot.size;
    const averageRating = totalFeedback > 0 ? totalRating / totalFeedback : 0;
    const doctorAverageRating = doctorFeedbackSnapshot.size > 0 ? doctorTotalRating / doctorFeedbackSnapshot.size : 0;
    const appAverageRating = appFeedbackSnapshot.size > 0 ? appTotalRating / appFeedbackSnapshot.size : 0;
    
    return {
      totalFeedback,
      averageRating,
      doctorAverageRating,
      appAverageRating
    };
  } catch (error) {
    console.error('Error getting feedback statistics:', error);
    throw error;
  }
};