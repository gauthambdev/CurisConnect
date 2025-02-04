import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';
import { logout } from '../helpers/logout';

const DoctorDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Doctor Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Today's Appointments" content={["Total: 12", "Completed: 5", "Pending: 7"]} />
      <DashboardCard title="Nurse Duty Scheduling" action={{ label: "Schedule", onPress: () => navigation.navigate('NurseSchedule') }} />
      <DashboardCard title="Patient Consultations" action={{ label: "View Documents", onPress: () => navigation.navigate('ConsultationDocs') }} />
    </ScrollView>
    <Button
      mode="outlined"
      onPress={() => logout(navigation)} // Call the logout function
    >
      Logout
    </Button>
  </Background>
);

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

const NurseDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Nurse Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Duty Schedule" action={{ label: "View", onPress: () => navigation.navigate('DutySchedule') }} />
      <DashboardCard title="Patient Assistance" action={{ label: "Assist", onPress: () => navigation.navigate('PatientCare') }} />
    </ScrollView>
    <Button
      mode="outlined"
      onPress={() => logout(navigation)} // Call the logout function
    >
      Logout
    </Button>
  </Background>
);

const AdminDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Admin Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Manage Users" action={{ label: "View", onPress: () => navigation.navigate('ManageUsers') }} />
      <DashboardCard title="Hospital Statistics" action={{ label: "View", onPress: () => navigation.navigate('HospitalStats') }} />
    </ScrollView>
    <Button
      mode="outlined"
      onPress={() => logout(navigation)} // Call the logout function
    >
      Logout
    </Button>
  </Background>
);

export { DoctorDashboard, PatientDashboard, NurseDashboard, AdminDashboard };