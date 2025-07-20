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
import { EmergencyAccess } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Request emergency access to patient records
export const requestEmergencyAccess = async (
  patientId: string,
  requesterId: string,
  requesterRole: 'doctor' | 'admin',
  reason: string,
  durationHours: number = 24 // Default to 24 hours
): Promise<string> => {
  try {
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);
    
    // Create emergency access request
    const emergencyAccessRef = await addDoc(collection(db, 'emergencyAccess'), {
      patientId,
      grantedToId: requesterId,
      grantedToRole: requesterRole,
      grantedById: null, // Will be updated when approved
      reason,
      timestamp: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: false, // Initially inactive until approved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return emergencyAccessRef.id;
  } catch (error) {
    console.error('Error requesting emergency access:', error);
    throw error;
  }
};

// Approve emergency access request
export const approveEmergencyAccess = async (
  emergencyAccessId: string,
  approverId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'emergencyAccess', emergencyAccessId), {
      grantedById: approverId,
      isActive: true,
      updatedAt: serverTimestamp()
    });
    
    // Create activity log for this approval
    await addDoc(collection(db, 'activityLogs'), {
      userId: approverId,
      userRole: 'admin', // Assuming only admins can approve
      action: 'emergency-access',
      resourceType: 'emergency-access',
      resourceId: emergencyAccessId,
      timestamp: serverTimestamp(),
      details: `Approved emergency access request ${emergencyAccessId}`
    });
  } catch (error) {
    console.error('Error approving emergency access:', error);
    throw error;
  }
};

// Revoke emergency access
export const revokeEmergencyAccess = async (emergencyAccessId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'emergencyAccess', emergencyAccessId), {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking emergency access:', error);
    throw error;
  }
};

// Check if a user has emergency access to a patient's records
export const checkEmergencyAccess = async (userId: string, patientId: string): Promise<boolean> => {
  try {
    const now = Timestamp.now();
    
    const q = query(
      collection(db, 'emergencyAccess'),
      where('grantedToId', '==', userId),
      where('patientId', '==', patientId),
      where('isActive', '==', true),
      where('expiresAt', '>', now)
    );
    
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking emergency access:', error);
    throw error;
  }
};

// Get all emergency access requests for a patient
export const getPatientEmergencyAccessRequests = async (patientId: string): Promise<EmergencyAccess[]> => {
  try {
    const q = query(
      collection(db, 'emergencyAccess'),
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const requests: EmergencyAccess[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      } as EmergencyAccess);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting patient emergency access requests:', error);
    throw error;
  }
};

// Get all pending emergency access requests (for admins)
export const getPendingEmergencyAccessRequests = async (): Promise<EmergencyAccess[]> => {
  try {
    const q = query(
      collection(db, 'emergencyAccess'),
      where('isActive', '==', false),
      where('grantedById', '==', null),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const requests: EmergencyAccess[] = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      } as EmergencyAccess);
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting pending emergency access requests:', error);
    throw error;
  }
};

// Log emergency access activity
export const logEmergencyAccessActivity = async (
  userId: string,
  userRole: 'doctor' | 'admin',
  patientId: string,
  action: 'view' | 'create' | 'update',
  resourceType: 'medical-record' | 'appointment' | 'user' | 'prescription',
  resourceId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      timestamp: serverTimestamp(),
      details: `Emergency access: ${action} ${resourceType} ${resourceId} for patient ${patientId}`
    });
  } catch (error) {
    console.error('Error logging emergency access activity:', error);
    throw error;
  }
};