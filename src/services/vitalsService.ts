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
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Vital record interface
export interface VitalRecord {
  id: string;
  patientId: string;
  recordedBy: string; // userId of who recorded it (patient, doctor, nurse)
  recordedByName?: string;
  date: string;
  time: string;
  type: VitalType;
  value: number;
  unit: string;
  notes?: string;
  isNormal: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Vital type enum
export type VitalType = 
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'heart_rate'
  | 'respiratory_rate'
  | 'temperature'
  | 'oxygen_saturation'
  | 'blood_glucose'
  | 'weight'
  | 'height'
  | 'bmi'
  | 'pain_level'
  | 'custom';

// Normal ranges for vitals
export const vitalRanges: Record<VitalType, { min: number; max: number; unit: string }> = {
  blood_pressure_systolic: { min: 90, max: 120, unit: 'mmHg' },
  blood_pressure_diastolic: { min: 60, max: 80, unit: 'mmHg' },
  heart_rate: { min: 60, max: 100, unit: 'bpm' },
  respiratory_rate: { min: 12, max: 20, unit: 'breaths/min' },
  temperature: { min: 36.1, max: 37.2, unit: '°C' },
  oxygen_saturation: { min: 95, max: 100, unit: '%' },
  blood_glucose: { min: 70, max: 140, unit: 'mg/dL' },
  weight: { min: 0, max: 500, unit: 'kg' }, // Wide range as it varies by individual
  height: { min: 0, max: 250, unit: 'cm' }, // Wide range as it varies by individual
  bmi: { min: 18.5, max: 24.9, unit: 'kg/m²' },
  pain_level: { min: 0, max: 3, unit: '/10' }, // 0-10 scale, but considering 0-3 as normal
  custom: { min: 0, max: 0, unit: '' } // Custom type doesn't have predefined ranges
};

// Check if a vital value is within normal range
export const isVitalNormal = (type: VitalType, value: number): boolean => {
  if (type === 'custom') {
    return true; // Custom vitals don't have predefined normal ranges
  }
  
  const range = vitalRanges[type];
  return value >= range.min && value <= range.max;
};

// Create a vital record
export const createVitalRecord = async (
  patientId: string,
  recordedBy: string,
  recordedByName: string,
  date: string,
  time: string,
  type: VitalType,
  value: number,
  unit?: string,
  notes?: string
): Promise<string> => {
  try {
    // Use predefined unit if not provided
    const finalUnit = unit || vitalRanges[type].unit;
    
    // Check if the vital is within normal range
    const isNormal = isVitalNormal(type, value);
    
    const vitalRef = await addDoc(collection(db, 'vitals'), {
      patientId,
      recordedBy,
      recordedByName,
      date,
      time,
      type,
      value,
      unit: finalUnit,
      notes,
      isNormal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return vitalRef.id;
  } catch (error) {
    console.error('Error creating vital record:', error);
    throw error;
  }
};

// Create blood pressure record (systolic and diastolic together)
export const createBloodPressureRecord = async (
  patientId: string,
  recordedBy: string,
  recordedByName: string,
  date: string,
  time: string,
  systolic: number,
  diastolic: number,
  notes?: string
): Promise<{ systolicId: string; diastolicId: string }> => {
  try {
    // Create systolic record
    const systolicId = await createVitalRecord(
      patientId,
      recordedBy,
      recordedByName,
      date,
      time,
      'blood_pressure_systolic',
      systolic,
      'mmHg',
      notes
    );
    
    // Create diastolic record
    const diastolicId = await createVitalRecord(
      patientId,
      recordedBy,
      recordedByName,
      date,
      time,
      'blood_pressure_diastolic',
      diastolic,
      'mmHg',
      notes
    );
    
    return { systolicId, diastolicId };
  } catch (error) {
    console.error('Error creating blood pressure record:', error);
    throw error;
  }
};

// Get a vital record by ID
export const getVitalRecord = async (vitalId: string): Promise<VitalRecord | null> => {
  try {
    const vitalDoc = await getDoc(doc(db, 'vitals', vitalId));
    
    if (!vitalDoc.exists()) {
      return null;
    }
    
    return {
      id: vitalDoc.id,
      ...vitalDoc.data()
    } as VitalRecord;
  } catch (error) {
    console.error('Error getting vital record:', error);
    throw error;
  }
};

// Get all vital records for a patient
export const getPatientVitals = async (
  patientId: string,
  type?: VitalType,
  startDate?: string,
  endDate?: string,
  limit_count: number = 100
): Promise<VitalRecord[]> => {
  try {
    let q;
    
    if (type && startDate && endDate) {
      q = query(
        collection(db, 'vitals'),
        where('patientId', '==', patientId),
        where('type', '==', type),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('time', 'desc'),
        limit(limit_count)
      );
    } else if (type) {
      q = query(
        collection(db, 'vitals'),
        where('patientId', '==', patientId),
        where('type', '==', type),
        orderBy('date', 'desc'),
        orderBy('time', 'desc'),
        limit(limit_count)
      );
    } else if (startDate && endDate) {
      q = query(
        collection(db, 'vitals'),
        where('patientId', '==', patientId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('time', 'desc'),
        limit(limit_count)
      );
    } else {
      q = query(
        collection(db, 'vitals'),
        where('patientId', '==', patientId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc'),
        limit(limit_count)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const vitals: VitalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      vitals.push({
        id: doc.id,
        ...doc.data()
      } as VitalRecord);
    });
    
    return vitals;
  } catch (error) {
    console.error('Error getting patient vitals:', error);
    throw error;
  }
};

// Get the latest vital record of a specific type for a patient
export const getLatestVital = async (patientId: string, type: VitalType): Promise<VitalRecord | null> => {
  try {
    const q = query(
      collection(db, 'vitals'),
      where('patientId', '==', patientId),
      where('type', '==', type),
      orderBy('date', 'desc'),
      orderBy('time', 'desc'),
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
    } as VitalRecord;
  } catch (error) {
    console.error('Error getting latest vital:', error);
    throw error;
  }
};

// Get the latest blood pressure reading for a patient
export const getLatestBloodPressure = async (patientId: string): Promise<{ systolic: VitalRecord | null; diastolic: VitalRecord | null }> => {
  try {
    const systolic = await getLatestVital(patientId, 'blood_pressure_systolic');
    const diastolic = await getLatestVital(patientId, 'blood_pressure_diastolic');
    
    return { systolic, diastolic };
  } catch (error) {
    console.error('Error getting latest blood pressure:', error);
    throw error;
  }
};

// Update a vital record
export const updateVitalRecord = async (vitalId: string, updates: Partial<VitalRecord>): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    // If value or type is updated, recalculate isNormal
    if (updates.value !== undefined || updates.type !== undefined) {
      const vitalDoc = await getDoc(doc(db, 'vitals', vitalId));
      
      if (vitalDoc.exists()) {
        const currentData = vitalDoc.data();
        const type = updates.type || currentData.type;
        const value = updates.value !== undefined ? updates.value : currentData.value;
        
        updatesWithoutId.isNormal = isVitalNormal(type as VitalType, value);
      }
    }
    
    await updateDoc(doc(db, 'vitals', vitalId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating vital record:', error);
    throw error;
  }
};

// Delete a vital record
export const deleteVitalRecord = async (vitalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'vitals', vitalId));
  } catch (error) {
    console.error('Error deleting vital record:', error);
    throw error;
  }
};

// Get vital statistics for a patient
export const getVitalStatistics = async (
  patientId: string,
  type: VitalType,
  startDate?: string,
  endDate?: string
): Promise<{ min: number; max: number; avg: number; count: number; abnormalCount: number }> => {
  try {
    const vitals = await getPatientVitals(patientId, type, startDate, endDate, 1000);
    
    if (vitals.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0, abnormalCount: 0 };
    }
    
    const values = vitals.map(vital => vital.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const abnormalCount = vitals.filter(vital => !vital.isNormal).length;
    
    return {
      min,
      max,
      avg,
      count: vitals.length,
      abnormalCount
    };
  } catch (error) {
    console.error('Error getting vital statistics:', error);
    throw error;
  }
};

// Get BMI for a patient
export const calculateBMI = async (patientId: string): Promise<number | null> => {
  try {
    const latestWeight = await getLatestVital(patientId, 'weight');
    const latestHeight = await getLatestVital(patientId, 'height');
    
    if (!latestWeight || !latestHeight) {
      return null;
    }
    
    // Convert height from cm to m
    const heightInMeters = latestHeight.value / 100;
    
    // Calculate BMI: weight (kg) / (height (m) * height (m))
    const bmi = latestWeight.value / (heightInMeters * heightInMeters);
    
    // Round to 1 decimal place
    return Math.round(bmi * 10) / 10;
  } catch (error) {
    console.error('Error calculating BMI:', error);
    throw error;
  }
};

// Record BMI for a patient
export const recordBMI = async (
  patientId: string,
  recordedBy: string,
  recordedByName: string
): Promise<string | null> => {
  try {
    const bmi = await calculateBMI(patientId);
    
    if (bmi === null) {
      return null;
    }
    
    const today = new Date();
    const date = today.toISOString().split('T')[0];
    const time = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    return await createVitalRecord(
      patientId,
      recordedBy,
      recordedByName,
      date,
      time,
      'bmi',
      bmi,
      'kg/m²',
      'Automatically calculated from latest weight and height'
    );
  } catch (error) {
    console.error('Error recording BMI:', error);
    throw error;
  }
};

// Get vital trends for a patient
export const getVitalTrends = async (
  patientId: string,
  type: VitalType,
  period: 'week' | 'month' | 'year',
  endDate?: string
): Promise<{ date: string; value: number }[]> => {
  try {
    // Calculate start date based on period
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(end);
    
    if (period === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    // Get vitals for the period
    const vitals = await getPatientVitals(patientId, type, startDateStr, endDateStr, 1000);
    
    // Group by date and calculate average for each date
    const dateMap = new Map<string, { sum: number; count: number }>();
    
    vitals.forEach(vital => {
      if (!dateMap.has(vital.date)) {
        dateMap.set(vital.date, { sum: 0, count: 0 });
      }
      
      const dateData = dateMap.get(vital.date)!;
      dateData.sum += vital.value;
      dateData.count += 1;
    });
    
    // Convert to array of { date, value } objects
    const trends = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      value: data.sum / data.count
    }));
    
    // Sort by date
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting vital trends:', error);
    throw error;
  }
};