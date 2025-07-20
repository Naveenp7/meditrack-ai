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
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createMedicationReminder } from './reminderService';

// Medication interface
export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  sideEffects?: string[];
  warnings?: string[];
  interactions?: string[];
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a medication record
export const createMedication = async (
  name: string,
  dosage: string,
  frequency: string,
  route: string,
  startDate: string,
  prescriptionId: string,
  patientId: string,
  doctorId: string,
  endDate?: string,
  genericName?: string,
  instructions?: string,
  sideEffects?: string[],
  warnings?: string[],
  interactions?: string[],
  createReminders: boolean = true
): Promise<string> => {
  try {
    const medicationRef = await addDoc(collection(db, 'medications'), {
      name,
      genericName,
      dosage,
      frequency,
      route,
      startDate,
      endDate,
      instructions,
      sideEffects: sideEffects || [],
      warnings: warnings || [],
      interactions: interactions || [],
      prescriptionId,
      patientId,
      doctorId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // If createReminders is true, create medication reminders
    if (createReminders) {
      // Parse frequency to determine times
      const times = parseFrequencyToTimes(frequency);
      
      // Create reminders
      await createMedicationReminder(
        patientId,
        name,
        dosage,
        frequency,
        startDate,
        endDate || calculateDefaultEndDate(startDate, 30), // Default to 30 days if no end date
        times,
        prescriptionId
      );
    }
    
    return medicationRef.id;
  } catch (error) {
    console.error('Error creating medication:', error);
    throw error;
  }
};

// Helper function to parse frequency string to times array
const parseFrequencyToTimes = (frequency: string): string[] => {
  const times: string[] = [];
  const lowerFreq = frequency.toLowerCase();
  
  // Common frequency patterns
  if (lowerFreq.includes('once daily') || lowerFreq.includes('once a day')) {
    if (lowerFreq.includes('morning')) {
      times.push('08:00');
    } else if (lowerFreq.includes('evening') || lowerFreq.includes('night')) {
      times.push('20:00');
    } else {
      times.push('09:00');
    }
  } else if (lowerFreq.includes('twice daily') || lowerFreq.includes('twice a day') || lowerFreq.includes('bid')) {
    times.push('09:00', '21:00');
  } else if (lowerFreq.includes('three times daily') || lowerFreq.includes('thrice daily') || lowerFreq.includes('tid')) {
    times.push('09:00', '14:00', '21:00');
  } else if (lowerFreq.includes('four times daily') || lowerFreq.includes('qid')) {
    times.push('08:00', '12:00', '16:00', '20:00');
  } else if (lowerFreq.includes('every morning')) {
    times.push('08:00');
  } else if (lowerFreq.includes('every evening') || lowerFreq.includes('every night')) {
    times.push('20:00');
  } else if (lowerFreq.includes('with meals')) {
    times.push('08:00', '13:00', '19:00');
  } else if (lowerFreq.includes('before meals')) {
    times.push('07:30', '12:30', '18:30');
  } else if (lowerFreq.includes('after meals')) {
    times.push('08:30', '13:30', '19:30');
  } else if (lowerFreq.includes('every') && lowerFreq.includes('hours')) {
    // Extract hours from "every X hours"
    const match = lowerFreq.match(/every\s+(\d+)\s+hours/);
    if (match && match[1]) {
      const hours = parseInt(match[1]);
      if (hours > 0 && hours <= 24) {
        for (let i = 0; i < 24; i += hours) {
          times.push(`${String(i).padStart(2, '0')}:00`);
        }
      }
    }
  } else {
    // Default to once daily in the morning
    times.push('09:00');
  }
  
  return times;
};

// Helper function to calculate default end date
const calculateDefaultEndDate = (startDate: string, daysToAdd: number): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

// Get a medication by ID
export const getMedication = async (medicationId: string): Promise<Medication | null> => {
  try {
    const medicationDoc = await getDoc(doc(db, 'medications', medicationId));
    
    if (!medicationDoc.exists()) {
      return null;
    }
    
    return {
      id: medicationDoc.id,
      ...medicationDoc.data()
    } as Medication;
  } catch (error) {
    console.error('Error getting medication:', error);
    throw error;
  }
};

// Get all medications for a patient
export const getPatientMedications = async (patientId: string, status?: 'active' | 'completed' | 'cancelled'): Promise<Medication[]> => {
  try {
    let q;
    
    if (status) {
      q = query(
        collection(db, 'medications'),
        where('patientId', '==', patientId),
        where('status', '==', status),
        orderBy('startDate', 'desc')
      );
    } else {
      q = query(
        collection(db, 'medications'),
        where('patientId', '==', patientId),
        orderBy('startDate', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const medications: Medication[] = [];
    
    querySnapshot.forEach((doc) => {
      medications.push({
        id: doc.id,
        ...doc.data()
      } as Medication);
    });
    
    return medications;
  } catch (error) {
    console.error('Error getting patient medications:', error);
    throw error;
  }
};

// Get active medications for a patient
export const getPatientActiveMedications = async (patientId: string): Promise<Medication[]> => {
  return getPatientMedications(patientId, 'active');
};

// Get medications by prescription ID
export const getMedicationsByPrescription = async (prescriptionId: string): Promise<Medication[]> => {
  try {
    const q = query(
      collection(db, 'medications'),
      where('prescriptionId', '==', prescriptionId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const medications: Medication[] = [];
    
    querySnapshot.forEach((doc) => {
      medications.push({
        id: doc.id,
        ...doc.data()
      } as Medication);
    });
    
    return medications;
  } catch (error) {
    console.error('Error getting medications by prescription:', error);
    throw error;
  }
};

// Update a medication
export const updateMedication = async (medicationId: string, updates: Partial<Medication>): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    await updateDoc(doc(db, 'medications', medicationId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Mark a medication as completed
export const completeMedication = async (medicationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'medications', medicationId), {
      status: 'completed',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error completing medication:', error);
    throw error;
  }
};

// Cancel a medication
export const cancelMedication = async (medicationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'medications', medicationId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error cancelling medication:', error);
    throw error;
  }
};

// Delete a medication
export const deleteMedication = async (medicationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'medications', medicationId));
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

// Medication adherence interface
export interface MedicationAdherence {
  id: string;
  medicationId: string;
  patientId: string;
  date: string;
  time: string;
  taken: boolean;
  skipped: boolean;
  skipReason?: string;
  notes?: string;
  createdAt: Timestamp;
}

// Record medication adherence
export const recordMedicationAdherence = async (
  medicationId: string,
  patientId: string,
  date: string,
  time: string,
  taken: boolean,
  skipped: boolean = false,
  skipReason?: string,
  notes?: string
): Promise<string> => {
  try {
    const adherenceRef = await addDoc(collection(db, 'medicationAdherence'), {
      medicationId,
      patientId,
      date,
      time,
      taken,
      skipped,
      skipReason,
      notes,
      createdAt: serverTimestamp()
    });
    
    return adherenceRef.id;
  } catch (error) {
    console.error('Error recording medication adherence:', error);
    throw error;
  }
};

// Get medication adherence records for a patient
export const getPatientMedicationAdherence = async (
  patientId: string,
  startDate?: string,
  endDate?: string
): Promise<MedicationAdherence[]> => {
  try {
    let q;
    
    if (startDate && endDate) {
      q = query(
        collection(db, 'medicationAdherence'),
        where('patientId', '==', patientId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    } else {
      q = query(
        collection(db, 'medicationAdherence'),
        where('patientId', '==', patientId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const adherenceRecords: MedicationAdherence[] = [];
    
    querySnapshot.forEach((doc) => {
      adherenceRecords.push({
        id: doc.id,
        ...doc.data()
      } as MedicationAdherence);
    });
    
    return adherenceRecords;
  } catch (error) {
    console.error('Error getting patient medication adherence:', error);
    throw error;
  }
};

// Get medication adherence records for a specific medication
export const getMedicationAdherence = async (
  medicationId: string,
  startDate?: string,
  endDate?: string
): Promise<MedicationAdherence[]> => {
  try {
    let q;
    
    if (startDate && endDate) {
      q = query(
        collection(db, 'medicationAdherence'),
        where('medicationId', '==', medicationId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    } else {
      q = query(
        collection(db, 'medicationAdherence'),
        where('medicationId', '==', medicationId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const adherenceRecords: MedicationAdherence[] = [];
    
    querySnapshot.forEach((doc) => {
      adherenceRecords.push({
        id: doc.id,
        ...doc.data()
      } as MedicationAdherence);
    });
    
    return adherenceRecords;
  } catch (error) {
    console.error('Error getting medication adherence:', error);
    throw error;
  }
};

// Calculate medication adherence rate
export const calculateAdherenceRate = async (
  patientId: string,
  medicationId?: string,
  startDate?: string,
  endDate?: string
): Promise<number> => {
  try {
    let adherenceRecords;
    
    if (medicationId) {
      adherenceRecords = await getMedicationAdherence(medicationId, startDate, endDate);
    } else {
      adherenceRecords = await getPatientMedicationAdherence(patientId, startDate, endDate);
    }
    
    if (adherenceRecords.length === 0) {
      return 0;
    }
    
    const takenCount = adherenceRecords.filter(record => record.taken).length;
    
    return (takenCount / adherenceRecords.length) * 100;
  } catch (error) {
    console.error('Error calculating adherence rate:', error);
    throw error;
  }
};

// Medication interaction check
export const checkMedicationInteractions = async (medications: string[]): Promise<string[]> => {
  try {
    // This is a placeholder for a real medication interaction API
    // In a real application, you would call an external API or use a database of interactions
    
    // For now, we'll return a mock response
    if (medications.length < 2) {
      return [];
    }
    
    // Mock some common interactions
    const commonInteractions: Record<string, string[]> = {
      'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel'],
      'simvastatin': ['clarithromycin', 'erythromycin', 'itraconazole', 'ketoconazole'],
      'lisinopril': ['spironolactone', 'potassium supplements'],
      'fluoxetine': ['tramadol', 'sumatriptan', 'rizatriptan'],
      'metformin': ['furosemide', 'hydrochlorothiazide']
    };
    
    const interactions: string[] = [];
    
    // Check for interactions
    for (let i = 0; i < medications.length; i++) {
      const med1 = medications[i].toLowerCase();
      
      for (let j = i + 1; j < medications.length; j++) {
        const med2 = medications[j].toLowerCase();
        
        // Check if med1 interacts with med2
        if (commonInteractions[med1] && commonInteractions[med1].includes(med2)) {
          interactions.push(`${med1} may interact with ${med2}`);
        }
        
        // Check if med2 interacts with med1
        if (commonInteractions[med2] && commonInteractions[med2].includes(med1)) {
          interactions.push(`${med2} may interact with ${med1}`);
        }
      }
    }
    
    return interactions;
  } catch (error) {
    console.error('Error checking medication interactions:', error);
    throw error;
  }
};