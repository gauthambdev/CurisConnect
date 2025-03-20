import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions, Modal, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Added getDoc
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import * as Notifications from 'expo-notifications';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 280);

const BookAppointments = ({ navigation }) => {
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState(null);
  const [dateText, setDateText] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderSeconds, setReminderSeconds] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // New state for notification preference

  const specialties = [
    "General Practice",
    "Pulmonology",
    "Gastroenterology",
    "Cardiology",
    "Neurology",
    "Dermatology",
    "Infectious Disease",
    "Urology",
    "Otolaryngology",
    "Allergy and Immunology",
    "Hematology",
  ];

  const times = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  // Request notification permissions, set up notification handler, and fetch notification preference
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('appointment-reminders', {
        name: 'Appointment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          alert('Notification permissions are required to send appointment reminders.');
        }
      }
    };

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
        setError("Failed to load notification settings: " + err.message);
      }
    };

    requestNotificationPermissions();
    fetchNotificationPreference();
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateDate = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return "Selected date cannot be in the past.";
    }
    return null;
  };

  const isValidDate = (year, month, day) => {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleDateInput = (text) => {
    setDateText(text);
    const datePattern = /^\d{4}[-.]\d{2}[-.]\d{2}$/;
    if (datePattern.test(text)) {
      const normalizedText = text.replace(/\./g, '-');
      const [year, month, day] = normalizedText.split('-').map(Number);
      if (year < 1900 || year > 2100) {
        setError("Year must be between 1900 and 2100.");
        setDate(null);
        return;
      }
      if (month < 1 || month > 12) {
        setError("Month must be between 01 and 12.");
        setDate(null);
        return;
      }
      if (day < 1 || day > 31) {
        setError("Day must be between 01 and 31.");
        setDate(null);
        return;
      }
      if (!isValidDate(year, month, day)) {
        setError("Invalid date (e.g., 2025-02-30 is not a valid date).");
        setDate(null);
        return;
      }
      const parsedDate = new Date(year, month - 1, day);
      const dateError = validateDate(parsedDate);
      if (dateError) {
        setError(dateError);
        setDate(null);
      } else {
        setError(null);
        setDate(parsedDate);
        setDateText(normalizedText);
      }
    } else {
      setDate(null);
      setError(null);
    }
  };

  const parseAppointmentDateTime = (date, time) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  };

  const scheduleNotification = async (specialty, date, time) => {
    // Only schedule a notification if notifications are enabled
    if (!notificationsEnabled) {
      console.log("Notifications are disabled, skipping scheduling.");
      return;
    }

    try {
      const now = new Date();
      console.log("Current time:", now);

      const seconds = parseInt(reminderSeconds, 10);
      console.log("Parsed reminderSeconds:", seconds);

      let triggerSeconds;
      if (!isNaN(seconds) && seconds > 0) {
        triggerSeconds = Math.max(seconds, 5);
        console.log(`Scheduling notification ${triggerSeconds} seconds from now`);
      } else {
        const appointmentDateTime = parseAppointmentDateTime(date, time);
        const reminderDateTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
        console.log("Using default (1 hour before appointment):", reminderDateTime);

        const timeDiffMs = reminderDateTime.getTime() - now.getTime();
        triggerSeconds = Math.floor(timeDiffMs / 1000);

        if (triggerSeconds <= 0) {
          console.log("Reminder time is in the past, notification not scheduled.");
          setError("Reminder time must be in the future. Please select a future appointment time.");
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Appointment Reminder",
          body: `You have an appointment with ${specialty} at ${time} on ${formatDate(date)}.`,
          data: { specialty, date: formatDate(date), time },
        },
        trigger: {
          seconds: triggerSeconds,
          channelId: Platform.OS === 'android' ? 'appointment-reminders' : undefined,
        },
      });

      const scheduledTime = new Date(now.getTime() + triggerSeconds * 1000);
      console.log("Notification successfully scheduled for:", scheduledTime);
    } catch (error) {
      console.error("Error scheduling notification:", error);
      setError("Failed to schedule notification: " + error.message);
    }
  };

  const handleBooking = async () => {
    console.log("Book button pressed", { specialty, date, time, notes, reminderSeconds });

    if (!specialty || !dateText || !time) {
      setError("Please fill in all required fields: Specialty, Date, and Time.");
      console.log("Validation failed (empty fields):", { specialty, dateText, time });
      return;
    }

    if (!date) {
      if (!error) {
        setError("Please enter a valid future date in YYYY-MM-DD or YYYY.MM.DD format.");
      }
      console.log("Validation failed (invalid date):", { dateText, date });
      return;
    }

    const dateError = validateDate(date);
    if (dateError) {
      setError(dateError);
      console.log("Date validation failed:", dateError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const appointmentData = {
        userId: user.uid,
        specialty,
        date: formatDate(date),
        time,
        notes: notes || "",
        createdAt: new Date().toISOString(),
        status: "Pending",
      };

      const appointmentId = `${user.uid}_${Date.now()}`;
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await setDoc(appointmentRef, appointmentData);

      console.log("Appointment saved to Firestore:", appointmentData);

      await scheduleNotification(specialty, date, time);

      alert(`Appointment booked!\nSpecialty: ${specialty}\nDate: ${formatDate(date)}\nTime: ${time}`);
      navigation.navigate('PatientDashboard');
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(`Failed to book appointment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSpecialtyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSpecialty(item);
        setSpecialtyModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderTimeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setTime(item);
        setTimeModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.navigate('PatientDashboard')} />
        <Header style={styles.header}>Book Appointments</Header>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          horizontal={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.formContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Specialty:</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setSpecialtyModalVisible(true)}
              >
                <Text style={styles.selectionText}>
                  {specialty || "Choose a specialty"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2025-03-20 or 2025.03.20"
                placeholderTextColor={theme.colors.placeholder || '#999'}
                value={dateText}
                onChangeText={handleDateInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Time:</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setTimeModalVisible(true)}
              >
                <Text style={styles.selectionText}>
                  {time || "Choose a time"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Additional Notes (Optional):</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="e.g., Any specific concerns"
                placeholderTextColor={theme.colors.placeholder || '#999'}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Reminder Time (seconds from now, for testing):</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30 (triggers in 30 seconds)"
                placeholderTextColor={theme.colors.placeholder || '#999'}
                value={reminderSeconds}
                onChangeText={setReminderSeconds}
                keyboardType="numeric"
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color={theme.colors.primary || '#800080'} />
            ) : (
              <Button
                mode="contained"
                onPress={handleBooking}
                disabled={isSubmitting}
                style={styles.bookButton}
                labelStyle={styles.buttonLabel}
              >
                Book
              </Button>
            )}
          </View>
        </ScrollView>
      </Background>

      <Modal
        visible={specialtyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Specialty</Text>
            <FlatList
              data={specialties}
              renderItem={renderSpecialtyItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.modalListContent}
            />
            <Button
              mode="contained"
              onPress={() => setSpecialtyModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={timeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Time</Text>
            <FlatList
              data={times}
              renderItem={renderTimeItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.modalListContent}
            />
            <Button
              mode="contained"
              onPress={() => setTimeModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH,
    maxWidth: SCREEN_WIDTH,
  },
  formContent: {
    paddingTop: 10,
    alignItems: 'center',
    width: '100%',
    maxWidth: SCREEN_WIDTH - 20,
  },
  inputContainer: {
    borderRadius: 8,
    padding: 10,
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
    marginBottom: 5,
  },
  selectionButton: {
    borderWidth: 2,
    borderColor: theme.colors.primary || '#800080',
    borderRadius: 8,
    padding: 8,
    backgroundColor: theme.colors.surface || '#fff',
    width: '100%',
  },
  selectionText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.primary || '#800080',
    borderRadius: 8,
    padding: 8,
    width: '100%',
    backgroundColor: theme.colors.surface || '#fff',
    fontSize: 16,
    color: theme.colors.text || '#000',
  },
  error: {
    fontSize: 16,
    color: theme.colors.error || '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: SCREEN_WIDTH - 20,
  },
  bookButton: {
    paddingVertical: 10,
    alignSelf: 'center',
    width: 120,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface || '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary || '#800080',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalListContent: {
    paddingBottom: 15,
  },
  modalItem: {
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary || '#800080',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 120,
    borderRadius: 8,
  },
});

export default BookAppointments;