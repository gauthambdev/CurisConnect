import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { logout } from '../helpers/logout';

const PatientDashboard = ({ navigation }) => (
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
    </ScrollView>
    <View style={styles.logoutButtonContainer}>
      <Button
        mode="outlined"
        onPress={() => logout(navigation)} // Call the logout function
      >
        Logout
      </Button>
    </View>
  </Background>
);

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,  // Ensures content takes up space even if it's small
    paddingBottom: 20, // Ensures some space for the logout button at the bottom
  },
  logoutButtonContainer: {
    marginTop: 20, // Adds space above the logout button
    paddingHorizontal: 20, // Adds horizontal padding
  },
});

export default PatientDashboard;
