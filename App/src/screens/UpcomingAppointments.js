import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

const UpcomingAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("No user logged in. Please log in again.");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'appointments'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const appointmentsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            specialty: data.specialty || 'N/A',
            date: data.date || 'N/A',
            time: data.time || 'N/A',
            status: data.status || 'N/A',
            notes: data.notes || '',
          };
        });

        // Sort appointments by date and time
        const sortedAppointments = appointmentsList.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA - dateB;
        });

        setAppointments(sortedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error.message);
        setError(`Failed to fetch appointments: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const renderAppointment = ({ item }) => (
    <View style={styles.appointmentItem}>
      <Text style={styles.appointmentText}>Specialty: {item.specialty}</Text>
      <Text style={styles.appointmentText}>Date: {item.date}</Text>
      <Text style={styles.appointmentText}>Time: {item.time}</Text>
      <Text style={styles.appointmentText}>Status: {item.status}</Text>
      {item.notes && <Text style={styles.appointmentText}>Notes: {item.notes}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Background>
          <ActivityIndicator size="large" color={theme.colors.primary || '#800080'} style={styles.loader} />
        </Background>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.navigate('PatientDashboard')} />
        <Header style={styles.header}>Upcoming Appointments</Header>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.noAppointments}>No upcoming appointments booked yet.</Text>
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
        <Button
          mode="contained"
          onPress={() => navigation.navigate('PatientDashboard')}
          style={styles.backButtonBottom}
          labelStyle={styles.buttonLabel}
        >
          Back
        </Button>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || theme.colors.surface || '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 36,
    color: theme.colors.primary || '#800080',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  appointmentItem: {
    backgroundColor: theme.colors.surface || '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.primary || '#800080',
  },
  appointmentText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
    marginBottom: 5,
  },
  noAppointments: {
    fontSize: 18,
    color: theme.colors.text || '#000',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    fontSize: 16,
    color: theme.colors.error || '#ff0000',
    textAlign: 'center',
    marginTop: 20,
  },
  backButtonBottom: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 180,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UpcomingAppointments;
