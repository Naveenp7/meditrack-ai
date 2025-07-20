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


// Reminder interface
export interface Reminder {
  id: string;
  userId: string;
  type: 'appointment' | 'medication' | 'test' | 'follow-up' | 'custom';
  title: string;
  description?: string;
  date: string;
  time?: string;
  status: 'pending' | 'sent' | 'cancelled';
  relatedTo?: {
    type: 'appointment' | 'medical-record' | 'prescription';
    id: string;
  };
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a reminder
export const createReminder = async (
  userId: string,
  type: 'appointment' | 'medication' | 'test' | 'follow-up' | 'custom',
  title: string,
  date: string,
  time?: string,
  description?: string,
  relatedTo?: {
    type: 'appointment' | 'medical-record' | 'prescription';
    id: string;
  },
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'
): Promise<string> => {
  try {
    const reminderRef = await addDoc(collection(db, 'reminders'), {
      userId,
      type,
      title,
      description,
      date,
      time,
      status: 'pending',
      relatedTo,
      recurrence: recurrence || 'once',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return reminderRef.id;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Get a reminder by ID
export const getReminder = async (reminderId: string): Promise<Reminder | null> => {
  try {
    const reminderDoc = await getDoc(doc(db, 'reminders', reminderId));
    
    if (!reminderDoc.exists()) {
      return null;
    }
    
    return {
      id: reminderDoc.id,
      ...reminderDoc.data()
    } as Reminder;
  } catch (error) {
    console.error('Error getting reminder:', error);
    throw error;
  }
};

// Get all reminders for a user
export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const reminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data()
      } as Reminder);
    });
    
    return reminders;
  } catch (error) {
    console.error('Error getting user reminders:', error);
    throw error;
  }
};

// Get upcoming reminders for a user
export const getUpcomingReminders = async (userId: string, days: number = 7): Promise<Reminder[]> => {
  try {
    // Calculate the date range
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      where('date', '>=', todayStr),
      where('date', '<=', endDateStr),
      where('status', '==', 'pending'),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const reminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data()
      } as Reminder);
    });
    
    return reminders;
  } catch (error) {
    console.error('Error getting upcoming reminders:', error);
    throw error;
  }
};

// Update a reminder
export const updateReminder = async (reminderId: string, updates: Partial<Reminder>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reminders', reminderId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

// Mark a reminder as sent
export const markReminderAsSent = async (reminderId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reminders', reminderId), {
      status: 'sent',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    throw error;
  }
};

// Cancel a reminder
export const cancelReminder = async (reminderId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reminders', reminderId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    throw error;
  }
};

// Delete a reminder
export const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

// Create an appointment reminder
export const createAppointmentReminder = async (
  userId: string,
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string,
  doctorName?: string
): Promise<string> => {
  try {
    const title = 'Appointment Reminder';
    const description = doctorName
      ? `You have an appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}.`
      : `You have an appointment on ${appointmentDate} at ${appointmentTime}.`;

    return await createReminder(
      userId,
      'appointment',
      title,
      appointmentDate,
      appointmentTime,
      description,
      {
        type: 'appointment',
        id: appointmentId,
      }
    );
  } catch (error) {
    console.error('Error creating appointment reminder:', error);
    throw error;
  }
};


// Create a medication reminder
export const createMedicationReminder = async (
  userId: string,
  medicationName: string,
  dosage: string,
  frequency: string,
  startDate: string,
  endDate: string,
  times: string[],
  prescriptionId?: string
): Promise<string[]> => {
  try {
    const reminderIds: string[] = [];
    
    // Determine recurrence based on frequency
    let recurrence: 'once' | 'daily' | 'weekly' | 'monthly' = 'once';
    
    if (frequency.toLowerCase().includes('daily')) {
      recurrence = 'daily';
    } else if (frequency.toLowerCase().includes('weekly')) {
      recurrence = 'weekly';
    } else if (frequency.toLowerCase().includes('monthly')) {
      recurrence = 'monthly';
    }
    
    // Create a reminder for each time
    for (const time of times) {
      const title = 'Medication Reminder';
      const description = `Time to take ${medicationName} (${dosage}). ${frequency}.`;
      
      const reminderId = await createReminder(
        userId,
        'medication',
        title,
        startDate,
        time,
        description,
        prescriptionId ? {
          type: 'prescription',
          id: prescriptionId
        } : undefined,
        recurrence
      );
      
      reminderIds.push(reminderId);
    }
    
    return reminderIds;
  } catch (error) {
    console.error('Error creating medication reminder:', error);
    throw error;
  }
};

// Process reminders that are due
export const processDueReminders = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Query for reminders that are due today and haven't been sent yet
    const q = query(
      collection(db, 'reminders'),
      where('date', '==', today),
      where('time', '<=', currentTime),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    
    let processedCount = 0;
    
    // Process each due reminder
    for (const doc of querySnapshot.docs) {
      const reminder = {
        id: doc.id,
        ...doc.data()
      } as Reminder;
      
      // Send notification based on reminder type
      if (reminder.type === 'appointment' && reminder.relatedTo?.id) {
        // For appointment reminders, create a notification
        await createAppointmentReminder(
          reminder.userId,
          reminder.relatedTo.id,
          reminder.date,
          reminder.time || '00:00'
        );
      } else {
        // For other types, create a generic notification
        await addDoc(collection(db, 'notifications'), {
          userId: reminder.userId,
          title: reminder.title,
          message: reminder.description || reminder.title,
          type: 'info',
          read: false,
          relatedTo: reminder.relatedTo,
          createdAt: serverTimestamp()
        });
      }
      
      // Mark the reminder as sent
      await markReminderAsSent(reminder.id);
      
      // If the reminder is recurring, create the next occurrence
      if (reminder.recurrence && reminder.recurrence !== 'once') {
        await createNextRecurringReminder(reminder);
      }
      
      processedCount++;
    }
    
    return processedCount;
  } catch (error) {
    console.error('Error processing due reminders:', error);
    throw error;
  }
};

// Create the next occurrence of a recurring reminder
const createNextRecurringReminder = async (reminder: Reminder): Promise<void> => {
  try {
    const currentDate = new Date(reminder.date);
    let nextDate: Date;
    
    // Calculate the next date based on recurrence
    if (reminder.recurrence === 'daily') {
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);
    } else if (reminder.recurrence === 'weekly') {
      nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 7);
    } else if (reminder.recurrence === 'monthly') {
      nextDate = new Date(currentDate);
      nextDate.setMonth(currentDate.getMonth() + 1);
    } else {
      return; // Not a recurring reminder or unsupported recurrence
    }
    
    // Create the next reminder
    await createReminder(
      reminder.userId,
      reminder.type,
      reminder.title,
      nextDate.toISOString().split('T')[0],
      reminder.time,
      reminder.description,
      reminder.relatedTo,
      reminder.recurrence
    );
  } catch (error) {
    console.error('Error creating next recurring reminder:', error);
    throw error;
  }
};