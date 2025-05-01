import * as Notifications from 'expo-notifications';
import { navigationRef } from '../navigation/navigationRef';
import NotificationService from './NotificationService';

export const setupNotifications = async () => {
  // Set up notification handlers
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

    if (screen && navigationRef.isReady()) {
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

  // Set up appointment reminders
  await NotificationService.setupAppointmentReminders();

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}; 