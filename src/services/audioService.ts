import MicRecorder from 'mic-recorder-to-mp3';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudio } from '../utils/aiUtils';

// Initialize the recorder
const recorder = new MicRecorder({ bitRate: 128 });

let isRecording = false;
let audioBlob: Blob | null = null;

// Start recording audio
export const startRecording = async (): Promise<void> => {
  try {
    // Check if recording is already in progress
    if (isRecording) {
      throw new Error('Recording is already in progress');
    }
    
    // Request microphone permission and start recording
    await recorder.start();
    isRecording = true;
    
    console.log('Recording started');
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

// Stop recording and get the audio blob
export const stopRecording = async (): Promise<Blob> => {
  try {
    // Check if recording is in progress
    if (!isRecording) {
      throw new Error('No recording in progress');
    }
    
    // Stop recording and get the audio blob
    const [buffer, blob] = await recorder.stop().getMp3();
    isRecording = false;
    audioBlob = blob;
    
    console.log('Recording stopped');
    
    return blob;
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
};

// Upload audio to Firebase Storage
export const uploadAudio = async (blob: Blob, userId: string): Promise<string> => {
  try {
    // Generate a unique filename
    const filename = `recordings/${userId}/${uuidv4()}.mp3`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, filename);
    
    // Upload the blob
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('Audio uploaded successfully');
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

// Process audio: upload, transcribe, and return results
export const processAudio = async (blob: Blob, userId: string): Promise<{
  audioUrl: string;
  transcription: string;
}> => {
  try {
    // Upload audio to Firebase Storage
    const audioUrl = await uploadAudio(blob, userId);
    
    // Transcribe the audio
    const transcription = await transcribeAudio(blob);
    
    return {
      audioUrl,
      transcription
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
};

// Check if recording is in progress
export const isRecordingInProgress = (): boolean => {
  return isRecording;
};

// Get the current audio blob (if available)
export const getCurrentAudioBlob = (): Blob | null => {
  return audioBlob;
};

// Clear the current audio blob
export const clearAudioBlob = (): void => {
  audioBlob = null;
};