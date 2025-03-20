import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { logout } from '../helpers/logout';
import { theme } from '../core/theme';

const PatientDashboard = ({ navigation }) => {
  const [userName, setUserName] = useState('');

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
            setUserName('User');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName('User');
      }
    };

    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Logo />
        <Header>
          <Text>Hello {userName} 👋</Text>
        </Header>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <DashboardCard 
            title="Upcoming Appointments" 
            action={{ 
              label: "View", 
              onPress: () => navigation.navigate('UpcomingAppointments') 
            }} 
          />
          <DashboardCard 
            title="Book Appointments" 
            action={{ 
              label: "Book", 
              onPress: () => navigation.navigate('BookAppointments') 
            }} 
          />
          <DashboardCard 
            title="Upload Documents" 
            action={{ 
              label: "Upload", 
              onPress: () => navigation.navigate('UploadDocScreen') 
            }} 
          />
          <DashboardCard 
            title="Quick Diagnosis" 
            action={{ 
              label: "Start", 
              onPress: () => navigation.navigate('QuickDiagnosis') 
            }} 
          />
          <DashboardCard 
            title="Medical History" 
            action={{ 
              label: "View", 
              onPress: () => navigation.navigate('MedicalHistory') 
            }} 
          />
          <DashboardCard 
            title="System Settings" 
            action={{ 
              label: "View", 
              onPress: () => navigation.navigate('SystemSettings') 
            }} 
          />
        </ScrollView>
        <View style={styles.logoutButtonContainer}>
          <Button
            mode="outlined"
            onPress={() => logout(navigation)}
            style={styles.backButton} 
          >
            Logout
          </Button>
        </View>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoutButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  backButton: {
    width: '100%',
    borderColor: theme.colors.primary,
  },
});

export default PatientDashboard;


// book appointments 
// upcoming appointment details
// notification for the patient for upcoming appointments