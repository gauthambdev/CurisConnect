import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NotificationService from '../services/NotificationService';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children, userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [indexError, setIndexError] = useState(false);

  const subscribeToNotifications = (role) => {
    const user = auth.currentUser;
    if (!user) return () => {};

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, 
        (snapshot) => {
          const notificationsList = [];
          let unread = 0;

          snapshot.forEach((doc) => {
            const notification = {
              id: doc.id,
              ...doc.data(),
            };
            notificationsList.push(notification);
            if (!notification.read) {
              unread++;
            }
          });

          console.log('Fetched notifications:', notificationsList);
          setNotifications(notificationsList);
          setUnreadCount(unread);
          setIndexError(false);
        },
        (error) => {
          console.error('Error in notification snapshot:', error);
          if (error.code === 'failed-precondition') {
            setIndexError(true);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      if (error.code === 'failed-precondition') {
        setIndexError(true);
      }
      return () => {};
    }
  };

  useEffect(() => {
    // Request notification permission
    const requestPermission = async () => {
      const hasPermission = await NotificationService.checkPermission();
      if (!hasPermission) {
        await NotificationService.requestPermission();
      }
    };

    requestPermission();

    // Setup notification listeners
    const notificationSubscription = NotificationService.addNotificationListener(handleNotification);
    const responseSubscription = NotificationService.addResponseListener(handleNotificationResponse);

    // Subscribe to notifications from Firestore using userRole
    const unsubscribe = subscribeToNotifications(userRole || 'patient');

    return () => {
      notificationSubscription();
      responseSubscription();
      unsubscribe();
      NotificationService.removeListeners();
    };
  }, [userRole]);

  const handleNotification = async (notification) => {
    const user = auth.currentUser;
    if (!user) return;

    const { title, body, data } = notification;
    
    // Add notification to Firestore
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      data,
      userId: user.uid,
      read: false,
      createdAt: new Date(),
    });
  };

  const handleNotificationResponse = (response) => {
    const { notification } = response;
    if (notification?.request?.identifier) {
      markAsRead(notification.request.identifier);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = notifications
        .filter(notification => !notification.read)
        .map(notification => 
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
          })
        );

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const sendNotification = async (title, body, data = {}) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        data,
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
        indexError,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 