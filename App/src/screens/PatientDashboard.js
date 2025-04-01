import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { theme } from '../core/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PatientDashboard = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [nearestAppointment, setNearestAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'patients', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = `${userData.firstName} ${userData.lastName}`.trim();
            setUserName(fullName);
          } else {
            setUserName('User');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName('User');
      }
    };

    const fetchNearestAppointment = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("No user logged in. Please log in again.");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'appointments'),
          where('userId', '==', user.uid),
          where('status', '==', 'Pending')
        );
        const querySnapshot = await getDocs(q);
        let appointmentsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            doctor: data.doctor,
            department: data.department || 'N/A',
            hospital: data.hospital || 'N/A',
            date: data.date || 'N/A',
            time: data.time || 'N/A',
            status: data.status || 'N/A',
            notes: data.notes || '',
          };
        });
        
        const parseTime = (time) => {
          if (time === 'N/A') return 0;
          const [timePart, period] = time.split(' ');
          let [hours, minutes] = timePart.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        
        // Sort appointments by date and time in ascending order
        appointmentsList = appointmentsList.sort((a, b) => {
          const dateA = a.date !== 'N/A' ? new Date(a.date) : new Date(0);
          const dateB = b.date !== 'N/A' ? new Date(b.date) : new Date(0);

          const timeA = parseTime(a.time);
          const timeB = parseTime(b.time);

          const dateTimeA = dateA.getTime() + timeA * 60 * 1000;
          const dateTimeB = dateB.getTime() + timeB * 60 * 1000;

          return dateTimeA - dateTimeB;
        });

        // Filter appointments to only include those in the future
        const now = new Date();
        const futureAppointments = appointmentsList.filter(appointment => {
          if (appointment.date === 'N/A' || appointment.time === 'N/A') return false;
          const appointmentDate = new Date(appointment.date);
          const timeInMinutes = parseTime(appointment.time);
          appointmentDate.setHours(0, 0, 0, 0);
          const appointmentDateTime = appointmentDate.getTime() + timeInMinutes * 60 * 1000;
          return appointmentDateTime >= now.getTime();
        });

        // Set the nearest appointment (first one after sorting and filtering)
        if (futureAppointments.length > 0) {
          setNearestAppointment(futureAppointments[0]);
        } else {
          setNearestAppointment(null);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error.message);
        setError(`Failed to fetch appointments: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchNearestAppointment();
  }, []);

  // Format the date and time for display
  const formatDateTime = (date, time) => {
    if (date === 'N/A' || time === 'N/A') return 'N/A';
    const dateObj = new Date(date);
    const today = new Date();
    const isToday =
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();

    if (isToday) {
      return `Today ${time}`;
    } else {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return `${dateObj.toLocaleDateString('en-US', options)} ${time}`;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Header>Hi {userName}👋</Header>
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Upcoming Appointment Card */}
          <TouchableOpacity
            style={styles.upcomingCard}
            onPress={() => navigation.navigate('UpcomingAppointments')}
          >
            <ImageBackground
              source={require('../assets/hospital.webp')}
              style={styles.imageBackground}
              imageStyle={styles.imageStyle}
            >
              <View style={styles.upcomingCardContent}>
                {loading ? (
                  <Text style={styles.upcomingTime}>Loading...</Text>
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : nearestAppointment ? (
                  <>
                    <Text style={styles.upcomingTime}>
                      {formatDateTime(nearestAppointment.date, nearestAppointment.time)}
                    </Text>
                    <Text style={styles.upcomingTitle}>Upcoming Appointment</Text>
                    <Text style={styles.upcomingDoctor}>
                      {nearestAppointment.doctor} - {nearestAppointment.department}
                    </Text>
                    <Button mode="contained" style={styles.viewButton}>
                      View Appointment
                    </Button>
                  </>
                ) : (
                  <>
                    <Text style={styles.upcomingTitle}>No Upcoming Appointments</Text>
                    <Text style={styles.upcomingDoctor}>Book a new appointment to get started.</Text>
                  </>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* Grid of Dashboard Cards */}
          <View style={styles.cardGrid}>
            <DashboardCard
              icon="calendar"
              title="Appointments"
              subtitle="View all appointments"
              onPress={() => navigation.navigate('UpcomingAppointments')}
            />
            <DashboardCard
              icon="plus"
              title="Book Appointment"
              subtitle="Book new appointment"
              onPress={() => navigation.navigate('BookAppointments')}
            />
            <DashboardCard
              icon="file-document"
              title="Medical History"
              subtitle="View your medical history"
              onPress={() => navigation.navigate('MedicalHistory')}
            />
            <DashboardCard
              icon="upload"
              title="Medical Files"
              subtitle="Manage medical files"
              onPress={() => navigation.navigate('UploadDocScreen')}
            />
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarItem}>
            <Icon name="home" size={24} color={theme.colors.primary} />
            <Text style={styles.bottomBarText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomBarItem}
            onPress={() => navigation.navigate('QuickDiagnosis')}
          >
            <Icon name="chat" size={24} color="#666" />
            <Text style={styles.bottomBarText}>Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomBarItem}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Icon name="account" size={24} color="#666" />
            <Text style={styles.bottomBarText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingBottom: 60, // Space for bottom bar
  },
  upcomingCard: {
    marginVertical: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imageBackground: {
    width: '100%',
    height: 150,
  },
  imageStyle: {
    borderRadius: 15,
    opacity: 0.3,
  },
  upcomingCardContent: {
    paddingVertical: 20,
    padding: 15,
    flex: 1,
    justifyContent: 'center',
  },
  upcomingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 5,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  upcomingDoctor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  viewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarItem: {
    alignItems: 'center',
  },
  bottomBarText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 5,
  },
});

export default PatientDashboard;