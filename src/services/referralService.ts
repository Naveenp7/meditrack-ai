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
import { logActivity } from './analyticsService';
import { createNotification } from './notificationService';
import { getUserById } from './userService';

// Referral interfaces
export interface Referral {
  id: string;
  patientId: string;
  referringDoctorId: string;
  referredToDoctorId?: string;
  referredToSpecialist?: string;
  referredToFacility?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  appointmentId?: string;
  feedbackId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  scheduledDate?: Timestamp;
  completedDate?: Timestamp;
}

// Create a new referral
export const createReferral = async (
  patientId: string,
  referringDoctorId: string,
  reason: string,
  urgency: 'routine' | 'urgent' | 'emergency',
  referredToDoctorId?: string,
  referredToSpecialist?: string,
  referredToFacility?: string,
  notes?: string,
  attachments?: string[]
): Promise<string> => {
  try {
    // Validate that at least one referral destination is provided
    if (!referredToDoctorId && !referredToSpecialist && !referredToFacility) {
      throw new Error('At least one referral destination must be provided');
    }

    const referralData = {
      patientId,
      referringDoctorId,
      referredToDoctorId,
      referredToSpecialist,
      referredToFacility,
      reason,
      urgency,
      notes,
      attachments: attachments || [],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const referralRef = await addDoc(collection(db, 'referrals'), referralData);

    // Log activity
    await logActivity(
      referringDoctorId,
      'doctor',
      'create',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralRef.id,
      JSON.stringify({
        patientId,
        urgency
      })
    );

    // Create notification for the patient
    await createNotification(
      patientId,
      'New Referral Created',
      `A new ${urgency} referral has been created for you.`,
      urgency === 'emergency' ? 'error' : urgency === 'urgent' ? 'warning' : 'info'
    );

    // If referred to a specific doctor, create notification for that doctor
    if (referredToDoctorId) {
      // Get patient name for the notification
      const patient = await getUserById(patientId);
      const patientName = patient ? patient.displayName : 'A patient';

      await createNotification(
        referredToDoctorId,
        'New Patient Referral',
        `${patientName} has been referred to you for ${reason}. Urgency: ${urgency}.`,
        urgency === 'emergency' ? 'error' : urgency === 'urgent' ? 'warning' : 'info'
      );
    }

    return referralRef.id;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

// Get a referral by ID
export const getReferral = async (referralId: string): Promise<Referral | null> => {
  try {
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));

    if (!referralDoc.exists()) {
      return null;
    }

    return {
      id: referralDoc.id,
      ...referralDoc.data()
    } as Referral;
  } catch (error) {
    console.error('Error getting referral:', error);
    throw error;
  }
};

// Get all referrals for a patient
export const getPatientReferrals = async (patientId: string): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting patient referrals:', error);
    throw error;
  }
};

// Get referrals created by a doctor
export const getReferringDoctorReferrals = async (doctorId: string): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referringDoctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting referring doctor referrals:', error);
    throw error;
  }
};

// Get referrals sent to a doctor
export const getReferredToDoctorReferrals = async (doctorId: string): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referredToDoctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting referred to doctor referrals:', error);
    throw error;
  }
};

// Get pending referrals for a doctor
export const getPendingReferralsForDoctor = async (doctorId: string): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referredToDoctorId', '==', doctorId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting pending referrals for doctor:', error);
    throw error;
  }
};

// Get referrals by status
export const getReferralsByStatus = async (status: Referral['status']): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting referrals by status:', error);
    throw error;
  }
};

// Get referrals by urgency
export const getReferralsByUrgency = async (urgency: Referral['urgency']): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('urgency', '==', urgency),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const referrals: Referral[] = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data()
      } as Referral);
    });

    return referrals;
  } catch (error) {
    console.error('Error getting referrals by urgency:', error);
    throw error;
  }
};

// Update a referral
export const updateReferral = async (
  referralId: string,
  updates: Partial<Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Prepare the update object
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'referrals', referralId), updateData);
    
    // Log activity
    await logActivity(
      referralData.referringDoctorId,
      'doctor',
      'update',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralId,
      JSON.stringify({
        patientId: referralData.patientId,
        updates: Object.keys(updates)
      })
    );
    
    // Create notification for the patient if significant changes were made
    if (updates.status || updates.urgency || updates.referredToDoctorId) {
      await createNotification(
        referralData.patientId,
        'Referral Updated',
        `Your referral has been updated. ${updates.status ? `Status: ${updates.status}.` : ''}`,
        'info'
      );
    }
  } catch (error) {
    console.error('Error updating referral:', error);
    throw error;
  }
};

