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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { HealthInsight, WellnessRoutine } from '../types';
import { generateHealthInsights, generateWellnessRoutine } from '../utils/aiUtils';

// Generate and store health insights for a patient
export const createHealthInsights = async (patientId: string): Promise<string[]> => {
  try {
    // Generate insights using AI
    const { insights } = await generateHealthInsights(patientId);
    
    const insightIds: string[] = [];
    
    // Store each insight in Firestore
    for (const insight of insights) {
      const insightRef = await addDoc(collection(db, 'healthInsights'), {
        patientId,
        generatedDate: new Date().toISOString(),
        ...insight,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      insightIds.push(insightRef.id);
    }
    
    return insightIds;
  } catch (error) {
    console.error('Error creating health insights:', error);
    throw error;
  }
};

// Get all health insights for a patient
export const getPatientHealthInsights = async (patientId: string): Promise<HealthInsight[]> => {
  try {
    const q = query(
      collection(db, 'healthInsights'),
      where('patientId', '==', patientId),
      orderBy('generatedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const insights: HealthInsight[] = [];
    
    querySnapshot.forEach((doc) => {
      insights.push({
        id: doc.id,
        ...doc.data()
      } as HealthInsight);
    });
    
    return insights;
  } catch (error) {
    console.error('Error getting patient health insights:', error);
    throw error;
  }
};

// Get latest health insights for a patient
export const getLatestHealthInsights = async (patientId: string, count: number = 3): Promise<HealthInsight[]> => {
  try {
    const q = query(
      collection(db, 'healthInsights'),
      where('patientId', '==', patientId),
      orderBy('generatedDate', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    
    const insights: HealthInsight[] = [];
    
    querySnapshot.forEach((doc) => {
      insights.push({
        id: doc.id,
        ...doc.data()
      } as HealthInsight);
    });
    
    return insights;
  } catch (error) {
    console.error('Error getting latest health insights:', error);
    throw error;
  }
};

// Generate and store wellness routine for a patient
export const createWellnessRoutine = async (patientId: string, conditions: string[]): Promise<string> => {
  try {
    // Generate wellness routine using AI
    const routine = await generateWellnessRoutine(patientId, conditions);
    
    // Store wellness routine in Firestore
    const routineRef = await addDoc(collection(db, 'wellnessRoutines'), {
      patientId,
      generatedDate: new Date().toISOString(),
      ...routine,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return routineRef.id;
  } catch (error) {
    console.error('Error creating wellness routine:', error);
    throw error;
  }
};

// Get the latest wellness routine for a patient
export const getLatestWellnessRoutine = async (patientId: string): Promise<WellnessRoutine | null> => {
  try {
    const q = query(
      collection(db, 'wellnessRoutines'),
      where('patientId', '==', patientId),
      orderBy('generatedDate', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    
    return {
      id: doc.id,
      ...doc.data()
    } as WellnessRoutine;
  } catch (error) {
    console.error('Error getting latest wellness routine:', error);
    throw error;
  }
};

// Get all wellness routines for a patient
export const getPatientWellnessRoutines = async (patientId: string): Promise<WellnessRoutine[]> => {
  try {
    const q = query(
      collection(db, 'wellnessRoutines'),
      where('patientId', '==', patientId),
      orderBy('generatedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const routines: WellnessRoutine[] = [];
    
    querySnapshot.forEach((doc) => {
      routines.push({
        id: doc.id,
        ...doc.data()
      } as WellnessRoutine);
    });
    
    return routines;
  } catch (error) {
    console.error('Error getting patient wellness routines:', error);
    throw error;
  }
};