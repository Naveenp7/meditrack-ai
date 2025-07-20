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
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { logActivity } from './analyticsService';
import { createNotification } from './notificationService';
import { createReminder } from './reminderService';

// Care plan interfaces
export interface CarePlanGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Timestamp;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number; // 0-100
  notes?: string;
}

export interface CarePlanTask {
  id: string;
  title: string;
  description: string;
  dueDate?: Timestamp;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  assignedTo?: string; // userId
  reminderSet?: boolean;
  reminderId?: string;
  notes?: string;
}

export interface CarePlan {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  condition: string;
  goals: CarePlanGoal[];
  tasks: CarePlanTask[];
  startDate: Timestamp;
  endDate?: Timestamp;
  status: 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a new care plan
export const createCarePlan = async (
  patientId: string,
  doctorId: string,
  title: string,
  description: string,
  condition: string,
  goals: Omit<CarePlanGoal, 'id'>[],
  tasks: Omit<CarePlanTask, 'id'>[],
  startDate: Date,
  endDate?: Date,
  notes?: string
): Promise<string> => {
  try {
    // Prepare goals with IDs
    const goalsWithIds = goals.map(goal => ({
      ...goal,
      id: `goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: goal.status || 'not_started',
      progress: goal.progress || 0
    }));

    // Prepare tasks with IDs
    const tasksWithIds = tasks.map(task => ({
      ...task,
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: task.status || 'pending'
    }));

    const carePlanData = {
      patientId,
      doctorId,
      title,
      description,
      condition,
      goals: goalsWithIds,
      tasks: tasksWithIds,
      startDate: Timestamp.fromDate(startDate),
      endDate: endDate ? Timestamp.fromDate(endDate) : null,
      status: 'active',
      progress: 0, // Initial progress
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const carePlanRef = await addDoc(collection(db, 'carePlans'), carePlanData);

    // Create reminders for tasks if dueDate is specified
    for (const task of tasksWithIds) {
      if (task.dueDate) {
        const reminderId = await createReminder(
          patientId,
          'custom',
          `Care Plan Task: ${task.title}`,
          task.dueDate.toDate().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
          undefined, // time parameter
          task.description,
          {
            type: 'medical-record',
            id: carePlanRef.id
          },
          'once' // recurrence parameter
        );

        // Update the task with reminder information
        task.reminderSet = true;
        task.reminderId = reminderId;
      }
    }

    // Update the care plan with the updated tasks (with reminder info)
    await updateDoc(doc(db, 'carePlans', carePlanRef.id), {
      tasks: tasksWithIds
    });

    // Log activity
    await logActivity(
      doctorId,
      'doctor',
      'create',
      'medical-record',
      carePlanRef.id,
      JSON.stringify({
        patientId,
        carePlanId: carePlanRef.id,
        title
      })
    );

    // Create notification for the patient
    await createNotification(
      patientId,
      'New Care Plan Created',
      `A new care plan "${title}" has been created for you.`,
      'info'
    );

    return carePlanRef.id;
  } catch (error) {
    console.error('Error creating care plan:', error);
    throw error;
  }
};

// Get a care plan by ID
export const getCarePlan = async (carePlanId: string): Promise<CarePlan | null> => {
  try {
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));

    if (!carePlanDoc.exists()) {
      return null;
    }

    return {
      id: carePlanDoc.id,
      ...carePlanDoc.data()
    } as CarePlan;
  } catch (error) {
    console.error('Error getting care plan:', error);
    throw error;
  }
};

// Get all care plans for a patient
export const getPatientCarePlans = async (patientId: string): Promise<CarePlan[]> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const carePlans: CarePlan[] = [];

    querySnapshot.forEach((doc) => {
      carePlans.push({
        id: doc.id,
        ...doc.data()
      } as CarePlan);
    });

    return carePlans;
  } catch (error) {
    console.error('Error getting patient care plans:', error);
    throw error;
  }
};

// Get active care plans for a patient
export const getActivePatientCarePlans = async (patientId: string): Promise<CarePlan[]> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      where('patientId', '==', patientId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const carePlans: CarePlan[] = [];

    querySnapshot.forEach((doc) => {
      carePlans.push({
        id: doc.id,
        ...doc.data()
      } as CarePlan);
    });

    return carePlans;
  } catch (error) {
    console.error('Error getting active patient care plans:', error);
    throw error;
  }
};

// Get care plans created by a doctor
export const getDoctorCarePlans = async (doctorId: string): Promise<CarePlan[]> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const carePlans: CarePlan[] = [];

    querySnapshot.forEach((doc) => {
      carePlans.push({
        id: doc.id,
        ...doc.data()
      } as CarePlan);
    });

    return carePlans;
  } catch (error) {
    console.error('Error getting doctor care plans:', error);
    throw error;
  }
};

// Get care plans by condition
export const getCarePlansByCondition = async (condition: string): Promise<CarePlan[]> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      where('condition', '==', condition),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const carePlans: CarePlan[] = [];

    querySnapshot.forEach((doc) => {
      carePlans.push({
        id: doc.id,
        ...doc.data()
      } as CarePlan);
    });

    return carePlans;
  } catch (error) {
    console.error('Error getting care plans by condition:', error);
    throw error;
  }
};

// Update a care plan
export const updateCarePlan = async (
  carePlanId: string,
  updates: Partial<Omit<CarePlan, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    
    // Prepare the update object
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'carePlans', carePlanId), updateData);
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({
        patientId: carePlanData.patientId,
        carePlanId,
        updates: Object.keys(updates)
      })
    );
    
    // Create notification for the patient if significant changes were made
    if (updates.title || updates.description || updates.status) {
      await createNotification(
        carePlanData.patientId,
        'Care Plan Updated',
        `Your care plan "${carePlanData.title}" has been updated.`,
        'info'
      );
    }
  } catch (error) {
    console.error('Error updating care plan:', error);
    throw error;
  }
};

// Add a goal to a care plan
export const addCarePlanGoal = async (
  carePlanId: string,
  goal: Omit<CarePlanGoal, 'id'>
): Promise<string> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    const goals = carePlanData.goals || [];
    
    // Create a new goal with ID
    const newGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: goal.status || 'not_started',
      progress: goal.progress || 0
    };
    
    // Add the new goal to the goals array
    goals.push(newGoal);
    
    // Update the care plan
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      goals,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({ patientId: carePlanData.patientId, goalId: newGoal.id, goalTitle: newGoal.title, action: 'goal_added' })
    );
    
    return newGoal.id;
  } catch (error) {
    console.error('Error adding care plan goal:', error);
    throw error;
  }
};

// Update a goal in a care plan
export const updateCarePlanGoal = async (
  carePlanId: string,
  goalId: string,
  updates: Partial<Omit<CarePlanGoal, 'id'>>
): Promise<void> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    const goals = carePlanData.goals || [];
    
    // Find the goal to update
    const goalIndex = goals.findIndex((g: any) => g.id === goalId);
    
    if (goalIndex === -1) {
      throw new Error('Goal not found in care plan');
    }
    
    // Update the goal
    goals[goalIndex] = {
      ...goals[goalIndex],
      ...updates
    };
    
    // Recalculate overall care plan progress based on goals
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => g.status === 'completed').length;
    const inProgressGoals = goals.filter((g: any) => g.status === 'in_progress').length;
    
    // Calculate progress (completed goals + partial credit for in-progress goals)
    const progress = totalGoals > 0 
      ? Math.round(((completedGoals + (inProgressGoals * 0.5)) / totalGoals) * 100) 
      : 0;
    
    // Update the care plan
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      goals,
      progress,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({
        patientId: carePlanData.patientId,
        carePlanId,
        goalId,
        updates: Object.keys(updates)
      })
    );
    
    // If goal was completed, notify the patient
    if (updates.status === 'completed') {
      await createNotification(
        carePlanData.patientId,
        'Care Plan Goal Completed',
        `A goal in your care plan "${carePlanData.title}" has been marked as completed.`,
        'success'
      );
    }
  } catch (error) {
    console.error('Error updating care plan goal:', error);
    throw error;
  }
};

// Add a task to a care plan
export const addCarePlanTask = async (
  carePlanId: string,
  task: Omit<CarePlanTask, 'id' | 'reminderSet' | 'reminderId'>
): Promise<string> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    const tasks = carePlanData.tasks || [];
    
    // Create a new task with ID
    const newTask: CarePlanTask = {
      ...task,
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: task.status || 'pending',
      reminderSet: false,
      reminderId: undefined
    };
    
    // Create a reminder if dueDate is specified
    if (task.dueDate) {
      const reminderId = await createReminder(
        carePlanData.patientId,
        'custom',
        `Care Plan Task: ${task.title}`,
        task.dueDate.toDate().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        undefined, // time parameter
        task.description,
        {
          type: 'medical-record',
          id: carePlanId
        },
        'once' // recurrence parameter
      );
      
      newTask.reminderSet = true;
      newTask.reminderId = reminderId;
    }
    
    // Add the new task to the tasks array
    tasks.push(newTask);
    
    // Update the care plan
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      tasks,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'create',
      'medical-record',
      carePlanId,
      JSON.stringify({
        patientId: carePlanData.patientId,
        carePlanId,
        taskId: newTask.id,
        taskTitle: newTask.title
      })
    );
    
    // Notify the patient about the new task
    await createNotification(
      carePlanData.patientId,
      'New Care Plan Task',
      `A new task "${newTask.title}" has been added to your care plan.`,
      'info'
    );
    
    return newTask.id;
  } catch (error) {
    console.error('Error adding care plan task:', error);
    throw error;
  }
};

// Update a task in a care plan
export const updateCarePlanTask = async (
  carePlanId: string,
  taskId: string,
  updates: Partial<Omit<CarePlanTask, 'id' | 'reminderSet' | 'reminderId'>>
): Promise<void> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    const tasks = carePlanData.tasks || [];
    
    // Find the task to update
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found in care plan');
    }
    
    const currentTask = tasks[taskIndex];
    
    // Update the task
    tasks[taskIndex] = {
      ...currentTask,
      ...updates
    };
    
    // Update the care plan
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      tasks,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      updates.assignedTo || carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({
        patientId: carePlanData.patientId,
        carePlanId,
        taskId,
        updates: Object.keys(updates)
      })
    );
    
    // If task was completed, notify the patient
    if (updates.status === 'completed') {
      await createNotification(
        carePlanData.patientId,
        'Care Plan Task Completed',
        `A task in your care plan "${carePlanData.title}" has been marked as completed.`,
        'success'
      );
    }
  } catch (error) {
    console.error('Error updating care plan task:', error);
    throw error;
  }
};

// Complete a care plan
export const completeCarePlan = async (carePlanId: string, notes?: string): Promise<void> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    
    // Update the care plan status
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      status: 'completed',
      endDate: Timestamp.now(),
      notes: notes ? `${carePlanData.notes || ''} \n\nCompletion notes: ${notes}` : carePlanData.notes,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({
        patientId: carePlanData.patientId,
        carePlanId,
        title: carePlanData.title
      })
    );
    
    // Notify the patient
    await createNotification(
      carePlanData.patientId,
      'Care Plan Completed',
      `Your care plan "${carePlanData.title}" has been marked as completed.`,
      'success'
    );
  } catch (error) {
    console.error('Error completing care plan:', error);
    throw error;
  }
};

// Cancel a care plan
export const cancelCarePlan = async (carePlanId: string, reason: string): Promise<void> => {
  try {
    // Get the current care plan
    const carePlanDoc = await getDoc(doc(db, 'carePlans', carePlanId));
    
    if (!carePlanDoc.exists()) {
      throw new Error('Care plan not found');
    }
    
    const carePlanData = carePlanDoc.data();
    
    // Update the care plan status
    await updateDoc(doc(db, 'carePlans', carePlanId), {
      status: 'cancelled',
      endDate: Timestamp.now(),
      notes: `${carePlanData.notes || ''} \n\nCancellation reason: ${reason}`,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(
      carePlanData.doctorId,
      'doctor',
      'update',
      'medical-record',
      carePlanId,
      JSON.stringify({ patientId: carePlanData.patientId, title: carePlanData.title, reason, status: 'cancelled' })
    );
    
    // Notify the patient
    await createNotification(
      carePlanData.patientId,
      'Care Plan Cancelled',
      `Your care plan "${carePlanData.title}" has been cancelled.`,
      'warning'
    );
  } catch (error) {
    console.error('Error cancelling care plan:', error);
    throw error;
  }
};

// Delete a care plan
export const deleteCarePlan = async (carePlanId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'carePlans', carePlanId));
  } catch (error) {
    console.error('Error deleting care plan:', error);
    throw error;
  }
};

// Get care plan templates (most recently created care plans for reference)
export const getCarePlanTemplates = async (limitCount: number = 5): Promise<CarePlan[]> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    const templates: CarePlan[] = [];

    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      } as CarePlan);
    });

    return templates;
  } catch (error) {
    console.error('Error getting care plan templates:', error);
    throw error;
  }
};

// Get care plan progress statistics for a patient
export const getPatientCarePlanStats = async (patientId: string): Promise<{
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  averageProgress: number;
}> => {
  try {
    const q = query(
      collection(db, 'carePlans'),
      where('patientId', '==', patientId)
    );

    const querySnapshot = await getDocs(q);

    let total = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    let progressSum = 0;

    querySnapshot.forEach((doc) => {
      const carePlan = doc.data();
      total++;

      if (carePlan.status === 'active') active++;
      if (carePlan.status === 'completed') completed++;
      if (carePlan.status === 'cancelled') cancelled++;

      progressSum += carePlan.progress || 0;
    });

    const averageProgress = total > 0 ? Math.round(progressSum / total) : 0;

    return {
      total,
      active,
      completed,
      cancelled,
      averageProgress
    };
  } catch (error) {
    console.error('Error getting patient care plan stats:', error);
    throw error;
  }
};