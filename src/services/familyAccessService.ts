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
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from './analyticsService';
import { createNotification } from './notificationService';

// Family access interface
export interface FamilyAccess {
  id: string;
  patientId: string;
  familyMemberId: string;
  relationship: string;
  accessLevel: 'full' | 'limited' | 'emergency_only';
  permissions: {
    viewMedicalRecords: boolean;
    viewAppointments: boolean;
    viewMedications: boolean;
    viewInsights: boolean;
    scheduleAppointments: boolean;
    communicateWithDoctors: boolean;
    accessEmergencyInfo: boolean;
  };
  status: 'active' | 'pending' | 'revoked';
  inviteCode?: string;
  inviteExpiration?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create family access
export const createFamilyAccess = async (
  patientId: string,
  familyMemberId: string,
  relationship: string,
  accessLevel: 'full' | 'limited' | 'emergency_only',
  notes?: string
): Promise<string> => {
  try {
    // Set permissions based on access level
    const permissions = getPermissionsByAccessLevel(accessLevel);
    
    const accessRef = await addDoc(collection(db, 'familyAccess'), {
      patientId,
      familyMemberId,
      relationship,
      accessLevel,
      permissions,
      status: 'active',
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log the activity
    await logActivity(
      familyMemberId,
      'patient', // Assuming family member is a patient, adjust if needed
      'create',
      'user',
      patientId,
      JSON.stringify({
        patientId,
        accessLevel,
        relationship
      })
    );
    
    // Create notification for the family member
    await createNotification(
      familyMemberId,
      'Family Access Granted',
      `You have been granted ${accessLevel} access to a family member's medical information.`,
      'info'
    );
    
    return accessRef.id;
  } catch (error) {
    console.error('Error creating family access:', error);
    throw error;
  }
};

// Helper function to get permissions based on access level
const getPermissionsByAccessLevel = (accessLevel: 'full' | 'limited' | 'emergency_only') => {
  switch (accessLevel) {
    case 'full':
      return {
        viewMedicalRecords: true,
        viewAppointments: true,
        viewMedications: true,
        viewInsights: true,
        scheduleAppointments: true,
        communicateWithDoctors: true,
        accessEmergencyInfo: true
      };
    case 'limited':
      return {
        viewMedicalRecords: false,
        viewAppointments: true,
        viewMedications: true,
        viewInsights: false,
        scheduleAppointments: true,
        communicateWithDoctors: false,
        accessEmergencyInfo: true
      };
    case 'emergency_only':
      return {
        viewMedicalRecords: false,
        viewAppointments: false,
        viewMedications: false,
        viewInsights: false,
        scheduleAppointments: false,
        communicateWithDoctors: false,
        accessEmergencyInfo: true
      };
    default:
      return {
        viewMedicalRecords: false,
        viewAppointments: false,
        viewMedications: false,
        viewInsights: false,
        scheduleAppointments: false,
        communicateWithDoctors: false,
        accessEmergencyInfo: false
      };
  }
};

// Create family access invitation
export const createFamilyAccessInvitation = async (
  patientId: string,
  relationship: string,
  accessLevel: 'full' | 'limited' | 'emergency_only',
  notes?: string
): Promise<{ inviteCode: string; accessId: string }> => {
  try {
    // Generate invite code
    const inviteCode = uuidv4().substring(0, 8);
    
    // Set expiration date (48 hours from now)
    const inviteExpiration = new Date();
    inviteExpiration.setHours(inviteExpiration.getHours() + 48);
    
    // Set permissions based on access level
    const permissions = getPermissionsByAccessLevel(accessLevel);
    
    const accessRef = await addDoc(collection(db, 'familyAccess'), {
      patientId,
      familyMemberId: '', // Will be filled when accepted
      relationship,
      accessLevel,
      permissions,
      status: 'pending',
      inviteCode,
      inviteExpiration: Timestamp.fromDate(inviteExpiration),
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { inviteCode, accessId: accessRef.id };
  } catch (error) {
    console.error('Error creating family access invitation:', error);
    throw error;
  }
};

// Accept family access invitation
export const acceptFamilyAccessInvitation = async (
  inviteCode: string,
  familyMemberId: string
): Promise<string | null> => {
  try {
    // Find the invitation
    const q = query(
      collection(db, 'familyAccess'),
      where('inviteCode', '==', inviteCode),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null; // Invitation not found or already used
    }
    
    const inviteDoc = querySnapshot.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check if invitation has expired
    if (inviteData.inviteExpiration && inviteData.inviteExpiration.toDate() < new Date()) {
      return null; // Invitation expired
    }
    
    // Update the invitation with the family member ID and change status to active
    await updateDoc(doc(db, 'familyAccess', inviteDoc.id), {
      familyMemberId,
      status: 'active',
      inviteCode: null, // Remove invite code
      inviteExpiration: null, // Remove expiration
      updatedAt: serverTimestamp()
    });
    
    // Log the activity
    await logActivity(
      familyMemberId,
      'patient', // Assuming family member is a patient, adjust if needed
      'update',
      'user',
      inviteData.patientId,
      JSON.stringify({
        patientId: inviteData.patientId,
        accessLevel: inviteData.accessLevel,
        relationship: inviteData.relationship
      })
    );
    
    // Create notification for the patient
    await createNotification(
      inviteData.patientId,
      'Family Access Accepted',
      `A family member has accepted your invitation to access your medical information.`,
      'info'
    );
    
    return inviteDoc.id;
  } catch (error) {
    console.error('Error accepting family access invitation:', error);
    throw error;
  }
};

// Get family access by ID
export const getFamilyAccess = async (accessId: string): Promise<FamilyAccess | null> => {
  try {
    const accessDoc = await getDoc(doc(db, 'familyAccess', accessId));
    
    if (!accessDoc.exists()) {
      return null;
    }
    
    return {
      id: accessDoc.id,
      ...accessDoc.data()
    } as FamilyAccess;
  } catch (error) {
    console.error('Error getting family access:', error);
    throw error;
  }
};

// Get family access by invite code
export const getFamilyAccessByInviteCode = async (inviteCode: string): Promise<FamilyAccess | null> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('inviteCode', '==', inviteCode),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    
    return {
      id: doc.id,
      ...doc.data()
    } as FamilyAccess;
  } catch (error) {
    console.error('Error getting family access by invite code:', error);
    throw error;
  }
};

// Get all family members with access to a patient
export const getPatientFamilyAccess = async (patientId: string): Promise<FamilyAccess[]> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('patientId', '==', patientId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const accessList: FamilyAccess[] = [];
    
    querySnapshot.forEach((doc) => {
      accessList.push({
        id: doc.id,
        ...doc.data()
      } as FamilyAccess);
    });
    
    return accessList;
  } catch (error) {
    console.error('Error getting patient family access:', error);
    throw error;
  }
};

// Get all patients a family member has access to
export const getFamilyMemberAccess = async (familyMemberId: string): Promise<FamilyAccess[]> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('familyMemberId', '==', familyMemberId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const accessList: FamilyAccess[] = [];
    
    querySnapshot.forEach((doc) => {
      accessList.push({
        id: doc.id,
        ...doc.data()
      } as FamilyAccess);
    });
    
    return accessList;
  } catch (error) {
    console.error('Error getting family member access:', error);
    throw error;
  }
};

// Get pending family access invitations for a patient
export const getPatientPendingInvitations = async (patientId: string): Promise<FamilyAccess[]> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('patientId', '==', patientId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const invitations: FamilyAccess[] = [];
    
    querySnapshot.forEach((doc) => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      } as FamilyAccess);
    });
    
    return invitations;
  } catch (error) {
    console.error('Error getting patient pending invitations:', error);
    throw error;
  }
};

