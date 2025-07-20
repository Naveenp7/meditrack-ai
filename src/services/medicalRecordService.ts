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
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { 
  MedicalRecord, 
  Consultation, 
  TestResult, 
  Prescription, 
  Attachment 
} from '../types';

// Create a new medical record
export const createMedicalRecord = async (record: Omit<MedicalRecord, 'id'>): Promise<string> => {
  try {
    const recordRef = await addDoc(collection(db, 'medicalRecords'), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return recordRef.id;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw error;
  }
};

// Create a new consultation record
export const createConsultation = async (consultation: Omit<Consultation, 'id'>): Promise<string> => {
  try {
    const consultationRef = await addDoc(collection(db, 'medicalRecords'), {
      ...consultation,
      type: 'consultation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return consultationRef.id;
  } catch (error) {
    console.error('Error creating consultation record:', error);
    throw error;
  }
};

// Create a new test result record
export const createTestResult = async (testResult: Omit<TestResult, 'id'>): Promise<string> => {
  try {
    const testResultRef = await addDoc(collection(db, 'medicalRecords'), {
      ...testResult,
      type: 'test',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return testResultRef.id;
  } catch (error) {
    console.error('Error creating test result record:', error);
    throw error;
  }
};

// Create a new prescription record
export const createPrescription = async (prescription: Omit<Prescription, 'id'>): Promise<string> => {
  try {
    const prescriptionRef = await addDoc(collection(db, 'medicalRecords'), {
      ...prescription,
      type: 'prescription',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return prescriptionRef.id;
  } catch (error) {
    console.error('Error creating prescription record:', error);
    throw error;
  }
};

// Get a medical record by ID
export const getMedicalRecord = async (recordId: string): Promise<MedicalRecord> => {
  try {
    const recordDoc = await getDoc(doc(db, 'medicalRecords', recordId));
    
    if (!recordDoc.exists()) {
      throw new Error('Medical record not found');
    }
    
    const recordData = recordDoc.data();
    
    return {
      id: recordDoc.id,
      ...recordData
    } as MedicalRecord;
  } catch (error) {
    console.error('Error getting medical record:', error);
    throw error;
  }
};

// Get all medical records for a patient
export const getPatientMedicalRecords = async (patientId: string): Promise<MedicalRecord[]> => {
  try {
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const records: MedicalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      } as MedicalRecord);
    });
    
    return records;
  } catch (error) {
    console.error('Error getting patient medical records:', error);
    throw error;
  }
};

// Get all medical records for a doctor
export const getDoctorMedicalRecords = async (doctorId: string): Promise<MedicalRecord[]> => {
  try {
    const q = query(
      collection(db, 'medicalRecords'),
      where('doctorId', '==', doctorId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const records: MedicalRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      } as MedicalRecord);
    });
    
    return records;
  } catch (error) {
    console.error('Error getting doctor medical records:', error);
    throw error;
  }
};

// Update a medical record
export const updateMedicalRecord = async (recordId: string, updates: Partial<MedicalRecord>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'medicalRecords', recordId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    throw error;
  }
};

// Upload an attachment
export const uploadAttachment = async (file: File, patientId: string): Promise<Attachment> => {
  try {
    // Generate a unique filename
    const filename = `attachments/${patientId}/${uuidv4()}_${file.name}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, filename);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const fileUrl = await getDownloadURL(storageRef);
    
    // Create attachment object
    const attachment: Attachment = {
      id: uuidv4(),
      fileName: file.name,
      fileType: file.type,
      fileUrl,
      uploadDate: new Date().toISOString(),
      size: file.size
    };
    
    return attachment;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

// Add an attachment to a medical record
export const addAttachmentToRecord = async (recordId: string, attachment: Attachment): Promise<void> => {
  try {
    const recordDoc = await getDoc(doc(db, 'medicalRecords', recordId));
    
    if (!recordDoc.exists()) {
      throw new Error('Medical record not found');
    }
    
    const recordData = recordDoc.data();
    const attachments = recordData.attachments || [];
    
    await updateDoc(doc(db, 'medicalRecords', recordId), {
      attachments: [...attachments, attachment],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding attachment to record:', error);
    throw error;
  }
};