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
import { Appointment } from '../types';

// Create a new appointment
export const createAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<string> => {
  try {
    const appointmentRef = await addDoc(collection(db, 'appointments'), {
      ...appointment,
      reminderSent: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return appointmentRef.id;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Get an appointment by ID
export const getAppointment = async (appointmentId: string): Promise<Appointment> => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointmentData = appointmentDoc.data();
    
    return {
      id: appointmentDoc.id,
      ...appointmentData
    } as Appointment;
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
};

// Get all appointments for a patient
export const getPatientAppointments = async (patientId: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc'),
      orderBy('time', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    throw error;
  }
};

// Get all appointments for a doctor (alias for getAppointmentsByDoctor)
export const getAppointmentsByDoctor = async (doctorId: string, status?: string): Promise<Appointment[]> => {
  return getDoctorAppointments(doctorId, status);
};

// Get all appointments for a doctor
export const getDoctorAppointments = async (doctorId: string, status?: string): Promise<Appointment[]> => {
  try {
    let q;
    
    if (status) {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('status', '==', status),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    } else {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting doctor appointments:', error);
    throw error;
  }
};

// Get appointments for a specific date
export const getAppointmentsByDate = async (doctorId: string, date: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const appointments: Appointment[] = [];
    
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments by date:', error);
    throw error;
  }
};

// Update an appointment
export const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

// Delete an appointment
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Check if a time slot is available
export const checkTimeSlotAvailability = async (doctorId: string, date: string, time: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('time', '==', time),
      where('status', 'in', ['scheduled', 'completed'])
    );
    
    const querySnapshot = await getDocs(q);
    
    // If there are no appointments at this time, the slot is available
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    throw error;
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableTimeSlots = async (doctorId: string, date: string): Promise<string[]> => {
  try {
    // Define all possible time slots (30-minute intervals from 9 AM to 5 PM)
    const allTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
    
    // Get all appointments for the doctor on the specified date
    const appointments = await getAppointmentsByDate(doctorId, date);
    
    // Filter out time slots that are already booked
    const bookedTimeSlots = appointments
      .filter(appointment => appointment.status !== 'cancelled')
      .map(appointment => appointment.time);
    
    // Return available time slots
    return allTimeSlots.filter(timeSlot => !bookedTimeSlots.includes(timeSlot));
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};