// Accept a referral (for the referred doctor)
export const acceptReferral = async (referralId: string, notes?: string): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Update the referral status
    await updateDoc(doc(db, 'referrals', referralId), {
      status: 'accepted',
      notes: notes ? `${referralData.notes || ''} \n\nAcceptance notes: ${notes}` : referralData.notes,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      referralData.referredToDoctorId,
      'doctor',
      'update',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralId,
      JSON.stringify({
        patientId: referralData.patientId,
        referralId,
        referringDoctorId: referralData.referringDoctorId,
        status: 'accepted'
      })
    );
    
    // Create notification for the patient
    await createNotification(
      referralData.patientId,
      'Referral Accepted',
      `Your referral has been accepted by the specialist.`,
      'success'
    );
    
    // Create notification for the referring doctor
    await createNotification(
      referralData.referringDoctorId,
      'Referral Accepted',
      `Your referral for patient ID ${referralData.patientId} has been accepted.`,
      'info'
    );
  } catch (error) {
    console.error('Error accepting referral:', error);
    throw error;
  }
};

// Reject a referral (for the referred doctor)
export const rejectReferral = async (referralId: string, reason: string): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Update the referral status
    await updateDoc(doc(db, 'referrals', referralId), {
      status: 'rejected',
      notes: `${referralData.notes || ''} \n\nRejection reason: ${reason}`,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      referralData.referredToDoctorId,
      'doctor',
      'update',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralId,
      JSON.stringify({
        patientId: referralData.patientId,
        referringDoctorId: referralData.referringDoctorId,
        status: 'rejected',
        reason
      })
    );
    
    // Create notification for the patient
    await createNotification(
      referralData.patientId,
      'Referral Rejected',
      `Your referral has been rejected by the specialist. Reason: ${reason}`,
      'warning'
    );
    
    // Create notification for the referring doctor
    await createNotification(
      referralData.referringDoctorId,
      'Referral Rejected',
      `Your referral for patient ID ${referralData.patientId} has been rejected. Reason: ${reason}`,
      'warning'
    );
  } catch (error) {
    console.error('Error rejecting referral:', error);
    throw error;
  }
};

// Complete a referral (after the appointment/consultation is done)
export const completeReferral = async (
  referralId: string, 
  notes: string,
  appointmentId?: string,
  feedbackId?: string
): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Update the referral status
    await updateDoc(doc(db, 'referrals', referralId), {
      status: 'completed',
      completedDate: Timestamp.now(),
      appointmentId,
      feedbackId,
      notes: `${referralData.notes || ''} \n\nCompletion notes: ${notes}`,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      referralData.referredToDoctorId || referralData.referringDoctorId,
      'doctor',
      'update',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralId,
      JSON.stringify({
        patientId: referralData.patientId,
        appointmentId,
        status: 'completed'
      })
    );
    
    // Create notification for the patient
    await createNotification(
      referralData.patientId,
      'Referral Completed',
      `Your referral has been marked as completed.`,
      'success'
    );
    
    // Create notification for the referring doctor
    await createNotification(
      referralData.referringDoctorId,
      'Referral Completed',
      `The referral for patient ID ${referralData.patientId} has been completed.`,
      'info'
    );
  } catch (error) {
    console.error('Error completing referral:', error);
    throw error;
  }
};

// Cancel a referral
export const cancelReferral = async (referralId: string, reason: string): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Update the referral status
    await updateDoc(doc(db, 'referrals', referralId), {
      status: 'cancelled',
      notes: `${referralData.notes || ''} \n\nCancellation reason: ${reason}`,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      referralData.referringDoctorId,
      'doctor',
      'update',
      'medical-record', // Changed from 'referral' to 'medical-record'
      referralId,
      JSON.stringify({
        patientId: referralData.patientId,
        status: 'cancelled',
        reason
      })
    );
    
    // Create notification for the patient
    await createNotification(
      referralData.patientId,
      'Referral Cancelled',
      `Your referral has been cancelled. Reason: ${reason}`,
      'warning'
    );
    
    // If referred to a specific doctor, create notification for that doctor
    if (referralData.referredToDoctorId) {
      await createNotification(
        referralData.referredToDoctorId,
        'Referral Cancelled',
        `A referral for patient ID ${referralData.patientId} has been cancelled. Reason: ${reason}`,
        'warning'
      );
    }
  } catch (error) {
    console.error('Error cancelling referral:', error);
    throw error;
  }
};

