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
  limit,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Notification type definition
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  relatedTo?: {
    type: 'appointment' | 'medical-record' | 'message' | 'system';
    id?: string;
  };
  createdAt: Timestamp;
}

// Create a new notification
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  relatedTo?: {
    type: 'appointment' | 'medical-record' | 'message' | 'system';
    id?: string;
  }
): Promise<string> => {
  try {
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      relatedTo,
      createdAt: serverTimestamp()
    });
    
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get a notification by ID
export const getNotification = async (notificationId: string): Promise<Notification | null> => {
  try {
    const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
    
    if (!notificationDoc.exists()) {
      return null;
    }
    
    return {
      id: notificationDoc.id,
      ...notificationDoc.data()
    } as Notification;
  } catch (error) {
    console.error('Error getting notification:', error);
    throw error;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId: string, onlyUnread: boolean = false): Promise<Notification[]> => {
  try {
    let q;
    
    if (onlyUnread) {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get recent notifications for a user
export const getRecentNotifications = async (userId: string, count: number = 5): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const querySnapshot = await getDocs(q);
    
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting recent notifications:', error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const batch: Promise<void>[] = [];
    
    querySnapshot.forEach((document) => {
      batch.push(updateDoc(doc(db, 'notifications', document.id), { read: true }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const batch: Promise<void>[] = [];
    
    querySnapshot.forEach((document) => {
      batch.push(deleteDoc(doc(db, 'notifications', document.id)));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Create appointment reminder notification
export const createAppointmentReminder = async (
  userId: string,
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string,
  doctorName?: string
): Promise<string> => {
  try {
    const title = 'Appointment Reminder';
    const message = doctorName 
      ? `You have an appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}.`
      : `You have an appointment on ${appointmentDate} at ${appointmentTime}.`;
    
    return await createNotification(
      userId,
      title,
      message,
      'info',
      {
        type: 'appointment',
        id: appointmentId
      }
    );
  } catch (error) {
    console.error('Error creating appointment reminder:', error);
    throw error;
  }
};

// Create medical record notification
export const createMedicalRecordNotification = async (
  userId: string,
  recordId: string,
  recordTitle: string,
  action: 'created' | 'updated'
): Promise<string> => {
  try {
    const title = `Medical Record ${action === 'created' ? 'Created' : 'Updated'}`;
    const message = `Your medical record "${recordTitle}" has been ${action}.`;
    
    return await createNotification(
      userId,
      title,
      message,
      'info',
      {
        type: 'medical-record',
        id: recordId
      }
    );
  } catch (error) {
    console.error('Error creating medical record notification:', error);
    throw error;
  }
};

// Get unread notification count for a user
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};