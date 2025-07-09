import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface DiabetesTask {
  id: string;
  type: 'medication' | 'blood_sugar' | 'exercise' | 'meal' | 'hydration' | 'foot_check' | 'weight';
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  completed: boolean;
  completed_at?: string;
  streak: number;
  icon: string;
  color: string;
}

export interface BloodSugarReading {
  id: string;
  user_id: string;
  reading: number;
  reading_type: 'fasting' | 'post_meal' | 'bedtime' | 'random';
  notes?: string;
  recorded_at: string;
}

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times: string[]; // Array of HH:MM times
  active: boolean;
  created_at: string;
}

export const DEFAULT_DIABETES_TASKS: Omit<DiabetesTask, 'id' | 'completed' | 'completed_at' | 'streak'>[] = [
  {
    type: 'blood_sugar',
    title: 'Check Blood Sugar',
    description: 'Monitor your glucose levels',
    frequency: 'daily',
    time: '08:00',
    icon: '🩸',
    color: '#DC3545'
  },
  {
    type: 'medication',
    title: 'Take Medication',
    description: 'Take your prescribed diabetes medication',
    frequency: 'daily',
    time: '08:30',
    icon: '💊',
    color: '#28A745'
  },
  {
    type: 'exercise',
    title: 'Physical Activity',
    description: '30 minutes of moderate exercise',
    frequency: 'daily',
    time: '17:00',
    icon: '🏃‍♀️',
    color: '#0066CC'
  },
  {
    type: 'meal',
    title: 'Healthy Meal Planning',
    description: 'Plan and track your meals',
    frequency: 'daily',
    time: '12:00',
    icon: '🥗',
    color: '#28A745'
  },
  {
    type: 'hydration',
    title: 'Stay Hydrated',
    description: 'Drink 8 glasses of water',
    frequency: 'daily',
    icon: '💧',
    color: '#17A2B8'
  },
  {
    type: 'foot_check',
    title: 'Foot Inspection',
    description: 'Check feet for cuts, sores, or changes',
    frequency: 'daily',
    time: '21:00',
    icon: '🦶',
    color: '#FFA500'
  },
  {
    type: 'weight',
    title: 'Weight Check',
    description: 'Monitor your weight',
    frequency: 'weekly',
    time: '07:00',
    icon: '⚖️',
    color: '#6F42C1'
  }
];

export async function initializeDiabetesTasks(userId: string): Promise<void> {
  try {
    // Check if user already has tasks
    const { data: existingTasks } = await supabase
      .from('diabetes_tasks')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingTasks && existingTasks.length > 0) {
      return; // Tasks already initialized
    }

    // Create default tasks for the user
    const tasksToInsert = DEFAULT_DIABETES_TASKS.map(task => ({
      user_id: userId,
      type: task.type,
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      time: task.time,
      completed: false,
      streak: 0,
      icon: task.icon,
      color: task.color
    }));

    const { error } = await supabase
      .from('diabetes_tasks')
      .insert(tasksToInsert);

    if (error) throw error;
  } catch (error) {
    console.error('Error initializing diabetes tasks:', error);
    throw error;
  }
}

export async function getDailyTasks(userId: string): Promise<DiabetesTask[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('diabetes_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true });

    if (error) throw error;

    // Reset daily tasks if it's a new day
    const tasksToUpdate: DiabetesTask[] = [];
    const updatedTasks = data?.map(task => {
      const lastCompleted = task.completed_at ? new Date(task.completed_at).toISOString().split('T')[0] : null;
      const shouldReset = task.frequency === 'daily' && task.completed && lastCompleted !== today;
      
      if (shouldReset) {
        tasksToUpdate.push({ ...task, completed: false, completed_at: undefined });
        return { ...task, completed: false, completed_at: null };
      }
      
      return task;
    }) || [];

    // Update tasks that need to be reset
    if (tasksToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('diabetes_tasks')
        .upsert(tasksToUpdate.map(task => ({
          id: task.id,
          completed: false,
          completed_at: null
        })));

      if (updateError) console.error('Error resetting daily tasks:', updateError);
    }

    return updatedTasks;
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return [];
  }
}

