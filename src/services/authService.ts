import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export type UserRole = 'doctor' | 'patient' | 'admin';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

// Register a new user
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: UserRole
): Promise<UserData> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore with role
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      displayName,
      role,
      photoURL: user.photoURL || undefined
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    return userData;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in existing user
export const signInUser = async (email: string, password: string): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data including role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Login user (alias for signInUser for backward compatibility)
export const loginUser = async (email: string, password: string, role: UserRole): Promise<UserData> => {
  return signInUser(email, password);
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user data including role
export const getCurrentUserData = async (): Promise<UserData | null> => {
  const user = auth.currentUser;
  
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};