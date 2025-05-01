// src/screens/NotificationSettings.js
import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Background from '../components/Background';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 280);

const NotificationSettings = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Default to enabled
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the user's notification preference when the screen loads
  useEffect(() => {
    const fetchNotificationPreference = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setNotificationsEnabled(data.notificationsEnabled !== false); // Default to true if not set
        }
      } catch (err) {
        console.error("Error fetching notification preference:", err);
        setError("Failed to load settings: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotificationPreference();
  }, []);

  // Save the user's notification preference to Firestore
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { notificationsEnabled: value }, { merge: true });
      console.log("Notification preference saved:", value);
    } catch (err) {
      console.error("Error saving notification preference:", err);
      setError("Failed to save settings: " + err.message);
      setNotificationsEnabled(!value); // Revert the toggle on error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.goBack()} />
        <Header style={styles.header}>Notification Settings</Header>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary || '#800080'} />
        ) : (
          <View style={styles.content}>
            <View style={styles.settingContainer}>
              <Text style={styles.label}>Enable Appointment Reminders</Text>
              <View style={styles.switchWrapper}>
                <Switch
                  onValueChange={handleToggleNotifications}
                  value={notificationsEnabled}
                  trackColor={{ false: "#767577", true: theme.colors.primary || '#800080' }}
                  thumbColor={notificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
                />
              </View>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        )}
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || theme.colors.surface || '#fff',
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 36,
    color: theme.colors.primary || '#800080',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: SCREEN_WIDTH - 20,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute space between label and switch
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20, // Increased padding for better spacing
    marginBottom: 15,
    borderWidth: 2,
    borderColor: theme.colors.primary || '#800080',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: theme.colors.surface || '#fff',
  },
  label: {
    fontSize: 16,
    color: theme.colors.text || '#000',
    flexShrink: 1, // Allow the label to shrink if needed to prevent overflow
  },
  switchWrapper: {
    width: 50, // Constrain the switch width to prevent overflow
    alignItems: 'flex-end', // Align the switch to the right
  },
  error: {
    fontSize: 16,
    color: theme.colors.error || '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});

export default NotificationSettings;