// Update family access permissions
export const updateFamilyAccessPermissions = async (
  accessId: string,
  permissions: Partial<FamilyAccess['permissions']>
): Promise<void> => {
  try {
    // Get current access
    const accessDoc = await getDoc(doc(db, 'familyAccess', accessId));
    
    if (!accessDoc.exists()) {
      throw new Error('Family access not found');
    }
    
    const currentAccess = accessDoc.data();
    
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each permission to the updates object
    Object.entries(permissions).forEach(([key, value]) => {
      updates[`permissions.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'familyAccess', accessId), updates);
    
    // Log the activity
    await logActivity(
      currentAccess.familyMemberId,
      'patient',
      'update',
      'medical-record',
      accessId,
      JSON.stringify({ patientId: currentAccess.patientId, updatedPermissions: permissions })
    );
  } catch (error) {
    console.error('Error updating family access permissions:', error);
    throw error;
  }
};

// Update family access level
export const updateFamilyAccessLevel = async (
  accessId: string,
  accessLevel: 'full' | 'limited' | 'emergency_only'
): Promise<void> => {
  try {
    // Get current access
    const accessDoc = await getDoc(doc(db, 'familyAccess', accessId));
    
    if (!accessDoc.exists()) {
      throw new Error('Family access not found');
    }
    
    const currentAccess = accessDoc.data();
    
    // Set permissions based on new access level
    const permissions = getPermissionsByAccessLevel(accessLevel);
    
    await updateDoc(doc(db, 'familyAccess', accessId), {
      accessLevel,
      permissions,
      updatedAt: serverTimestamp()
    });
    
    // Log the activity
    await logActivity(
      currentAccess.familyMemberId,
      'patient', // Assuming family member is a patient, adjust if needed
      'update',
      'user',
      accessId,
      JSON.stringify({
        patientId: currentAccess.patientId,
        accessId,
        previousLevel: currentAccess.accessLevel,
        newLevel: accessLevel
      })
    );
    
    // Create notification for the family member
    await createNotification(
      currentAccess.familyMemberId,
      'Access Level Changed',
      `Your access level to family medical information has been changed to ${accessLevel}.`,
      'info'
    );
  } catch (error) {
    console.error('Error updating family access level:', error);
    throw error;
  }
};

// Revoke family access
export const revokeFamilyAccess = async (accessId: string): Promise<void> => {
  try {
    // Get current access
    const accessDoc = await getDoc(doc(db, 'familyAccess', accessId));
    
    if (!accessDoc.exists()) {
      throw new Error('Family access not found');
    }
    
    const currentAccess = accessDoc.data();
    
    await updateDoc(doc(db, 'familyAccess', accessId), {
      status: 'revoked',
      updatedAt: serverTimestamp()
    });
    
    // Log the activity
    await logActivity(
      currentAccess.familyMemberId,
      'patient',
      'update',
      'medical-record',
      accessId,
      JSON.stringify({ patientId: currentAccess.patientId, relationship: currentAccess.relationship })
    );
    
    // Create notification for the family member
    await createNotification(
      currentAccess.familyMemberId,
      'Access Revoked',
      `Your access to family medical information has been revoked.`,
      'warning'
    );
  } catch (error) {
    console.error('Error revoking family access:', error);
    throw error;
  }
};

// Delete family access
export const deleteFamilyAccess = async (accessId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'familyAccess', accessId));
  } catch (error) {
    console.error('Error deleting family access:', error);
    throw error;
  }
};

// Check if a user has access to a patient's data
export const checkFamilyAccess = async (
  familyMemberId: string,
  patientId: string,
  requiredPermission?: keyof FamilyAccess['permissions']
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('familyMemberId', '==', familyMemberId),
      where('patientId', '==', patientId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // If no specific permission is required, just check if access exists
    if (!requiredPermission) {
      return true;
    }
    
    // Check if the user has the required permission
    const accessDoc = querySnapshot.docs[0];
    const permissions = accessDoc.data().permissions;
    
    return permissions[requiredPermission] === true;
  } catch (error) {
    console.error('Error checking family access:', error);
    throw error;
  }
};

// Get all family relationships for a patient
export const getPatientFamilyRelationships = async (patientId: string): Promise<{ userId: string; relationship: string }[]> => {
  try {
    const q = query(
      collection(db, 'familyAccess'),
      where('patientId', '==', patientId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    const relationships: { userId: string; relationship: string }[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      relationships.push({
        userId: data.familyMemberId,
        relationship: data.relationship
      });
    });
    
    return relationships;
  } catch (error) {
    console.error('Error getting patient family relationships:', error);
    throw error;
  }
};