import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import Background from '../components/Background'
import Logo from '../components/Logo'
import Header from '../components/Header'
import Paragraph from '../components/Paragraph'
import Button from '../components/Button'
import StatsCard from '../components/StatsCard'
import PatientCard from '../components/PatientCard'

export default function Dashboard({ navigation }) {
  const stats = {
    totalPatients: '2,458',
    admittedToday: '45',
    appointments: '154',
    availableBeds: '32'
  }

  const recentPatients = [
    { id: 1, name: 'John Doe', time: '1 hour ago', status: 'Admitted' },
    { id: 2, name: 'Jane Smith', time: '3 hours ago', status: 'Emergency' },
    { id: 3, name: 'Mike Johnson', time: '5 hours ago', status: 'Discharged' }
  ]

  return (
    <Background>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Logo />
          <Header>Hospital Dashboard</Header>
        </View>

        <View style={styles.statsGrid}>
          <StatsCard title="Total Patients" value={stats.totalPatients} />
          <StatsCard title="Today's Admissions" value={stats.admittedToday} />
          <StatsCard title="Appointments" value={stats.appointments} />
          <StatsCard title="Available Beds" value={stats.availableBeds} />
        </View>

        <View style={styles.actionsContainer}>
          <Header>Quick Actions</Header>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddPatient')}
            >
              Add Patient
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Appointments')}
            >
              Schedule Appointment
            </Button>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('EmergencyList')}
            >
              Emergency List
            </Button>
          </View>
        </View>

        <View style={styles.recentContainer}>
          <Header>Recent Patients</Header>
          <View style={styles.patientList}>
            {recentPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                name={patient.name}
                time={patient.time}
                status={patient.status}
                onPress={() => navigation.navigate('PatientDetails', { id: patient.id })}
              />
            ))}
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'StartScreen' }],
            })
          }
        >
          Logout
        </Button>
      </ScrollView>
    </Background>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
    marginTop: 12,
  },
  recentContainer: {
    marginBottom: 24,
  },
  patientList: {
    marginTop: 12,
  }
})