export async function completeTask(taskId: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Get current task to update streak
    const { data: currentTask } = await supabase
      .from('diabetes_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!currentTask) throw new Error('Task not found');

    const newStreak = currentTask.completed ? currentTask.streak : currentTask.streak + 1;

    const { error } = await supabase
      .from('diabetes_tasks')
      .update({
        completed: true,
        completed_at: now,
        streak: newStreak
      })
      .eq('id', taskId);

    if (error) throw error;

    // Send congratulatory notification for streaks
    if (newStreak > 0 && newStreak % 7 === 0) {
      if (Platform.OS === 'web') {
        // Skip notifications on web
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Streak Achievement!',
          body: `Congratulations! You've completed "${currentTask.title}" for ${newStreak} days in a row!`,
          sound: 'default',
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

export async function addBloodSugarReading(
  userId: string,
  reading: number,
  type: BloodSugarReading['reading_type'],
  notes?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('blood_sugar_readings')
      .insert({
        user_id: userId,
        reading,
        reading_type: type,
        notes,
        recorded_at: new Date().toISOString()
      });

    if (error) throw error;

    // Check if reading is concerning and send notification
    if (reading < 70 || reading > 180) {
      if (Platform.OS === 'web') {
        // Skip notifications on web
        return;
      }
      const message = reading < 70 
        ? 'Your blood sugar is low. Consider having a quick-acting carbohydrate.'
        : 'Your blood sugar is high. Consider checking with your healthcare provider.';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Blood Sugar Alert',
          body: message,
          sound: 'default',
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error adding blood sugar reading:', error);
    throw error;
  }
}

export async function getBloodSugarHistory(userId: string, days: number = 30): Promise<BloodSugarReading[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('blood_sugar_readings')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blood sugar history:', error);
    return [];
  }
}

export async function addMedicationReminder(
  userId: string,
  medicationName: string,
  dosage: string,
  frequency: string,
  times: string[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('medication_reminders')
      .insert({
        user_id: userId,
        medication_name: medicationName,
        dosage,
        frequency,
        times,
        active: true,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    if (Platform.OS === 'web') {
      // Skip notifications on web
      return;
    }
    // Schedule notifications for each time
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${medicationName} (${dosage})`,
          sound: 'default',
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }
  } catch (error) {
    console.error('Error adding medication reminder:', error);
    throw error;
  }
}

export async function getMedicationReminders(userId: string): Promise<MedicationReminder[]> {
  try {
    const { data, error } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medication reminders:', error);
    return [];
  }
}

export function getHealthTips(riskCategory?: string): string[] {
  const generalTips = [
    "Monitor your blood sugar regularly to understand how different foods affect you.",
    "Stay hydrated - aim for 8 glasses of water daily.",
    "Get 7-9 hours of quality sleep each night.",
    "Check your feet daily for cuts, sores, or changes.",
    "Take your medications as prescribed, even if you feel fine.",
    "Keep healthy snacks handy for low blood sugar episodes.",
    "Exercise regularly, but check your blood sugar before and after.",
    "Learn to count carbohydrates to better manage your meals."
  ];

  const riskSpecificTips: Record<string, string[]> = {
    critical: [
      "Work closely with your healthcare team to adjust your treatment plan.",
      "Consider continuous glucose monitoring for better control.",
      "Keep emergency glucose tablets or gel with you at all times.",
      "Schedule regular eye and foot exams to prevent complications."
    ],
    high: [
      "Focus on consistent meal timing to help stabilize blood sugar.",
      "Consider working with a certified diabetes educator.",
      "Monitor for signs of complications and report them promptly.",
      "Keep a detailed log of blood sugar, food, and activity."
    ]
  };

  const tips = [...generalTips];
  if (riskCategory && riskSpecificTips[riskCategory]) {
    tips.push(...riskSpecificTips[riskCategory]);
  }

  // Return 3-4 random tips
  const shuffled = tips.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

export function calculateA1CEstimate(readings: BloodSugarReading[]): number {
  if (readings.length === 0) return 0;
  
  // Calculate average glucose from readings
  const totalGlucose = readings.reduce((sum, reading) => sum + reading.reading, 0);
  const avgGlucose = totalGlucose / readings.length;
  
  // Convert average glucose to estimated A1C using the formula:
  // A1C = (average glucose + 46.7) / 28.7
  const estimatedA1C = (avgGlucose + 46.7) / 28.7;
  
  return Math.round(estimatedA1C * 10) / 10; // Round to 1 decimal place
}