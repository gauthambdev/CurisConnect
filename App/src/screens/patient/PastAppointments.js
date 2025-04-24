import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { theme } from '../../core/theme';

const PastAppointments = ({ navigation }) => {
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
          where('userId', '==', user.uid),
          where('status', 'in', ['Completed', 'Missed', 'Cancelled'])
        );
        const querySnapshot = await getDocs(q);
        let appointmentsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            doctor: data.doctor,
            department: data.department || 'N/A',
            hospital: data.hospitalName || 'N/A',
            date: data.date || 'N/A',
            time: data.time || 'N/A',
            status: data.status || 'N/A',
            notes: data.notes || '',
          };
        });

        // Sort appointments by date and time in descending order (most recent first)
        appointmentsList = appointmentsList.sort((a, b) => {
          const dateA = a.date !== 'N/A' ? new Date(a.date) : new Date(0);
          const dateB = b.date !== 'N/A' ? new Date(b.date) : new Date(0);

          const parseTime = (time) => {
            if (time === 'N/A') return 0;
            const [timePart, period] = time.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          };

          const timeA = parseTime(a.time);
          const timeB = parseTime(b.time);

          const dateTimeA = dateA.getTime() + timeA * 60 * 1000;
          const dateTimeB = dateB.getTime() + timeB * 60 * 1000;

          return dateTimeB - dateTimeA; // Descending order (newest first)
        });

        setAppointments(appointmentsList);
      } catch (error) {
        console.error('Error fetching appointments:', error.message);
        setError(`Failed to fetch appointments: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const renderAppointment = ({ item }) => {
    // Determine style based on status
    const getStatusStyle = (status) => {
      switch (status) {
        case 'Completed':
          return {
            borderColor: theme.colors.success || '#4CAF50',
            textColor: theme.colors.success || '#4CAF50'
          };
        case 'Missed':
          return {
            borderColor: theme.colors.error || '#FF5722',
            textColor: theme.colors.error || '#FF5722'
          };
        case 'Cancelled':
          return {
            borderColor: '#9E9E9E',
            textColor: '#9E9E9E'
          };
        default:
          return {
            borderColor: theme.colors.primary || '#800080',
            textColor: theme.colors.text || '#000'
          };
      }
    };

    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={[
        styles.appointmentItem, 
        { borderColor: statusStyle.borderColor, borderLeftWidth: 5 }
      ]}>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Hospital:</Text> {item.hospital}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Department:</Text> {item.department}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Doctor:</Text> {item.doctor}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Date:</Text> {item.date}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Time:</Text> {item.time}
        </Text>
        <Text style={[
          styles.appointmentText, 
          styles.statusText,
          { color: statusStyle.textColor }
        ]}>
          <Text style={styles.appointmentLabel}>Status:</Text> {item.status}
        </Text>
        {item.notes && (
          <Text style={styles.appointmentText}>
            <Text style={styles.appointmentLabel}>Notes:</Text> {item.notes}
          </Text>
        )}
      </View>
    );
  };

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
        <Header style={styles.header}>Appointment History</Header>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.noAppointments}>No past appointments found.</Text>
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
          onPress={() => navigation.navigate('UpcomingAppointments')}
          style={styles.backButtonBottom}
        >
          View Upcoming
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
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  appointmentItem: {
    backgroundColor: theme.colors.surface || '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  appointmentText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
    marginBottom: 5,
  },
  appointmentLabel: {
    fontWeight: 'bold',
  },
  statusText: {
    fontWeight: 'bold',
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
    borderRadius: 50,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  detailsButton: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  }
});

export default PastAppointments;