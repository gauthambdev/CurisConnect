import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SelectList } from 'react-native-dropdown-select-list';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 300); // Account for padding

const BookAppointments = ({ navigation }) => {
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const specialties = [
    { key: "General Practice", value: "General Practice" },
    { key: "Pulmonology", value: "Pulmonology" },
    { key: "Gastroenterology", value: "Gastroenterology" },
    { key: "Cardiology", value: "Cardiology" },
    { key: "Neurology", value: "Neurology" },
    { key: "Dermatology", value: "Dermatology" },
    { key: "Infectious Disease", value: "Infectious Disease" },
    { key: "Urology", value: "Urology" },
    { key: "Otolaryngology", value: "Otolaryngology" },
    { key: "Allergy and Immunology", value: "Allergy and Immunology" },
    { key: "Hematology", value: "Hematology" },
  ];

  const times = [
    { key: "09:00 AM", value: "09:00 AM" },
    { key: "10:00 AM", value: "10:00 AM" },
    { key: "11:00 AM", value: "11:00 AM" },
    { key: "12:00 PM", value: "12:00 PM" },
    { key: "01:00 PM", value: "01:00 PM" },
    { key: "02:00 PM", value: "02:00 PM" },
    { key: "03:00 PM", value: "03:00 PM" },
    { key: "04:00 PM", value: "04:00 PM" },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = `${userData.firstName} ${userData.lastName}`.trim();
            setUserName(fullName);
          } else {
            setUserName("Patient");
          }
        } else {
          setUserName("Patient");
          setError("No user logged in. Please log in again.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName("Patient");
        setError("Failed to fetch user data. Using default name.");
      }
    };

    fetchUserData();
  }, []);

  const handleBooking = async () => {
    if (!specialty || !date || !time) {
      setError("Please fill in all required fields: Specialty, Date, and Time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const appointmentData = {
        userId: user.uid,
        patientName: userName,
        specialty,
        date,
        time,
        notes: notes || "",
        createdAt: new Date().toISOString(),
        status: "Pending",
      };

      const appointmentId = `${user.uid}_${Date.now()}`;
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await setDoc(appointmentRef, appointmentData);

      console.log("Appointment saved to Firestore:", appointmentData);
      alert(`Appointment booked!\nSpecialty: ${specialty}\nDate: ${date}\nTime: ${time}`);
      navigation.navigate('PatientDashboard');
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(`Failed to book appointment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.navigate('PatientDashboard')} />
        <Header style={styles.header}>Book Appointments</Header>
        <ScrollView 
          contentContainerStyle={styles.content}
          horizontal={false}
          showsHorizontalScrollIndicator={false} // Explicitly disable
          showsVerticalScrollIndicator={true} // Allow vertical scrolling
          scrollEnabled={true} // Enable vertical scrolling
        >
          <Text style={styles.greeting}>Hello {userName} 👋</Text>

          {/* Specialty Selection */}
          <Text style={styles.label}>Select Specialty:</Text>
          <SelectList
            setSelected={(val) => setSpecialty(val)}
            data={specialties}
            save="value"
            placeholder="Choose a specialty"
            boxStyles={styles.dropdownBox}
            inputStyles={styles.dropdownInput}
            dropdownStyles={styles.dropdownList}
            dropdownTextStyles={styles.dropdownText}
          />

          {/* Date Input */}
          <Text style={styles.label}>Date (e.g., YYYY-MM-DD):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2025-03-20"
            placeholderTextColor={theme.colors.placeholder}
            value={date}
            onChangeText={setDate}
          />

          {/* Time Selection */}
          <Text style={styles.label}>Select Time:</Text>
          <SelectList
            setSelected={(val) => setTime(val)}
            data={times}
            save="value"
            placeholder="Choose a time"
            boxStyles={styles.dropdownBox}
            inputStyles={styles.dropdownInput}
            dropdownStyles={styles.dropdownList}
            dropdownTextStyles={styles.dropdownText}
          />

          {/* Optional Notes */}
          <Text style={styles.label}>Additional Notes (Optional):</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="e.g., Any specific concerns"
            placeholderTextColor={theme.colors.placeholder}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          {/* Error Message */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Book Button */}
          <Button
            mode="contained"
            onPress={handleBooking}
            disabled={isSubmitting}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </Button>
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || theme.colors.surface,
  },
  content: {
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
    width: SCREEN_WIDTH, // Match screen width
    flexShrink: 1, // Prevent overflow
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
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: MAX_CONTENT_WIDTH, // Constrain width
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  dropdownBox: {
    width: MAX_CONTENT_WIDTH, // Constrain to screen width
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 30,
    backgroundColor: theme.colors.surface,
  },
  dropdownInput: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownList: {
    width: MAX_CONTENT_WIDTH, // Constrain dropdown list
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 30,
    width: MAX_CONTENT_WIDTH, // Constrain to screen width
    backgroundColor: theme.colors.surface,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 180,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});

export default BookAppointments;