import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

const AppPreferences = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('1day');
  const [darkTheme, setDarkTheme] = useState(false);
  const [defaultSpecialty, setDefaultSpecialty] = useState('');
  const [contactMethod, setContactMethod] = useState('push');
  const [shareMedicalHistory, setShareMedicalHistory] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const notifications = await AsyncStorage.getItem('notificationsEnabled');
        const frequency = await AsyncStorage.getItem('reminderFrequency');
        const themePreference = await AsyncStorage.getItem('darkTheme');
        const specialty = await AsyncStorage.getItem('defaultSpecialty');
        const method = await AsyncStorage.getItem('contactMethod');
        const medicalHistory = await AsyncStorage.getItem('shareMedicalHistory');
        if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
        if (frequency !== null) setReminderFrequency(frequency);
        if (themePreference !== null) setDarkTheme(JSON.parse(themePreference));
        if (specialty !== null) setDefaultSpecialty(specialty);
        if (method !== null) setContactMethod(method);
        if (medicalHistory !== null) setShareMedicalHistory(JSON.parse(medicalHistory));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const savePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error saving ${key} preference:`, error);
    }
  };

  const toggleNotifications = (value) => {
    setNotificationsEnabled(value);
    savePreference('notificationsEnabled', JSON.stringify(value));
  };

  const setFrequency = (value) => {
    setReminderFrequency(value);
    savePreference('reminderFrequency', value);
  };

  const toggleTheme = (value) => {
    setDarkTheme(value);
    savePreference('darkTheme', JSON.stringify(value));
  };

  const setSpecialty = (value) => {
    setDefaultSpecialty(value);
    savePreference('defaultSpecialty', value);
  };

  const setContact = (value) => {
    setContactMethod(value);
    savePreference('contactMethod', value);
  };

  const toggleMedicalHistory = (value) => {
    setShareMedicalHistory(value);
    savePreference('shareMedicalHistory', JSON.stringify(value));
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'StartScreen' }],
              });
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Add logic to delete user data from Firestore (e.g., appointments, medical history)
              await auth.currentUser.delete();
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'StartScreen' }],
              });
              Alert.alert("Success", "Account deleted successfully.");
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert("Error", "Failed to delete account. Please contact support.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.goBack()} />
        <Header style={styles.header}>App Preferences</Header>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Notifications */}
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Enable Appointment Reminders</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Reminder Frequency */}
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>Reminder Frequency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reminderFrequency}
                onValueChange={setFrequency}
                style={styles.picker}
                dropdownIconColor={theme.colors.primary}
              >
                <Picker.Item label="1 Day Before" value="1day" />
                <Picker.Item label="2 Hours Before" value="2hours" />
                <Picker.Item label="1 Hour Before" value="1hour" />
              </Picker>
            </View>
          </View>

          {/* Theme Toggle */}
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Dark Theme</Text>
            <Switch
              value={darkTheme}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={darkTheme ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Default Specialty */}
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>Default Specialty</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={defaultSpecialty}
                onValueChange={setSpecialty}
                style={styles.picker}
                dropdownIconColor={theme.colors.primary}
                placeholder="Select Specialty"
                placeholderStyle={styles.placeholder}
              >
                <Picker.Item label="Select Specialty" value="" />
                <Picker.Item label="General Practice" value="General Practice" />
                <Picker.Item label="Cardiology" value="Cardiology" />
                <Picker.Item label="Dermatology" value="Dermatology" />
                <Picker.Item label="Neurology" value="Neurology" />
              </Picker>
            </View>
          </View>

          {/* Contact Method */}
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>Preferred Contact Method</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={contactMethod}
                onValueChange={setContact}
                style={styles.picker}
                dropdownIconColor={theme.colors.primary}
              >
                <Picker.Item label="Push Notification" value="push" />
                <Picker.Item label="Email" value="email" />
                <Picker.Item label="SMS" value="sms" />
              </Picker>
            </View>
          </View>

          {/* Share Medical History */}
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Share Medical History with Doctors</Text>
            <Switch
              value={shareMedicalHistory}
              onValueChange={toggleMedicalHistory}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={shareMedicalHistory ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Edit Profile */}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ProfileScreen')}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Edit Profile
          </Button>

          {/* Change Password */}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ChangePassword')}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Change Password
          </Button>

          {/* Sign Out */}
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            labelStyle={styles.buttonLabel}
          >
            Sign Out
          </Button>

          {/* Delete Account */}
          <Button
            mode="outlined"
            onPress={handleDeleteAccount}
            style={[styles.button, { borderColor: theme.colors.error }]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.error }]}
          >
            Delete Account
          </Button>

          {/* App Version */}
          <Text style={styles.appVersion}>App Version: 1.0.0</Text>
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || theme.colors.surface || '#fff',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  preferenceItem: {
    marginBottom: 20,
  },
  preferenceText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    marginTop: 5,
  },
  picker: {
    height: 50,
    width: '100%',
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.placeholder || '#999',
  },
  button: {
    marginBottom: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderColor: theme.colors.primary,
  },
  logoutButton: {
    backgroundColor: theme.colors.error || '#ff0000',
    borderWidth: 0,
  },
  buttonLabel: {
    fontSize: 16,
    color: theme.colors.text || '#000',
  },
  appVersion: {
    fontSize: 14,
    color: theme.colors.text || '#000',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AppPreferences;