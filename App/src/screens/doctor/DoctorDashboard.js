import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { theme } from '../../core/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DoctorDashboard = ({ navigation }) => {
  const [userName, setUserName] = useState('');

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

    fetchDoctorData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Header>Hi Dr. {userName} 👋</Header>
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {/* Appointments Graph Placeholder */}
          <TouchableOpacity
            style={styles.graphCard}
          >
            <View style={styles.graphCardContent}>
              <Text style={styles.graphTitle}>This Week's Appointments</Text>
              
              <View style={styles.graphPlaceholder}>
                <Text style={{ color: '#aaa' }}>[Graph]</Text>
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
    marginBottom: 5,
  },
  graphSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  graphPlaceholder: {
    height: 100,
    backgroundColor: '#ddd',
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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