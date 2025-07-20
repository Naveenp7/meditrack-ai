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
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Education resource interface
export interface EducationResource {
  id: string;
  title: string;
  description: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  category: string;
  tags: string[];
  language: string;
  authorId: string;
  authorName?: string;
  isPublic: boolean;
  forConditions?: string[];
  forMedications?: string[];
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create an education resource
export const createEducationResource = async (
  title: string,
  description: string,
  category: string,
  tags: string[],
  language: string,
  authorId: string,
  authorName: string,
  isPublic: boolean = true,
  content?: string,
  forConditions?: string[],
  forMedications?: string[]
): Promise<string> => {
  try {
    const resourceRef = await addDoc(collection(db, 'educationResources'), {
      title,
      description,
      content,
      category,
      tags,
      language,
      authorId,
      authorName,
      isPublic,
      forConditions: forConditions || [],
      forMedications: forMedications || [],
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return resourceRef.id;
  } catch (error) {
    console.error('Error creating education resource:', error);
    throw error;
  }
};

// Upload a file for an education resource
export const uploadEducationFile = async (
  resourceId: string,
  file: File
): Promise<string> => {
  try {
    // Create a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `education/${resourceId}/${uuidv4()}.${fileExtension}`;
    
    // Upload the file to Firebase Storage
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the resource with the file information
    await updateDoc(doc(db, 'educationResources', resourceId), {
      fileUrl: downloadURL,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      updatedAt: serverTimestamp()
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading education file:', error);
    throw error;
  }
};

// Get an education resource by ID
export const getEducationResource = async (resourceId: string): Promise<EducationResource | null> => {
  try {
    const resourceDoc = await getDoc(doc(db, 'educationResources', resourceId));
    
    if (!resourceDoc.exists()) {
      return null;
    }
    
    // Increment view count
    await updateDoc(doc(db, 'educationResources', resourceId), {
      viewCount: (resourceDoc.data().viewCount || 0) + 1
    });
    
    return {
      id: resourceDoc.id,
      ...resourceDoc.data()
    } as EducationResource;
  } catch (error) {
    console.error('Error getting education resource:', error);
    throw error;
  }
};

// Get all public education resources
export const getPublicEducationResources = async (
  category?: string,
  language?: string,
  tags?: string[],
  limit_count: number = 20
): Promise<EducationResource[]> => {
  try {
    let q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );
    
    // Add category filter if provided
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    // Add language filter if provided
    if (language) {
      q = query(q, where('language', '==', language));
    }
    
    // Add tags filter if provided
    if (tags && tags.length > 0) {
      // Firebase doesn't support array-contains-any with multiple conditions
      // So we'll filter in memory if tags are provided
      q = query(q, where('tags', 'array-contains-any', tags));
    }
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting public education resources:', error);
    throw error;
  }
};

// Get education resources by author
export const getAuthorEducationResources = async (authorId: string): Promise<EducationResource[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting author education resources:', error);
    throw error;
  }
};

// Get education resources for a specific condition
export const getResourcesForCondition = async (condition: string): Promise<EducationResource[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      where('forConditions', 'array-contains', condition),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting resources for condition:', error);
    throw error;
  }
};

// Get education resources for a specific medication
export const getResourcesForMedication = async (medication: string): Promise<EducationResource[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      where('forMedications', 'array-contains', medication),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting resources for medication:', error);
    throw error;
  }
};

// Search education resources
export const searchEducationResources = async (searchTerm: string): Promise<EducationResource[]> => {
  try {
    // Firebase doesn't support text search directly
    // We'll get all public resources and filter in memory
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    const searchTermLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if the search term is in the title, description, or content
      if (
        data.title.toLowerCase().includes(searchTermLower) ||
        data.description.toLowerCase().includes(searchTermLower) ||
        (data.content && data.content.toLowerCase().includes(searchTermLower)) ||
        data.tags.some((tag: string) => tag.toLowerCase().includes(searchTermLower)) ||
        data.category.toLowerCase().includes(searchTermLower)
      ) {
        resources.push({
          id: doc.id,
          ...data
        } as EducationResource);
      }
    });
    
    return resources;
  } catch (error) {
    console.error('Error searching education resources:', error);
    throw error;
  }
};

// Update an education resource
export const updateEducationResource = async (
  resourceId: string,
  updates: Partial<EducationResource>
): Promise<void> => {
  try {
    // Remove id from updates if it exists
    const { id, ...updatesWithoutId } = updates;
    
    await updateDoc(doc(db, 'educationResources', resourceId), {
      ...updatesWithoutId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating education resource:', error);
    throw error;
  }
};

// Delete an education resource
export const deleteEducationResource = async (resourceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'educationResources', resourceId));
  } catch (error) {
    console.error('Error deleting education resource:', error);
    throw error;
  }
};

// Get popular education resources
export const getPopularEducationResources = async (limit_count: number = 10): Promise<EducationResource[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      orderBy('viewCount', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting popular education resources:', error);
    throw error;
  }
};

// Get recent education resources
export const getRecentEducationResources = async (limit_count: number = 10): Promise<EducationResource[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(q);
    
    const resources: EducationResource[] = [];
    
    querySnapshot.forEach((doc) => {
      resources.push({
        id: doc.id,
        ...doc.data()
      } as EducationResource);
    });
    
    return resources;
  } catch (error) {
    console.error('Error getting recent education resources:', error);
    throw error;
  }
};

// Get available categories
export const getEducationCategories = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Use a Set to store unique categories
    const categoriesSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const category = doc.data().category;
      if (category) {
        categoriesSet.add(category);
      }
    });
    
    return Array.from(categoriesSet).sort();
  } catch (error) {
    console.error('Error getting education categories:', error);
    throw error;
  }
};

// Get available tags
export const getEducationTags = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'educationResources'),
      where('isPublic', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Use a Set to store unique tags
    const tagsSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const tags = doc.data().tags;
      if (tags && Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          tagsSet.add(tag);
        });
      }
    });
    
    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Error getting education tags:', error);
    throw error;
  }
};