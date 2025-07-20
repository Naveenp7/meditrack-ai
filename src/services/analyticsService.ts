import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ActivityLog } from '../types';

// Log user activity
export const logActivity = async (
  userId: string,
  userRole: 'doctor' | 'patient' | 'admin',
  action: 'view' | 'create' | 'update' | 'delete' | 'login' | 'logout' | 'emergency-access',
  resourceType: 'medical-record' | 'appointment' | 'user' | 'prescription',
  resourceId?: string,
  details?: string
): Promise<string> => {
  try {
    const ipAddress = await fetchIPAddress();
    
    const activityRef = await addDoc(collection(db, 'activityLogs'), {
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      timestamp: serverTimestamp()
    });
    
    return activityRef.id;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Helper function to get IP address
const fetchIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return 'unknown';
  }
};

// Get user activity logs
export const getUserActivityLogs = async (userId: string, limitCount?: number): Promise<ActivityLog[]> => {
  try {
    let q;
    
    if (limitCount) {
      q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const logs: ActivityLog[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      } as ActivityLog);
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting user activity logs:', error);
    throw error;
  }
};

// Get resource access logs
export const getResourceAccessLogs = async (
  resourceType: 'medical-record' | 'appointment' | 'user' | 'prescription',
  resourceId: string
): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('resourceType', '==', resourceType),
      where('resourceId', '==', resourceId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const logs: ActivityLog[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      } as ActivityLog);
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting resource access logs:', error);
    throw error;
  }
};

// Get emergency access logs
export const getEmergencyAccessLogs = async (): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('action', '==', 'emergency-access'),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const logs: ActivityLog[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      } as ActivityLog);
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting emergency access logs:', error);
    throw error;
  }
};

// Get patient health analytics
export const getPatientHealthAnalytics = async (patientId: string): Promise<{
  consultationCount: number;
  testResultCount: number;
  prescriptionCount: number;
  appointmentCount: number;
  appointmentCompletionRate: number;
  recentVitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenLevel?: number;
    glucoseLevel?: number;
    recordedAt?: Timestamp;
  };
}> => {
  try {
    // Get medical records count by type
    const consultationCount = await getMedicalRecordCountByType(patientId, 'consultation');
    const testResultCount = await getMedicalRecordCountByType(patientId, 'test');
    const prescriptionCount = await getMedicalRecordCountByType(patientId, 'prescription');
    
    // Get appointment statistics
    const appointmentStats = await getAppointmentStatistics(patientId);
    
    // Get recent vitals
    const recentVitals = await getRecentVitals(patientId);
    
    return {
      consultationCount,
      testResultCount,
      prescriptionCount,
      appointmentCount: appointmentStats.total,
      appointmentCompletionRate: appointmentStats.completionRate,
      recentVitals
    };
  } catch (error) {
    console.error('Error getting patient health analytics:', error);
    throw error;
  }
};

// Helper function to get medical record count by type
const getMedicalRecordCountByType = async (patientId: string, type: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', patientId),
      where('type', '==', type)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error(`Error getting ${type} count:`, error);
    throw error;
  }
};

// Helper function to get appointment statistics
const getAppointmentStatistics = async (patientId: string): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let total = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    
    querySnapshot.forEach((doc) => {
      const appointment = doc.data();
      total++;
      
      if (appointment.status === 'completed') {
        completed++;
      } else if (appointment.status === 'cancelled') {
        cancelled++;
      } else if (appointment.status === 'no-show') {
        noShow++;
      }
    });
    
    // Calculate completion rate (completed appointments / total non-cancelled appointments)
    const completionRate = total - cancelled > 0 
      ? (completed / (total - cancelled)) * 100 
      : 0;
    
    return {
      total,
      completed,
      cancelled,
      noShow,
      completionRate
    };
  } catch (error) {
    console.error('Error getting appointment statistics:', error);
    throw error;
  }
};

