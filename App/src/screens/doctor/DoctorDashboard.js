import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { theme } from '../../core/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DoctorDashboard = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [weeklyAppointments, setWeeklyAppointments] = useState([]);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'medicalstaff', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = `${userData.firstName} ${userData.lastName}`.trim();
            setUserName(fullName);
          } else {
            setUserName('Doctor');
          }
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error);
        setUserName('Doctor');
      }
    };

    const fetchAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Query all appointments for the doctor
        const q = query(
          collection(db, 'appointments'),
          where('docId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        // Get current week's Monday–Sunday range
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Initialize counts for each day (Mon–Sun)
        const counts = Array(7).fill(0);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Count appointments per day
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const dateStr = data.date;
          if (dateStr) {
            const apptDate = new Date(dateStr);
            if (apptDate >= monday && apptDate <= sunday) {
              const dayIndex = Math.floor((apptDate - monday) / (1000 * 60 * 60 * 24));
              if (dayIndex >= 0 && dayIndex < 7) {
                counts[dayIndex]++;
              }
            }
          }
        });

        // Prepare data for graph
        const maxCount = Math.max(...counts, 1); // Avoid division by 0
        const graphData = days.map((day, index) => ({
          day,
          count: counts[index],
          height: (counts[index] / maxCount) * 100, // Normalized height (0–100)
        }));

        setWeeklyAppointments(graphData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchDoctorData();
    fetchAppointments();
  }, []);

  const renderBar = ({ day, count, height }) => {
    return (
      <View key={day} style={styles.barContainer}>
        <Text style={styles.barCount}>{count}</Text>
        <View style={[styles.bar, { height: height || 10 }]} />
        <Text style={styles.barLabel}>{day}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Header>Hi Dr. {userName} 👋</Header>
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Appointments Graph */}
          <TouchableOpacity style={styles.graphCard}>
            <View style={styles.graphCardContent}>
              <Text style={styles.graphTitle}>This Week's Appointments</Text>
              <View style={styles.graphContainer}>
                {weeklyAppointments.length > 0 ? (
                  <View style={styles.barChart}>
                    {weeklyAppointments.map(renderBar)}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No appointments this week</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.cardGrid}>
            <DashboardCard
              icon="calendar"
              title="New Appointments"
              subtitle="View all upcoming appointments"
              onPress={() => navigation.navigate('DocUpcomingAppointments')}
            />
            <DashboardCard
              icon="calendar"
              title="Past Appointments"
              subtitle="View all past appointments"
              onPress={() => navigation.navigate('DocPastAppointments')}
            />
            <DashboardCard
              icon="account-group"
              title="View Patients"
              subtitle="Check patient list"
              onPress={() => navigation.navigate('ViewPatients')}
            />
            <DashboardCard
              icon="file-document"
              title="View Diagnoses"
              subtitle="Uploaded diagnosis files"
              onPress={() => navigation.navigate('DocDiagnoses')}
            />
            <DashboardCard
              icon="message-text"
              title="View Feedback"
              subtitle="Check patient feedback"
              onPress={() => navigation.navigate('DocFeedback')}
            />
            <DashboardCard
              icon="upload"
              title="Upload Documents"
              subtitle="Upload reports or files"
              onPress={() => navigation.navigate('DocUploadDocScreen')}
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
            onPress={() => navigation.navigate('DocProfileScreen')}
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
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  graphCard: {
    backgroundColor: '#f2f2f2',
    margin: 10,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  graphCardContent: {
    alignItems: 'center',
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  graphContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '90%',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    width: SCREEN_WIDTH / 10,
  },
  bar: {
    width: 20,
    backgroundColor: theme.colors.primary || '#800080',
    borderRadius: 4,
    minHeight: 10,
  },
  barCount: {
    fontSize: 12,
    color: theme.colors.text || '#000',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
    color: theme.colors.text || '#000',
    marginTop: 5,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 10,
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
});

export default DoctorDashboard;