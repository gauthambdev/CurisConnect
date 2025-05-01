import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NotificationService from '../services/NotificationService';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

    // Subscribe to notifications from Firestore
    const unsubscribe = subscribeToNotifications();

    return () => {
      notificationSubscription();
      responseSubscription();
      unsubscribe();
      NotificationService.removeListeners();
    };
  }, []);

  const handleNotification = async (notification) => {
    const { title, body, data } = notification;
    
    // Add notification to Firestore
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      data,
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

  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (notificationsToSave) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    saveNotifications([]);
  };

  const addNotification = (title, body, data = {}) => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification,
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