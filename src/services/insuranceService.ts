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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Insurance provider interface
export interface InsuranceProvider {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail?: string;
  website?: string;
  address?: string;
  coverageTypes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Patient insurance interface
export interface PatientInsurance {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  policyHolderName: string;
  policyHolderRelationship: 'self' | 'spouse' | 'parent' | 'other';
  coverageType: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'pending';
  verificationStatus: 'verified' | 'unverified' | 'pending';
  verificationDate?: Timestamp;
  cardFrontImageUrl?: string;
  cardBackImageUrl?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Insurance claim interface
export interface InsuranceClaim {
  id: string;
  patientId: string;
  patientName: string;
  patientInsuranceId: string;
  providerId: string;
  providerName: string;
  appointmentId?: string;
  medicalRecordIds: string[];
  claimNumber?: string;
  dateOfService: string;
  dateSubmitted: string;
  dateProcessed?: string;
  services: {
    code: string;
    description: string;
    amount: number;
  }[];
  totalAmount: number;
  coveredAmount?: number;
  patientResponsibility?: number;
  status: 'draft' | 'submitted' | 'in_process' | 'approved' | 'partially_approved' | 'denied' | 'appealed';
  denialReason?: string;
  notes?: string;
  attachmentUrls?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create an insurance provider
export const createInsuranceProvider = async (
  name: string,
  contactPhone: string,
  coverageTypes: string[],
  contactEmail?: string,
  website?: string,
  address?: string
): Promise<string> => {
  try {
    const providerRef = await addDoc(collection(db, 'insuranceProviders'), {
      name,
      contactPhone,
      contactEmail,
      website,
      address,
      coverageTypes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return providerRef.id;
  } catch (error) {
    console.error('Error creating insurance provider:', error);
    throw error;
  }
};

// Get an insurance provider by ID
export const getInsuranceProvider = async (providerId: string): Promise<InsuranceProvider | null> => {
  try {
    const providerDoc = await getDoc(doc(db, 'insuranceProviders', providerId));
    
    if (!providerDoc.exists()) {
      return null;
    }
    
    return {
      id: providerDoc.id,
      ...providerDoc.data()
    } as InsuranceProvider;
  } catch (error) {
    console.error('Error getting insurance provider:', error);
    throw error;
  }
};

// Get all insurance providers
export const getAllInsuranceProviders = async (): Promise<InsuranceProvider[]> => {
  try {
    const q = query(
      collection(db, 'insuranceProviders'),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const providers: InsuranceProvider[] = [];
    
    querySnapshot.forEach((doc) => {
      providers.push({
        id: doc.id,
        ...doc.data()
      } as InsuranceProvider);
    });
    
    return providers;
  } catch (error) {
    console.error('Error getting all insurance providers:', error);
    throw error;
  }
};

// Update an insurance provider
export const updateInsuranceProvider = async (
  providerId: string,
  updates: Partial<InsuranceProvider>
): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    await updateDoc(doc(db, 'insuranceProviders', providerId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating insurance provider:', error);
    throw error;
  }
};

// Delete an insurance provider
export const deleteInsuranceProvider = async (providerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'insuranceProviders', providerId));
  } catch (error) {
    console.error('Error deleting insurance provider:', error);
    throw error;
  }
};

// Create patient insurance
export const createPatientInsurance = async (
  patientId: string,
  providerId: string,
  providerName: string,
  policyNumber: string,
  policyHolderName: string,
  policyHolderRelationship: 'self' | 'spouse' | 'parent' | 'other',
  coverageType: string,
  startDate: string,
  groupNumber?: string,
  endDate?: string,
  notes?: string
): Promise<string> => {
  try {
    const insuranceRef = await addDoc(collection(db, 'patientInsurance'), {
      patientId,
      providerId,
      providerName,
      policyNumber,
      groupNumber,
      policyHolderName,
      policyHolderRelationship,
      coverageType,
      startDate,
      endDate,
      status: 'active',
      verificationStatus: 'unverified',
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return insuranceRef.id;
  } catch (error) {
    console.error('Error creating patient insurance:', error);
    throw error;
  }
};

// Upload insurance card images
export const uploadInsuranceCardImages = async (
  insuranceId: string,
  frontImage?: File,
  backImage?: File
): Promise<{ frontUrl?: string; backUrl?: string }> => {
  try {
    const result: { frontUrl?: string; backUrl?: string } = {};
    
    // Upload front image if provided
    if (frontImage) {
      const frontFileName = `insurance/${insuranceId}/front_${uuidv4()}.${frontImage.name.split('.').pop()}`;
      const frontRef = ref(storage, frontFileName);
      await uploadBytes(frontRef, frontImage);
      result.frontUrl = await getDownloadURL(frontRef);
    }
    
    // Upload back image if provided
    if (backImage) {
      const backFileName = `insurance/${insuranceId}/back_${uuidv4()}.${backImage.name.split('.').pop()}`;
      const backRef = ref(storage, backFileName);
      await uploadBytes(backRef, backImage);
      result.backUrl = await getDownloadURL(backRef);
    }
    
    // Update insurance record with image URLs
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp()
    };
    
    if (result.frontUrl) {
      updates.cardFrontImageUrl = result.frontUrl;
    }
    
    if (result.backUrl) {
      updates.cardBackImageUrl = result.backUrl;
    }
    
    await updateDoc(doc(db, 'patientInsurance', insuranceId), updates);
    
    return result;
  } catch (error) {
    console.error('Error uploading insurance card images:', error);
    throw error;
  }
};

// Get patient insurance by ID
export const getPatientInsurance = async (insuranceId: string): Promise<PatientInsurance | null> => {
  try {
    const insuranceDoc = await getDoc(doc(db, 'patientInsurance', insuranceId));
    
    if (!insuranceDoc.exists()) {
      return null;
    }
    
    return {
      id: insuranceDoc.id,
      ...insuranceDoc.data()
    } as PatientInsurance;
  } catch (error) {
    console.error('Error getting patient insurance:', error);
    throw error;
  }
};

// Get all insurance for a patient
export const getPatientInsurances = async (patientId: string): Promise<PatientInsurance[]> => {
  try {
    const q = query(
      collection(db, 'patientInsurance'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const insurances: PatientInsurance[] = [];
    
    querySnapshot.forEach((doc) => {
      insurances.push({
        id: doc.id,
        ...doc.data()
      } as PatientInsurance);
    });
    
    return insurances;
  } catch (error) {
    console.error('Error getting patient insurances:', error);
    throw error;
  }
};

// Get active insurance for a patient
export const getActivePatientInsurance = async (patientId: string): Promise<PatientInsurance | null> => {
  try {
    const q = query(
      collection(db, 'patientInsurance'),
      where('patientId', '==', patientId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    
    return {
      id: doc.id,
      ...doc.data()
    } as PatientInsurance;
  } catch (error) {
    console.error('Error getting active patient insurance:', error);
    throw error;
  }
};

// Update patient insurance
export const updatePatientInsurance = async (
  insuranceId: string,
  updates: Partial<PatientInsurance>
): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    await updateDoc(doc(db, 'patientInsurance', insuranceId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating patient insurance:', error);
    throw error;
  }
};

// Verify patient insurance
export const verifyPatientInsurance = async (insuranceId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'patientInsurance', insuranceId), {
      verificationStatus: 'verified',
      verificationDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error verifying patient insurance:', error);
    throw error;
  }
};

// Delete patient insurance
export const deletePatientInsurance = async (insuranceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'patientInsurance', insuranceId));
  } catch (error) {
    console.error('Error deleting patient insurance:', error);
    throw error;
  }
};

// Create an insurance claim
export const createInsuranceClaim = async (
  patientId: string,
  patientName: string,
  patientInsuranceId: string,
  providerId: string,
  providerName: string,
  dateOfService: string,
  services: { code: string; description: string; amount: number }[],
  appointmentId?: string,
  medicalRecordIds: string[] = [],
  notes?: string
): Promise<string> => {
  try {
    // Calculate total amount
    const totalAmount = services.reduce((sum, service) => sum + service.amount, 0);
    
    const claimRef = await addDoc(collection(db, 'insuranceClaims'), {
      patientId,
      patientName,
      patientInsuranceId,
      providerId,
      providerName,
      appointmentId,
      medicalRecordIds,
      dateOfService,
      dateSubmitted: new Date().toISOString().split('T')[0],
      services,
      totalAmount,
      status: 'draft',
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return claimRef.id;
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    throw error;
  }
};

// Upload claim attachment
export const uploadClaimAttachment = async (claimId: string, file: File): Promise<string> => {
  try {
    const fileName = `claims/${claimId}/${uuidv4()}.${file.name.split('.').pop()}`;
    const fileRef = ref(storage, fileName);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    // Update claim with attachment URL
    const claimDoc = await getDoc(doc(db, 'insuranceClaims', claimId));
    
    if (claimDoc.exists()) {
      const currentAttachments = claimDoc.data().attachmentUrls || [];
      await updateDoc(doc(db, 'insuranceClaims', claimId), {
        attachmentUrls: [...currentAttachments, downloadURL],
        updatedAt: serverTimestamp()
      });
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading claim attachment:', error);
    throw error;
  }
};

// Get an insurance claim by ID
export const getInsuranceClaim = async (claimId: string): Promise<InsuranceClaim | null> => {
  try {
    const claimDoc = await getDoc(doc(db, 'insuranceClaims', claimId));
    
    if (!claimDoc.exists()) {
      return null;
    }
    
    return {
      id: claimDoc.id,
      ...claimDoc.data()
    } as InsuranceClaim;
  } catch (error) {
    console.error('Error getting insurance claim:', error);
    throw error;
  }
};

// Get all claims for a patient
export const getPatientClaims = async (patientId: string): Promise<InsuranceClaim[]> => {
  try {
    const q = query(
      collection(db, 'insuranceClaims'),
      where('patientId', '==', patientId),
      orderBy('dateOfService', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const claims: InsuranceClaim[] = [];
    
    querySnapshot.forEach((doc) => {
      claims.push({
        id: doc.id,
        ...doc.data()
      } as InsuranceClaim);
    });
    
    return claims;
  } catch (error) {
    console.error('Error getting patient claims:', error);
    throw error;
  }
};

// Update an insurance claim
export const updateInsuranceClaim = async (
  claimId: string,
  updates: Partial<InsuranceClaim>
): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    // If services are updated, recalculate total amount
    if (updates.services) {
      updatesWithoutId.totalAmount = updates.services.reduce((sum, service) => sum + service.amount, 0);
    }
    
    await updateDoc(doc(db, 'insuranceClaims', claimId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    throw error;
  }
};

// Submit an insurance claim
export const submitInsuranceClaim = async (claimId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'insuranceClaims', claimId), {
      status: 'submitted',
      dateSubmitted: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error submitting insurance claim:', error);
    throw error;
  }
};

// Process an insurance claim (update with insurance response)
export const processInsuranceClaim = async (
  claimId: string,
  status: 'approved' | 'partially_approved' | 'denied',
  coveredAmount?: number,
  patientResponsibility?: number,
  denialReason?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'insuranceClaims', claimId), {
      status,
      dateProcessed: new Date().toISOString().split('T')[0],
      coveredAmount,
      patientResponsibility,
      denialReason,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error processing insurance claim:', error);
    throw error;
  }
};

// Appeal an insurance claim
export const appealInsuranceClaim = async (claimId: string, notes: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'insuranceClaims', claimId), {
      status: 'appealed',
      notes: notes,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error appealing insurance claim:', error);
    throw error;
  }
};

// Delete an insurance claim
export const deleteInsuranceClaim = async (claimId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'insuranceClaims', claimId));
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    throw error;
  }
};