import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationPreferences {
  medication: boolean;
  hydration: boolean;
  exercise: boolean;
  meals: boolean;
  checkups: boolean;
  motivational: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: keyof NotificationPreferences;
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'web') {
    // Web notifications require service worker setup
    console.log('Web push notifications require additional setup');
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push notification token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleHealthReminders(preferences: NotificationPreferences): Promise<void> {
  // Cancel all existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const notifications: ScheduledNotification[] = [];

  if (preferences.medication) {
    notifications.push({
      id: 'medication-morning',
      type: 'medication',
      title: 'Medication Reminder',
      body: 'Time to take your morning medication',
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });

    notifications.push({
      id: 'medication-evening',
      type: 'medication',
      title: 'Medication Reminder',
      body: 'Time to take your evening medication',
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  }

  if (preferences.hydration) {
    // Schedule hydration reminders every 2 hours during the day
    for (let hour = 8; hour <= 20; hour += 2) {
      notifications.push({
        id: `hydration-${hour}`,
        type: 'hydration',
        title: 'Stay Hydrated! 💧',
        body: 'Remember to drink water to maintain healthy blood sugar levels',
        trigger: {
          hour,
          minute: 0,
          repeats: true,
        },
      });
    }
  }

  if (preferences.exercise) {
    notifications.push({
      id: 'exercise-daily',
      type: 'exercise',
      title: 'Time to Move! 🚶‍♀️',
      body: 'A 10-minute walk can help regulate your blood sugar',
      trigger: {
        hour: 17,
        minute: 0,
        repeats: true,
      },
    });
  }

  if (preferences.meals) {
    const mealTimes = [
      { id: 'breakfast', hour: 7, title: 'Breakfast Time', body: 'Start your day with a balanced meal' },
      { id: 'lunch', hour: 12, title: 'Lunch Time', body: 'Remember to eat a healthy lunch' },
      { id: 'dinner', hour: 18, title: 'Dinner Time', body: 'Time for a nutritious dinner' },
    ];

    mealTimes.forEach(meal => {
      notifications.push({
        id: `meal-${meal.id}`,
        type: 'meals',
        title: meal.title,
        body: meal.body,
        trigger: {
          hour: meal.hour,
          minute: 0,
          repeats: true,
        },
      });
    });
  }

  if (preferences.checkups) {
    notifications.push({
      id: 'monthly-checkup',
      type: 'checkups',
      title: 'Health Check Reminder',
      body: 'Consider scheduling your monthly health assessment',
      trigger: {
        day: 1,
        hour: 10,
        minute: 0,
        repeats: true,
      },
    });
  }

  if (preferences.motivational) {
    const motivationalMessages = [
      'You\'re doing great! Keep up the healthy habits 🌟',
      'Small steps lead to big changes. Stay consistent! 💪',
      'Your health journey matters. Keep going! ❤️',
      'Every healthy choice counts. You\'ve got this! 🎯',
    ];

    notifications.push({
      id: 'motivational-weekly',
      type: 'motivational',
      title: 'Weekly Motivation',
      body: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
      trigger: {
        weekday: 1, // Monday
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  // Schedule all notifications
  for (const notification of notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
        },
        trigger: notification.trigger,
      });
    } catch (error) {
      console.error(`Error scheduling notification ${notification.id}:`, error);
    }
  }

  console.log(`Scheduled ${notifications.length} notifications`);
}

export async function sendContextualNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending contextual notification:', error);
  }
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}