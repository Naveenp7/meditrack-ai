import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AISummary, MedicalRecord } from '../types';
import { 
  transcribeAudio, 
  generateConsultationSummary, 
  generateHealthInsights, 
  generateWellnessRoutine, 
  translateText 
} from '../utils/aiUtils';

// Transcribe audio recording
export const transcribeAudioRecording = async (audioBlob: Blob): Promise<string> => {
  try {
    const transcription = await transcribeAudio(audioBlob);
    return transcription;
  } catch (error) {
    console.error('Error in transcribeAudioRecording:', error);
    throw error;
  }
};

// Generate AI summary for consultation
export const generateAIConsultationSummary = async (transcription: string): Promise<{
  symptoms: string[];
  diagnosis: string;
  recommendations: string;
  followUpDate?: string;
  summary: string;
}> => {
  try {
    const summary = await generateConsultationSummary(transcription);
    return summary;
  } catch (error) {
    console.error('Error in generateAIConsultationSummary:', error);
    throw error;
  }
};

// Save AI summary to database
export const saveAISummary = async (recordId: string, content: string, language: string = 'en'): Promise<string> => {
  try {
    const summaryRef = await addDoc(collection(db, 'aiSummaries'), {
      recordId,
      content,
      language,
      generatedDate: serverTimestamp()
    });
    
    return summaryRef.id;
  } catch (error) {
    console.error('Error saving AI summary:', error);
    throw error;
  }
};

// Get AI summary by record ID
export const getAISummaryByRecordId = async (recordId: string): Promise<AISummary | null> => {
  try {
    const q = query(
      collection(db, 'aiSummaries'),
      where('recordId', '==', recordId),
      orderBy('generatedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the most recent summary
    const summaryDoc = querySnapshot.docs[0];
    
    return {
      id: summaryDoc.id,
      ...summaryDoc.data()
    } as AISummary;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    throw error;
  }
};

// Generate health insights for patient
export const generatePatientHealthInsights = async (patientId: string) => {
  try {
    const insights = await generateHealthInsights(patientId);
    return insights;
  } catch (error) {
    console.error('Error in generatePatientHealthInsights:', error);
    throw error;
  }
};

// Generate wellness routine for patient
export const generatePatientWellnessRoutine = async (patientId: string, conditions: string[]) => {
  try {
    const routine = await generateWellnessRoutine(patientId, conditions);
    return routine;
  } catch (error) {
    console.error('Error in generatePatientWellnessRoutine:', error);
    throw error;
  }
};

// Translate medical record content
export const translateMedicalRecord = async (
  record: MedicalRecord,
  targetLanguage: 'en' | 'hi' | 'ml' | 'ta' | 'te' | 'kn' | 'bn'
): Promise<{
  title: string;
  description: string;
  additionalContent?: any;
}> => {
  try {
    // Translate the title and description
    const translatedTitle = await translateText(record.title, targetLanguage);
    const translatedDescription = await translateText(record.description, targetLanguage);
    
    // Initialize additional content object
    let additionalContent: any = {};
    
    // Translate additional fields based on record type
    if (record.type === 'consultation') {
      const consultation = record as any; // Type casting for simplicity
      
      if (consultation.diagnosis) {
        additionalContent.diagnosis = await translateText(consultation.diagnosis, targetLanguage);
      }
      
      if (consultation.recommendations) {
        additionalContent.recommendations = await translateText(consultation.recommendations, targetLanguage);
      }
    } else if (record.type === 'prescription') {
      const prescription = record as any; // Type casting for simplicity
      
      if (prescription.medications && Array.isArray(prescription.medications)) {
        additionalContent.medications = await Promise.all(
          prescription.medications.map(async (med: any) => ({
            ...med,
            instructions: await translateText(med.instructions, targetLanguage)
          }))
        );
      }
    }
    
    return {
      title: translatedTitle,
      description: translatedDescription,
      additionalContent
    };
  } catch (error) {
    console.error('Error translating medical record:', error);
    throw error;
  }
};

// Get available translation languages
export const getAvailableTranslationLanguages = (): Array<{
  code: 'en' | 'hi' | 'ml' | 'ta' | 'te' | 'kn' | 'bn';
  name: string;
}> => {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'bn', name: 'Bengali' }
  ];
};