import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { theme } from '../../core/theme';
import * as Notifications from 'expo-notifications';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BookAppointments = ({ navigation }) => {
  const [hospital, setHospital] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [docId, setdocId] = useState(""); // New state for doctor's document ID
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderSeconds, setReminderSeconds] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hospitalModalVisible, setHospitalModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]); // Will now store objects with name and id

  const times = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  // Fetch hospitals and notification preferences on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsRef = collection(db, 'hospitals');
        const hospitalsSnapshot = await getDocs(hospitalsRef);
        const hospitalList = hospitalsSnapshot.docs.map(doc => ({
          id: doc.id,
          displayName: `${doc.data().name}, ${doc.data().city}`,
          data: doc.data(),
        }));
        setHospitals(hospitalList);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError("Failed to load hospitals: " + err.message);
      }
    };

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
          setNotificationsEnabled(data.notificationsEnabled !== false);
        }
      } catch (err) {
        console.error("Error fetching notification preference:", err);
        setError("Failed to load notification settings: " + err.message);
      }
    };

    fetchHospitals();
    requestNotificationPermissions();
    fetchNotificationPreference();
  }, []);

  // Fetch departments when hospitalId changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!hospitalId) {
        setDepartments([]);
        setDepartment("");
        return;
      }

      try {
        const medicalStaffRef = collection(db, 'medicalstaff');
        const q = query(medicalStaffRef, where('role', '==', 'doctor'), where('hospital', '==', hospitalId));
        const medicalStaffSnapshot = await getDocs(q);
        const departmentList = medicalStaffSnapshot.docs.map(doc => doc.data().speciality);
        const uniqueDepartments = [...new Set(departmentList)];
        setDepartments(uniqueDepartments);
        setDepartment("");
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to load departments: " + err.message);
      }
    };

    fetchDepartments();
  }, [hospitalId]);

  // Fetch doctors when hospitalId or department changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!hospitalId || !department) {
        setDoctors([]);
        setDoctor("");
        setdocId(""); // Reset docId when doctors list changes
        return;
      }

      try {
        const medicalStaffRef = collection(db, 'medicalstaff');
        const q = query(
          medicalStaffRef,
          where('role', '==', 'doctor'),
          where('hospital', '==', hospitalId),
          where('speciality', '==', department)
        );
        const medicalStaffSnapshot = await getDocs(q);
        const doctorList = medicalStaffSnapshot.docs.map(doc => ({
          id: doc.id, // Store the document ID
          name: `Dr. ${doc.data().firstName} ${doc.data().lastName}`, // Store the full name
        }));
        setDoctors(doctorList);
        setDoctor(""); // Reset doctor selection
        setdocId(""); // Reset docId
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors: " + err.message);
      }
    };

    fetchDoctors();
  }, [hospitalId, department]);

  const formatDate = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
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

  const parseAppointmentDateTime = (date, time) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  };

  const scheduleNotification = async (department, date, time) => {
    if (!notificationsEnabled) {
      console.log("Notifications are disabled, skipping scheduling.");
      return;
    }

    try {
      const now = new Date();
      const seconds = parseInt(reminderSeconds, 10);
      let triggerSeconds;
      if (!isNaN(seconds) && seconds > 0) {
        triggerSeconds = Math.max(seconds, 5);
      } else {
        const appointmentDateTime = parseAppointmentDateTime(date, time);
        const reminderDateTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
        const timeDiffMs = reminderDateTime.getTime() - now.getTime();
        triggerSeconds = Math.floor(timeDiffMs / 1000);

        if (triggerSeconds <= 0) {
          setError("Reminder time must be in the future. Please select a future appointment time.");
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Appointment Reminder",
          body: `You have an appointment with ${department} at ${time} on ${formatDate(date)}.`,
          data: { department, date: formatDate(date), time },
        },
        trigger: {
          seconds: triggerSeconds,
          channelId: Platform.OS === 'android' ? 'appointment-reminders' : undefined,
        },
      });
    } catch (error) {
      console.error("Error scheduling notification:", error);
      setError("Failed to schedule notification: " + error.message);
    }
  };

  const handleBooking = async () => {
    if (!hospitalId || !department || !doctor || !docId || !date || !time) {
      setError("Please fill in all required fields: Hospital, Department, Doctor, Date, and Time.");
      return;
    }

    const dateError = validateDate(new Date(date));
    if (dateError) {
      setError(dateError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const appointmentData = {
        userId: user.uid,
        hospitalId,
        hospitalName: hospital,
        department,
        doctor,
        docId, // Add docId to appointment data
        date,
        time,
        notes: notes || "",
        createdAt: new Date().toISOString(),
        status: "Pending",
      };

      const appointmentId = `${user.uid}_${Date.now()}`;
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await setDoc(appointmentRef, appointmentData);

      // Schedule a notification for the appointment
      await scheduleNotification(department, date, time);

      // Add a notification to Firestore for the notifications page
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'Appointment Booked',
          body: `Your appointment with ${doctor} in ${department} on ${date} at ${time} has been booked.`,
          userId: user.uid,
          role: 'patient',
          read: false,
          createdAt: serverTimestamp(),
          data: {
            appointmentId,
            hospital,
            department,
            doctor,
            date,
            time,
          },
        });
        console.log('Firestore notification added!');
      } catch (e) {
        console.error('Failed to add Firestore notification:', e);
        alert('Failed to add Firestore notification: ' + e.message);
      }

      // Add a notification to Firestore for the doctor
      let patientName = '';
      let patientEmail = '';
      try {
        // Try to get patient name and email from the user object or Firestore
        patientName = user.displayName || '';
        patientEmail = user.email || '';
        if (!patientName || !patientEmail) {
          // Fetch from Firestore if not available
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            patientName = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : patientName;
            patientEmail = data.email || patientEmail;
          }
        }
      } catch (e) {
        console.error('Failed to fetch patient info for doctor notification:', e);
      }
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'New Appointment Scheduled',
          body: `You have a new appointment with ${patientName} (${patientEmail}) in ${department} on ${date} at ${time}.`,
          userId: docId, // Doctor's user ID
          role: 'doctor',
          read: false,
          createdAt: serverTimestamp(),
          data: {
            appointmentId,
            hospital,
            department,
            patient: patientName,
            patientEmail: patientEmail,
            date,
            time,
          },
        });
        console.log('Doctor Firestore notification added!');
      } catch (e) {
        console.error('Failed to add Firestore notification for doctor:', e);
      }

      alert(`Appointment booked!\nHospital: ${hospital}\nDepartment: ${department}\nDoctor: ${doctor}\nDate: ${date}\nTime: ${time}`);
      navigation.navigate('PatientTabs', { screen: 'Home' });
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(`Failed to book appointment: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHospitalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setHospital(item.displayName);
        setHospitalId(item.id);
        setDepartment("");
        setDoctor("");
        setdocId(""); // Reset docId when hospital changes
        setHospitalModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  const renderDepartmentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setDepartment(item);
        setDoctor("");
        setdocId(""); // Reset docId when department changes
        setDepartmentModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setDoctor(item.name); // Set the doctor's name
        setdocId(item.id); // Set the doctor's document ID
        setDoctorModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.name}</Text>
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
        <View style={styles.headerContainer}>
          <Header style={styles.header}>Book Appointment</Header>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Date Section */}
            <Text style={styles.label}>Date</Text>
            <Calendar
              onDayPress={(day) => {
                const selectedDate = new Date(day.dateString);
                const dateError = validateDate(selectedDate);
                if (dateError) {
                  setError(dateError);
                  setDate(null);
                } else {
                  setError(null);
                  setDate(day.dateString);
                }
              }}
              markedDates={{
                [date]: { selected: true, selectedColor: theme.colors.primary || '#800080' },
              }}
              theme={{
                calendarBackground: '#e5d0f5',
                textSectionTitleColor: '#000',
                dayTextColor: '#000',
                todayTextColor: '#000',
                selectedDayBackgroundColor: theme.colors.primary || '#800080',
                selectedDayTextColor: '#fff',
                monthTextColor: '#000',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#000',
              }}
              style={styles.calendar}
            />

            {/* Time Section */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setTimeModalVisible(true)}
            >
              <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{time || "Select time"}</Text>
              <Icon name="chevron-down" size={20} color={theme.colors.primary || '#800080'} />
            </TouchableOpacity>
            
            {/* Hospital Section */}
            <Text style={styles.label}>Hospital</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setHospitalModalVisible(true)}
            >
              <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{hospital || "Select hospital"}</Text>
              <Icon name="chevron-down" size={20} color={theme.colors.primary || '#800080'} />
            </TouchableOpacity>
            
            {/* Department Section */}
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity
              style={[styles.dropdown, !hospitalId && styles.disabledDropdown]}
              onPress={() => setDepartmentModalVisible(true)}
              disabled={!hospitalId}
            >
              <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{department || "Select department"}</Text>
              <Icon name="chevron-down" size={20} color={theme.colors.primary || '#800080'} />
            </TouchableOpacity>

            {/* Doctor Section */}
            <Text style={styles.label}>Doctor</Text>
            <TouchableOpacity
              style={[styles.dropdown, (!hospitalId || !department) && styles.disabledDropdown]}
              onPress={() => setDoctorModalVisible(true)}
              disabled={!hospitalId || !department}
            >
              <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{doctor || "Select doctor"}</Text>
              <Icon name="chevron-down" size={20} color={theme.colors.primary || '#800080'} />
            </TouchableOpacity>

            {/* Notes Section */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes"
              placeholderTextColor={theme.colors.placeholder || '#999'}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              maxLength={500}
              numberOfLines={5}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            {/* Book Button */}
            <Button
              mode="contained"
              onPress={handleBooking}
              disabled={isSubmitting}
              style={styles.bookButton}
              labelStyle={styles.buttonLabel}
            >
              {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : "Book Appointment"}
            </Button>
          </View>
        </ScrollView>
      </Background>

      {/* Hospital Modal */}
      <Modal
        visible={hospitalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHospitalModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Hospital</Text>
            <FlatList
              data={hospitals}
              renderItem={renderHospitalItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContent}
            />
            <Button
              mode="contained"
              onPress={() => setHospitalModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      {/* Department Modal */}
      <Modal
        visible={departmentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Department</Text>
            {departments.length === 0 ? (
              <Text style={styles.noDataText}>No departments available for this hospital.</Text>
            ) : (
              <FlatList
                data={departments}
                renderItem={renderDepartmentItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.modalListContent}
              />
            )}
            <Button
              mode="contained"
              onPress={() => setDepartmentModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      {/* Doctor Modal */}
      <Modal
        visible={doctorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDoctorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Doctor</Text>
            {doctors.length === 0 ? (
              <Text style={styles.noDataText}>No doctors available for this department.</Text>
            ) : (
              <FlatList
                data={doctors}
                renderItem={renderDoctorItem}
                keyExtractor={(item) => item.id} // Use doctor ID as key
                contentContainerStyle={styles.modalListContent}
              />
            )}
            <Button
              mode="contained"
              onPress={() => setDoctorModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      {/* Time Modal */}
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
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    fontSize: 27,
    color: theme.colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 0,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    marginTop: 20,
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 20,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    minWidth: 300,
    width: '100%',
    maxWidth: '100%',
  },
  disabledDropdown: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  notesInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    height: 120,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    textAlignVertical: 'top',
    width: '100%',
    minWidth: 300,
    maxWidth: '100%',
    maxLength: 500,
  },
  error: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#560CCE',
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 120,
    borderRadius: 8,
    backgroundColor: '#560CCE',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default BookAppointments;