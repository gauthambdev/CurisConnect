import * as Notifications from 'expo-notifications';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

class NotificationService {
  static async setupAppointmentReminders() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log('No user logged in, skipping appointment reminders setup');
      return;
    }

    // Query appointments for the current user
    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('userId', '==', user.uid));

    // Set up real-time listener for appointments
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new notifications for each appointment
      snapshot.forEach(async (doc) => {
        const appointment = doc.data();
        const appointmentTime = appointment.date.toDate();
        const now = new Date();

        // Only schedule notifications for future appointments
        if (appointmentTime > now) {
          // Schedule reminder 1 hour before
          await this.scheduleNotification(
            appointmentTime,
            -60 * 60 * 1000, // 1 hour before
            'Appointment Reminder',
            `You have an appointment in 1 hour with ${appointment.doctorName}`,
            { screen: 'UpcomingAppointments', appointmentId: doc.id }
          );

          // Schedule reminder 1 day before
          await this.scheduleNotification(
            appointmentTime,
            -24 * 60 * 60 * 1000, // 1 day before
            'Appointment Reminder',
            `You have an appointment tomorrow with ${appointment.doctorName}`,
            { screen: 'UpcomingAppointments', appointmentId: doc.id }
          );
        }
      });
    });

    return unsubscribe;
  }

  static async scheduleNotification(triggerDate, offset, title, body, data) {
    const trigger = new Date(triggerDate.getTime() + offset);
    
    if (trigger > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
    }
  }

  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }
  }
}

export default NotificationService; 