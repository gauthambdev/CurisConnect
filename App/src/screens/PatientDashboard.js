import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { logout } from '../helpers/logout';
import { theme } from '../core/theme';

const PatientDashboard = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Background>
      <Logo />
      <Header>Patient Dashboard</Header>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <DashboardCard 
          title="Upcoming Appointments" 
          action={{ 
            label: "View", 
            onPress: () => navigation.navigate('ViewAppointments') 
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
