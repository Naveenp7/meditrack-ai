// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'doctor' | 'patient' | 'admin';
  photoURL?: string;
}

export interface Doctor extends User {
  id: string; // Alias for uid
  role: 'doctor';
  specialization: string;
  patients: string[]; // Array of patient UIDs
  department?: string;
  licenseNumber?: string;
  education?: string[];
  experience?: string[];
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  familyAccess?: string[]; // Array of family member UIDs with access
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: 'consultation' | 'test' | 'prescription' | 'procedure';
  title: string;
  description: string;
  attachments?: Attachment[];
  aiSummary?: string;
}

export interface Consultation extends MedicalRecord {
  type: 'consultation';
  symptoms: string[];
  diagnosis: string;
  recommendations: string;
  followUpDate?: string;
  transcription?: string; // Voice transcription
  audioUrl?: string; // URL to the audio recording
}

export interface TestResult extends MedicalRecord {
  type: 'test';
  testType: string;
  results: {
    parameter: string;
    value: string;
    normalRange?: string;
    isNormal: boolean;
  }[];
  labName?: string;
}

export interface Prescription extends MedicalRecord {
  type: 'prescription';
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  refillable: boolean;
  refillCount?: number;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'confirmed' | 'pending';
  type: 'in-person' | 'video' | 'phone';
  reason: string;
  notes?: string;
  reminderSent: boolean;
  patient: Patient;
  doctor: Doctor;
}

// Attachment Types
export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadDate: string;
  size: number; // in bytes
}

// AI Summary Types
export interface AISummary {
  id: string;
  recordId: string;
  content: string;
  generatedDate: string;
  language: string;
}

// Health Insight Types
export interface HealthInsight {
  id: string;
  patientId: string;
  generatedDate: string;
  category: 'risk' | 'lifestyle' | 'diet' | 'exercise' | 'medication';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Wellness Routine Types
export interface WellnessRoutine {
  id: string;
  patientId: string;
  generatedDate: string;
  exercises: {
    name: string;
    description: string;
    frequency: string;
    duration: string;
  }[];
  diet: {
    recommendation: string;
    foods: {
      type: 'recommended' | 'avoid';
      items: string[];
    }[];
  };
  medications: {
    name: string;
    time: string;
    withFood: boolean;
  }[];
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  userRole: 'doctor' | 'patient' | 'admin';
  action: 'view' | 'create' | 'update' | 'delete' | 'login' | 'logout' | 'emergency-access';
  resourceType: 'medical-record' | 'appointment' | 'user' | 'prescription';
  resourceId?: string;
  timestamp: string;
  ipAddress?: string;
  details?: string;
}

// Emergency Access Types
export interface EmergencyAccess {
  id: string;
  patientId: string;
  grantedToId: string;
  grantedToRole: 'doctor' | 'admin';
  grantedById: string;
  reason: string;
  timestamp: string;
  expiresAt: string;
  isActive: boolean;
}