// Delete a referral
export const deleteReferral = async (referralId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'referrals', referralId));
  } catch (error) {
    console.error('Error deleting referral:', error);
    throw error;
  }
};

// Schedule a referral appointment
export const scheduleReferralAppointment = async (
  referralId: string,
  appointmentId: string,
  scheduledDate: Date
): Promise<void> => {
  try {
    // Get the current referral
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (!referralDoc.exists()) {
      throw new Error('Referral not found');
    }
    
    const referralData = referralDoc.data();
    
    // Update the referral with appointment information
    await updateDoc(doc(db, 'referrals', referralId), {
      appointmentId,
      scheduledDate: Timestamp.fromDate(scheduledDate),
      status: referralData.status === 'pending' ? 'accepted' : referralData.status,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      referralData.referredToDoctorId || referralData.referringDoctorId,
      'doctor',
      'create',
      'appointment', // Changed from 'referral_appointment' to 'appointment'
      appointmentId,
      JSON.stringify({
        patientId: referralData.patientId,
        referralId,
        scheduledDate: scheduledDate.toISOString()
      })
    );
    
    // Create notification for the patient
    await createNotification(
      referralData.patientId,
      'Referral Appointment Scheduled',
      `An appointment for your referral has been scheduled for ${scheduledDate.toLocaleDateString()}.`,
      'info'
    );
    
    // Create notification for the referring doctor
    await createNotification(
      referralData.referringDoctorId,
      'Referral Appointment Scheduled',
      `An appointment for the referral of patient ID ${referralData.patientId} has been scheduled.`,
      'info'
    );
  } catch (error) {
    console.error('Error scheduling referral appointment:', error);
    throw error;
  }
};

// Get referral statistics
export const getReferralStatistics = async (doctorId?: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  cancelled: number;
  byUrgency: Record<Referral['urgency'], number>;
}> => {
  try {
    let q;
    
    if (doctorId) {
      // Get statistics for a specific doctor (either as referring or referred to)
      q = query(
        collection(db, 'referrals'),
        where('referringDoctorId', '==', doctorId)
      );
    } else {
      // Get overall statistics
      q = query(collection(db, 'referrals'));
    }

    const querySnapshot = await getDocs(q);

    let total = 0;
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    let completed = 0;
    let cancelled = 0;
    let byUrgency: Record<Referral['urgency'], number> = {
      routine: 0,
      urgent: 0,
      emergency: 0
    };

    querySnapshot.forEach((doc) => {
      const referral = doc.data() as Referral;
      total++;

      // Count by status
      if (referral.status === 'pending') pending++;
      if (referral.status === 'accepted') accepted++;
      if (referral.status === 'rejected') rejected++;
      if (referral.status === 'completed') completed++;
      if (referral.status === 'cancelled') cancelled++;

      // Count by urgency
      byUrgency[referral.urgency]++;
    });

    // If doctorId was provided, also check referrals where doctor is referred to
    if (doctorId) {
      const referredToQuery = query(
        collection(db, 'referrals'),
        where('referredToDoctorId', '==', doctorId)
      );

      const referredToSnapshot = await getDocs(referredToQuery);

      referredToSnapshot.forEach((doc) => {
        const referral = doc.data() as Referral;
        
        // Only count if not already counted (avoid double counting)
        if (referral.referringDoctorId !== doctorId) {
          total++;

          // Count by status
          if (referral.status === 'pending') pending++;
          if (referral.status === 'accepted') accepted++;
          if (referral.status === 'rejected') rejected++;
          if (referral.status === 'completed') completed++;
          if (referral.status === 'cancelled') cancelled++;

          // Count by urgency
          byUrgency[referral.urgency]++;
        }
      });
    }

    return {
      total,
      pending,
      accepted,
      rejected,
      completed,
      cancelled,
      byUrgency
    };
  } catch (error) {
    console.error('Error getting referral statistics:', error);
    throw error;
  }
};