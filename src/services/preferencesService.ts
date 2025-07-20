import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../firebase/config';

// User preferences interface
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    appointmentReminders: boolean;
    medicationReminders: boolean;
    labResults: boolean;
    messages: boolean;
    newsletters: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'x-large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
  privacy: {
    shareDataForResearch: boolean;
    allowAnonymizedDataUsage: boolean;
    showProfileToOtherPatients: boolean;
  };
  dashboard: {
    widgets: string[];
    defaultView: 'appointments' | 'records' | 'medications' | 'insights';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Default user preferences
export const defaultUserPreferences: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false,
    appointmentReminders: true,
    medicationReminders: true,
    labResults: true,
    messages: true,
    newsletters: false
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReader: false
  },
  privacy: {
    shareDataForResearch: false,
    allowAnonymizedDataUsage: true,
    showProfileToOtherPatients: false
  },
  dashboard: {
    widgets: ['upcomingAppointments', 'medications', 'recentRecords', 'insights'],
    defaultView: 'appointments'
  }
};

// Create or update user preferences
export const setUserPreferences = async (
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const userPreferencesRef = doc(db, 'userPreferences', userId);
    const userPreferencesDoc = await getDoc(userPreferencesRef);
    
    if (!userPreferencesDoc.exists()) {
      // Create new preferences document with defaults and overrides
      await setDoc(userPreferencesRef, {
        userId,
        ...defaultUserPreferences,
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing preferences
      await updateDoc(userPreferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error setting user preferences:', error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const userPreferencesRef = doc(db, 'userPreferences', userId);
    const userPreferencesDoc = await getDoc(userPreferencesRef);
    
    if (!userPreferencesDoc.exists()) {
      // Return default preferences if none exist
      return {
        userId,
        ...defaultUserPreferences,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
    
    return userPreferencesDoc.data() as UserPreferences;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
};

// Update theme preference
export const updateThemePreference = async (
  userId: string,
  theme: 'light' | 'dark' | 'system'
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userPreferences', userId), {
      theme,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating theme preference:', error);
    throw error;
  }
};

// Update language preference
export const updateLanguagePreference = async (
  userId: string,
  language: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userPreferences', userId), {
      language,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  userId: string,
  notificationPreferences: Partial<UserPreferences['notifications']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each notification preference to the updates object
    Object.entries(notificationPreferences).forEach(([key, value]) => {
      updates[`notifications.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', userId), updates);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Update accessibility preferences
export const updateAccessibilityPreferences = async (
  userId: string,
  accessibilityPreferences: Partial<UserPreferences['accessibility']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each accessibility preference to the updates object
    Object.entries(accessibilityPreferences).forEach(([key, value]) => {
      updates[`accessibility.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', userId), updates);
  } catch (error) {
    console.error('Error updating accessibility preferences:', error);
    throw error;
  }
};

// Update privacy preferences
export const updatePrivacyPreferences = async (
  userId: string,
  privacyPreferences: Partial<UserPreferences['privacy']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each privacy preference to the updates object
    Object.entries(privacyPreferences).forEach(([key, value]) => {
      updates[`privacy.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', userId), updates);
  } catch (error) {
    console.error('Error updating privacy preferences:', error);
    throw error;
  }
};

// Update dashboard preferences
export const updateDashboardPreferences = async (
  userId: string,
  dashboardPreferences: Partial<UserPreferences['dashboard']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each dashboard preference to the updates object
    Object.entries(dashboardPreferences).forEach(([key, value]) => {
      updates[`dashboard.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', userId), updates);
  } catch (error) {
    console.error('Error updating dashboard preferences:', error);
    throw error;
  }
};

// Add a widget to dashboard
export const addDashboardWidget = async (
  userId: string,
  widgetId: string
): Promise<void> => {
  try {
    const userPreferences = await getUserPreferences(userId);
    
    // Check if widget already exists
    if (userPreferences.dashboard.widgets.includes(widgetId)) {
      return;
    }
    
    // Add widget to the list
    await updateDoc(doc(db, 'userPreferences', userId), {
      'dashboard.widgets': [...userPreferences.dashboard.widgets, widgetId],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding dashboard widget:', error);
    throw error;
  }
};

// Remove a widget from dashboard
export const removeDashboardWidget = async (
  userId: string,
  widgetId: string
): Promise<void> => {
  try {
    const userPreferences = await getUserPreferences(userId);
    
    // Filter out the widget
    const updatedWidgets = userPreferences.dashboard.widgets.filter(id => id !== widgetId);
    
    await updateDoc(doc(db, 'userPreferences', userId), {
      'dashboard.widgets': updatedWidgets,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing dashboard widget:', error);
    throw error;
  }
};

// Reorder dashboard widgets
export const reorderDashboardWidgets = async (
  userId: string,
  widgetIds: string[]
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userPreferences', userId), {
      'dashboard.widgets': widgetIds,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error reordering dashboard widgets:', error);
    throw error;
  }
};

// Reset user preferences to defaults
export const resetUserPreferences = async (userId: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'userPreferences', userId), {
      userId,
      ...defaultUserPreferences,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    throw error;
  }
};

// Get users with specific preferences (for admin/analytics purposes)
export const getUsersWithPreference = async (
  preferenceField: string,
  preferenceValue: any
): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'userPreferences'),
      where(preferenceField, '==', preferenceValue)
    );
    
    const querySnapshot = await getDocs(q);
    
    const userIds: string[] = [];
    
    querySnapshot.forEach((doc) => {
      userIds.push(doc.id);
    });
    
    return userIds;
  } catch (error) {
    console.error('Error getting users with preference:', error);
    throw error;
  }
};

// Doctor-specific preferences interface
export interface DoctorPreferences extends UserPreferences {
  scheduling: {
    defaultAppointmentDuration: number; // in minutes
    bufferBetweenAppointments: number; // in minutes
    maxAppointmentsPerDay: number;
    workingHours: {
      monday: { start: string; end: string; enabled: boolean };
      tuesday: { start: string; end: string; enabled: boolean };
      wednesday: { start: string; end: string; enabled: boolean };
      thursday: { start: string; end: string; enabled: boolean };
      friday: { start: string; end: string; enabled: boolean };
      saturday: { start: string; end: string; enabled: boolean };
      sunday: { start: string; end: string; enabled: boolean };
    };
  };
  notifications: UserPreferences['notifications'] & {
    newPatientAssigned: boolean;
    appointmentRequests: boolean;
    emergencyAccessRequests: boolean;
  };
}

// Default doctor preferences
export const defaultDoctorPreferences: Omit<DoctorPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  ...defaultUserPreferences,
  scheduling: {
    defaultAppointmentDuration: 30,
    bufferBetweenAppointments: 10,
    maxAppointmentsPerDay: 20,
    workingHours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    }
  },
  notifications: {
    ...defaultUserPreferences.notifications,
    newPatientAssigned: true,
    appointmentRequests: true,
    emergencyAccessRequests: true
  }
};

// Set doctor preferences
export const setDoctorPreferences = async (
  doctorId: string,
  preferences: Partial<Omit<DoctorPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const doctorPreferencesRef = doc(db, 'userPreferences', doctorId);
    const doctorPreferencesDoc = await getDoc(doctorPreferencesRef);
    
    if (!doctorPreferencesDoc.exists()) {
      // Create new preferences document with defaults and overrides
      await setDoc(doctorPreferencesRef, {
        userId: doctorId,
        ...defaultDoctorPreferences,
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing preferences
      await updateDoc(doctorPreferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error setting doctor preferences:', error);
    throw error;
  }
};

// Get doctor preferences
export const getDoctorPreferences = async (doctorId: string): Promise<DoctorPreferences> => {
  try {
    const doctorPreferencesRef = doc(db, 'userPreferences', doctorId);
    const doctorPreferencesDoc = await getDoc(doctorPreferencesRef);
    
    if (!doctorPreferencesDoc.exists()) {
      // Return default preferences if none exist
      return {
        userId: doctorId,
        ...defaultDoctorPreferences,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
    
    // Get the existing preferences
    const existingPreferences = doctorPreferencesDoc.data();
    
    // Merge with default doctor preferences to ensure all fields exist
    return {
      ...defaultDoctorPreferences,
      ...existingPreferences,
      userId: doctorId
    } as DoctorPreferences;
  } catch (error) {
    console.error('Error getting doctor preferences:', error);
    throw error;
  }
};

// Update doctor scheduling preferences
export const updateDoctorSchedulingPreferences = async (
  doctorId: string,
  schedulingPreferences: Partial<DoctorPreferences['scheduling']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each scheduling preference to the updates object
    Object.entries(schedulingPreferences).forEach(([key, value]) => {
      updates[`scheduling.${key}`] = value;
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', doctorId), updates);
  } catch (error) {
    console.error('Error updating doctor scheduling preferences:', error);
    throw error;
  }
};

// Update doctor working hours
export const updateDoctorWorkingHours = async (
  doctorId: string,
  day: keyof DoctorPreferences['scheduling']['workingHours'],
  hours: { start: string; end: string; enabled: boolean }
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userPreferences', doctorId), {
      [`scheduling.workingHours.${day}`]: hours,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating doctor working hours:', error);
    throw error;
  }
};

// Patient-specific preferences interface
export interface PatientPreferences extends UserPreferences {
  communication: {
    preferredContactMethod: 'email' | 'phone' | 'sms' | 'app';
    preferredLanguage: string;
    preferredDoctorGender?: 'male' | 'female' | 'no_preference';
    caregiverCommunication: boolean;
    caregiverEmail?: string;
    caregiverPhone?: string;
  };
  notifications: UserPreferences['notifications'] & {
    prescriptionRefills: boolean;
    healthTips: boolean;
  };
}

// Default patient preferences
export const defaultPatientPreferences: Omit<PatientPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  ...defaultUserPreferences,
  communication: {
    preferredContactMethod: 'email',
    preferredLanguage: 'en',
    preferredDoctorGender: 'no_preference',
    caregiverCommunication: false
  },
  notifications: {
    ...defaultUserPreferences.notifications,
    prescriptionRefills: true,
    healthTips: true
  }
};

// Set patient preferences
export const setPatientPreferences = async (
  patientId: string,
  preferences: Partial<Omit<PatientPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const patientPreferencesRef = doc(db, 'userPreferences', patientId);
    const patientPreferencesDoc = await getDoc(patientPreferencesRef);
    
    if (!patientPreferencesDoc.exists()) {
      // Create new preferences document with defaults and overrides
      await setDoc(patientPreferencesRef, {
        userId: patientId,
        ...defaultPatientPreferences,
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing preferences
      await updateDoc(patientPreferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error setting patient preferences:', error);
    throw error;
  }
};

// Get patient preferences
export const getPatientPreferences = async (patientId: string): Promise<PatientPreferences> => {
  try {
    const patientPreferencesRef = doc(db, 'userPreferences', patientId);
    const patientPreferencesDoc = await getDoc(patientPreferencesRef);
    
    if (!patientPreferencesDoc.exists()) {
      // Return default preferences if none exist
      return {
        userId: patientId,
        ...defaultPatientPreferences,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
    
    // Get the existing preferences
    const existingPreferences = patientPreferencesDoc.data();
    
    // Merge with default patient preferences to ensure all fields exist
    return {
      ...defaultPatientPreferences,
      ...existingPreferences,
      userId: patientId
    } as PatientPreferences;
  } catch (error) {
    console.error('Error getting patient preferences:', error);
    throw error;
  }
};

// Update patient communication preferences
export const updatePatientCommunicationPreferences = async (
  patientId: string,
  communicationPreferences: Partial<PatientPreferences['communication']>
): Promise<void> => {
  try {
    // Create an object with the updates
    const updates: Record<string, any> = {};
    
    // Add each communication preference to the updates object
    Object.entries(communicationPreferences).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        updates[`communication.${key}`] = deleteField();
      } else {
        updates[`communication.${key}`] = value;
      }
    });
    
    // Add the updatedAt timestamp
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'userPreferences', patientId), updates);
  } catch (error) {
    console.error('Error updating patient communication preferences:', error);
    throw error;
  }
};