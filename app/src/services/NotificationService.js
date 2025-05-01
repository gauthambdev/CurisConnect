import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import { navigationRef } from '../navigation/navigationRef';

class NotificationService {
  static listeners = new Set();

  static addNotificationListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  static addResponseListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  static removeListeners() {
    this.listeners.clear();
  }

  static notifyListeners(notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  static async requestPermission() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted');
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async getToken() {
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async checkPermission() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  static async setupListeners() {
    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Handle notification received while app is in foreground
      const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Foreground notification received:', notification);
      });

      // Handle notification response (user taps notification)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { notification } = response;
        const { screen, appointmentId } = notification.request.content.data;

        if (screen) {
          // Navigate to the appropriate screen
          if (screen === 'UpcomingAppointments') {
            navigationRef.navigate('PatientTabs', {
              screen: 'Appointments',
              params: { appointmentId },
            });
          } else if (screen === 'BookAppointments') {
            navigationRef.navigate('BookAppointments', { appointmentId });
          }
        }
      });

      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }

  static async scheduleAppointmentReminder(appointment) {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Notification permission not granted');
        }
      }

      const appointmentTime = appointment.date.toDate();
      const reminders = [
        { offset: 60 * 60 * 1000, label: 'in 1 hour' },
        { offset: 30 * 60 * 1000, label: 'in 30 minutes' },
        { offset: 15 * 60 * 1000, label: 'in 15 minutes' },
        { offset: 5 * 60 * 1000, label: 'in 5 minutes' },
        { offset: 0, label: 'now' },
      ];

      let scheduledCount = 0;
      for (const reminder of reminders) {
        const triggerTime = new Date(appointmentTime.getTime() - reminder.offset);
        if (triggerTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Upcoming Appointment',
              body:
                reminder.label === 'now'
                  ? `Your appointment with ${appointment.doctorName} is now.`
                  : `You have an appointment with ${appointment.doctorName} ${reminder.label}`,
              data: {
                screen: 'UpcomingAppointments',
                appointmentId: appointment.id,
              },
            },
            trigger: { date: triggerTime },
          });
          scheduledCount++;
        }
        // If triggerTime is in the past, just skip it silently
      }

      if (scheduledCount > 0) {
        console.log('Appointment reminders scheduled successfully');
      } else {
        console.log('No appointment reminders scheduled (all times in the past)');
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
      throw error;
    }
  }

  static async cancelAppointmentReminder(appointmentId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationToCancel = scheduledNotifications.find(
        notification => notification.content.data.appointmentId === appointmentId
      );

      if (notificationToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notificationToCancel.identifier);
        console.log('Appointment reminder cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling appointment reminder:', error);
      throw error;
    }
  }

  static async setupAppointmentReminders() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      // Query upcoming appointments
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('patientId', '==', user.uid),
        where('status', '==', 'scheduled')
      );

      // Set up real-time listener for appointments
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Cancel all existing notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule new notifications for upcoming appointments
        for (const appointment of appointments) {
          try {
            await this.scheduleAppointmentReminder(appointment);
          } catch (error) {
            console.error(`Error scheduling reminder for appointment ${appointment.id}:`, error);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up appointment reminders:', error);
      throw error;
    }
  }

  static async createLocalNotification(title, body, data = {}) {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Notification permission not granted');
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error creating local notification:', error);
      throw error;
    }
  }
}

export default NotificationService; 