// Helper function to get recent vitals
const getRecentVitals = async (patientId: string): Promise<{
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenLevel?: number;
  glucoseLevel?: number;
  recordedAt?: Timestamp;
} | undefined> => {
  try {
    // Query for test results that might contain vitals
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', patientId),
      where('type', '==', 'test'),
      orderBy('date', 'desc'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return undefined;
    }
    
    // Look for vitals in recent test results
    let vitals: any = {};
    
    for (const doc of querySnapshot.docs) {
      const testResult = doc.data() as DocumentData;
      
      if (testResult.results && Array.isArray(testResult.results)) {
        for (const result of testResult.results) {
          if (result.parameter.toLowerCase().includes('blood pressure') && !vitals.bloodPressure) {
            vitals.bloodPressure = result.value;
          } else if (result.parameter.toLowerCase().includes('heart rate') && !vitals.heartRate) {
            vitals.heartRate = parseFloat(result.value);
          } else if (result.parameter.toLowerCase().includes('temperature') && !vitals.temperature) {
            vitals.temperature = parseFloat(result.value);
          } else if (result.parameter.toLowerCase().includes('oxygen') && !vitals.oxygenLevel) {
            vitals.oxygenLevel = parseFloat(result.value);
          } else if (result.parameter.toLowerCase().includes('glucose') && !vitals.glucoseLevel) {
            vitals.glucoseLevel = parseFloat(result.value);
          }
        }
      }
      
      // If we found all vitals, add the timestamp and break
      if (vitals.bloodPressure && vitals.heartRate && vitals.temperature && 
          vitals.oxygenLevel && vitals.glucoseLevel) {
        vitals.recordedAt = testResult.createdAt;
        break;
      }
    }
    
    return Object.keys(vitals).length > 0 ? vitals : undefined;
  } catch (error) {
    console.error('Error getting recent vitals:', error);
    return undefined;
  }
};

// Get doctor performance analytics
export const getDoctorPerformanceAnalytics = async (doctorId: string): Promise<{
  patientCount: number;
  appointmentCount: number;
  appointmentCompletionRate: number;
  averageAppointmentsPerDay: number;
  consultationCount: number;
  prescriptionCount: number;
}> => {
  try {
    // Get patient count
    const patientCount = await getDoctorPatientCount(doctorId);
    
    // Get appointment statistics
    const appointmentStats = await getDoctorAppointmentStatistics(doctorId);
    
    // Get medical records count by type
    const consultationCount = await getDoctorMedicalRecordCountByType(doctorId, 'consultation');
    const prescriptionCount = await getDoctorMedicalRecordCountByType(doctorId, 'prescription');
    
    return {
      patientCount,
      appointmentCount: appointmentStats.total,
      appointmentCompletionRate: appointmentStats.completionRate,
      averageAppointmentsPerDay: appointmentStats.averagePerDay,
      consultationCount,
      prescriptionCount
    };
  } catch (error) {
    console.error('Error getting doctor performance analytics:', error);
    throw error;
  }
};

// Helper function to get doctor's patient count
const getDoctorPatientCount = async (doctorId: string): Promise<number> => {
  try {
    const doctorDoc = await getDoc(doc(db, 'users', doctorId));
    
    if (!doctorDoc.exists()) {
      throw new Error('Doctor not found');
    }
    
    const doctorData = doctorDoc.data();
    const patients = doctorData.patients || [];
    
    return patients.length;
  } catch (error) {
    console.error('Error getting doctor patient count:', error);
    throw error;
  }
};

// Helper function to get doctor's appointment statistics
const getDoctorAppointmentStatistics = async (doctorId: string): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  averagePerDay: number;
}> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let total = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    
    // Track appointments by date
    const appointmentsByDate: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const appointment = doc.data();
      total++;
      
      // Count by status
      if (appointment.status === 'completed') {
        completed++;
      } else if (appointment.status === 'cancelled') {
        cancelled++;
      } else if (appointment.status === 'no-show') {
        noShow++;
      }
      
      // Count by date
      if (appointment.date) {
        appointmentsByDate[appointment.date] = (appointmentsByDate[appointment.date] || 0) + 1;
      }
    });
    
    // Calculate completion rate
    const completionRate = total - cancelled > 0 
      ? (completed / (total - cancelled)) * 100 
      : 0;
    
    // Calculate average appointments per day
    const uniqueDaysWithAppointments = Object.keys(appointmentsByDate).length;
    const averagePerDay = uniqueDaysWithAppointments > 0 
      ? total / uniqueDaysWithAppointments 
      : 0;
    
    return {
      total,
      completed,
      cancelled,
      noShow,
      completionRate,
      averagePerDay
    };
  } catch (error) {
    console.error('Error getting doctor appointment statistics:', error);
    throw error;
  }
};

// Helper function to get doctor's medical record count by type
const getDoctorMedicalRecordCountByType = async (doctorId: string, type: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'medicalRecords'),
      where('doctorId', '==', doctorId),
      where('type', '==', type)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error(`Error getting doctor ${type} count:`, error);
    throw error;
  }
};