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
    <ScrollView>
      <DashboardCard title="Upcoming Appointments" action={{ label: "View", onPress: () => navigation.navigate('Appointments') }} />
      <DashboardCard title="Upload Documents" action={{ label: "Upload", onPress: () => navigation.navigate('UploadDocs') }} />
      <DashboardCard title="Medical History" action={{ label: "View", onPress: () => navigation.navigate('MedicalHistory') }} />
    </ScrollView>
    <Button
      mode="outlined"
      onPress={() => logout(navigation)} // Call the logout function
    >
      Logout
    </Button>
  </Background>
);

export default PatientDashboard;