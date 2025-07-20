import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { User, Doctor, Patient } from '../types';

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      uid: userDoc.id,
      ...userDoc.data()
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Get doctor by ID
export const getDoctorById = async (doctorId: string): Promise<Doctor | null> => {
  try {
    const doctorDoc = await getDoc(doc(db, 'users', doctorId));
    
    if (!doctorDoc.exists() || doctorDoc.data().role !== 'doctor') {
      return null;
    }
    
    return {
      uid: doctorDoc.id,
      ...doctorDoc.data()
    } as Doctor;
  } catch (error) {
    console.error('Error getting doctor:', error);
    throw error;
  }
};

// Get patient by ID
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  try {
    const patientDoc = await getDoc(doc(db, 'users', patientId));
    
    if (!patientDoc.exists() || patientDoc.data().role !== 'patient') {
      return null;
    }
    
    return {
      uid: patientDoc.id,
      ...patientDoc.data()
    } as Patient;
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

// Get all doctors
export const getAllDoctors = async (): Promise<Doctor[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'doctor')
    );
    
    const querySnapshot = await getDocs(q);
    
    const doctors: Doctor[] = [];
    
    querySnapshot.forEach((doc) => {
      doctors.push({
        uid: doc.id,
        ...doc.data()
      } as Doctor);
    });
    
    return doctors;
  } catch (error) {
    console.error('Error getting all doctors:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role)
    );
    
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data()
      } as User);
    });
    
    return users;
  } catch (error) {
    console.error(`Error getting users by role ${role}:`, error);
    throw error;
  }
};

// Get patients assigned to a doctor
export const getUsersByDoctor = async (doctorId: string): Promise<Patient[]> => {
  try {
    // First get the doctor to get the list of patient IDs
    const doctorDoc = await getDoc(doc(db, 'users', doctorId));
    
    if (!doctorDoc.exists() || doctorDoc.data().role !== 'doctor') {
      throw new Error('Doctor not found');
    }
    
    const doctorData = doctorDoc.data() as Doctor;
    const patientIds = doctorData.patients || [];
    
    if (patientIds.length === 0) {
      return [];
    }
    
    // Get all patients in the list
    const patients: Patient[] = [];
    
    for (const patientId of patientIds) {
      const patientDoc = await getDoc(doc(db, 'users', patientId));
      
      if (patientDoc.exists() && patientDoc.data().role === 'patient') {
        patients.push({
          uid: patientDoc.id,
          ...patientDoc.data()
        } as Patient);
      }
    }
    
    return patients;
  } catch (error) {
    console.error(`Error getting patients by doctor ${doctorId}:`, error);
    throw error;
  }
};

// Get all patients for a doctor
export const getDoctorPatients = async (doctorId: string): Promise<Patient[]> => {
  try {
    const doctorDoc = await getDoc(doc(db, 'users', doctorId));
    
    if (!doctorDoc.exists() || doctorDoc.data().role !== 'doctor') {
      throw new Error('Doctor not found');
    }
    
    const doctorData = doctorDoc.data() as Doctor;
    const patientIds = doctorData.patients || [];
    
    const patients: Patient[] = [];
    
    // Get each patient by ID
    for (const patientId of patientIds) {
      const patientDoc = await getDoc(doc(db, 'users', patientId));
      
      if (patientDoc.exists() && patientDoc.data().role === 'patient') {
        patients.push({
          uid: patientDoc.id,
          ...patientDoc.data()
        } as Patient);
      }
    }
    
    return patients;
  } catch (error) {
    console.error('Error getting doctor patients:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  try {
    // Generate a unique filename
    const filename = `profile-pictures/${userId}/${uuidv4()}_${file.name}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, filename);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const photoURL = await getDownloadURL(storageRef);
    
    // Update user profile with new photo URL
    await updateDoc(doc(db, 'users', userId), {
      photoURL,
      updatedAt: serverTimestamp()
    });
    
    return photoURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Assign patient to doctor
export const assignPatientToDoctor = async (doctorId: string, patientId: string): Promise<void> => {
  try {
    // Update doctor's patients array
    await updateDoc(doc(db, 'users', doctorId), {
      patients: arrayUnion(patientId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning patient to doctor:', error);
    throw error;
  }
};

// Remove patient from doctor
export const removePatientFromDoctor = async (doctorId: string, patientId: string): Promise<void> => {
  try {
    // Update doctor's patients array
    await updateDoc(doc(db, 'users', doctorId), {
      patients: arrayRemove(patientId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing patient from doctor:', error);
    throw error;
  }
};

// Grant family access to patient records
export const grantFamilyAccess = async (patientId: string, familyMemberId: string): Promise<void> => {
  try {
    // Update patient's familyAccess array
    await updateDoc(doc(db, 'users', patientId), {
      familyAccess: arrayUnion(familyMemberId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error granting family access:', error);
    throw error;
  }
};

// Revoke family access to patient records
export const revokeFamilyAccess = async (patientId: string, familyMemberId: string): Promise<void> => {
  try {
    // Update patient's familyAccess array
    await updateDoc(doc(db, 'users', patientId), {
      familyAccess: arrayRemove(familyMemberId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking family access:', error);
    throw error;
  }
};