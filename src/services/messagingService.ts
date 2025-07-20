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
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from '../types';
import { createNotification } from './notificationService';

// Message interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: {
    id: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    size: number;
  }[];
  read: boolean;
  createdAt: Timestamp;
}

// Conversation interface
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a new conversation
export const createConversation = async (participants: string[]): Promise<string> => {
  try {
    // Check if conversation already exists between these participants
    const existingConversation = await getConversationByParticipants(participants);
    
    if (existingConversation) {
      return existingConversation.id;
    }
    
    // Create new conversation
    const conversationRef = await addDoc(collection(db, 'conversations'), {
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return conversationRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Get a conversation by ID
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (!conversationDoc.exists()) {
      return null;
    }
    
    return {
      id: conversationDoc.id,
      ...conversationDoc.data()
    } as Conversation;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

// Get a conversation by participants
export const getConversationByParticipants = async (participants: string[]): Promise<Conversation | null> => {
  try {
    // Sort participants to ensure consistent ordering
    const sortedParticipants = [...participants].sort();
    
    // Query for conversations with exactly these participants
    const q = query(
      collection(db, 'conversations'),
      where('participants', '==', sortedParticipants)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching conversation
    const conversationDoc = querySnapshot.docs[0];
    
    return {
      id: conversationDoc.id,
      ...conversationDoc.data()
    } as Conversation;
  } catch (error) {
    console.error('Error getting conversation by participants:', error);
    throw error;
  }
};

// Get all conversations for a user
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const conversations: Conversation[] = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      } as Conversation);
    });
    
    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  attachments?: File[]
): Promise<string> => {
  try {
    // Get the conversation to check participants
    const conversation = await getConversation(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Process attachments if any
    let processedAttachments: Attachment[] = [];
    
    if (attachments && attachments.length > 0) {
      processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          // Generate a unique filename
          const filename = `messages/${conversationId}/${uuidv4()}_${file.name}`;
          
          // Create a reference to the file location
          const storageRef = ref(storage, filename);
          
          // Upload the file
          await uploadBytes(storageRef, file);
          
          // Get the download URL
          const fileUrl = await getDownloadURL(storageRef);
          
          return {
            id: uuidv4(),
            fileName: file.name,
            fileType: file.type,
            fileUrl,
            uploadDate: new Date().toISOString(),
            size: file.size
          };
        })
      );
    }
    
    // Add the message
    const messageRef = await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId,
      content,
      attachments: processedAttachments,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Update the conversation with the last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: {
        content,
        senderId,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    // Send notifications to other participants
    const otherParticipants = conversation.participants.filter(id => id !== senderId);
    
    for (const participantId of otherParticipants) {
      await createNotification(
        participantId,
        'New Message',
        `You have a new message from ${senderId}`,
        'info',
        {
          type: 'message',
          id: messageRef.id
        }
      );
    }
    
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getMessages = async (conversationId: string, limitCount?: number): Promise<Message[]> => {
  try {
    let q;
    
    if (limitCount !== undefined) {
      q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as Message);
    });
    
    // Return messages in chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Mark all messages in a conversation as read for a user
export const markConversationAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const batch: Promise<void>[] = [];
    
    querySnapshot.forEach((document) => {
      batch.push(updateDoc(doc(db, 'messages', document.id), { read: true }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    // Get all conversations for the user
    const conversations = await getUserConversations(userId);
    
    let totalUnread = 0;
    
    // For each conversation, count unread messages not sent by the user
    for (const conversation of conversations) {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversation.id),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      totalUnread += querySnapshot.size;
    }
    
    return totalUnread;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};

// Get doctor-patient conversation
export const getDoctorPatientConversation = async (doctorId: string, patientId: string): Promise<Conversation> => {
  try {
    // Check if conversation exists
    const existingConversation = await getConversationByParticipants([doctorId, patientId]);
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Create new conversation if it doesn't exist
    const conversationId = await createConversation([doctorId, patientId]);
    return await getConversation(conversationId) as Conversation;
  } catch (error) {
    console.error('Error getting doctor-patient conversation:', error);
    throw error;
  }
};