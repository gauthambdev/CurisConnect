import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { theme } from '../../core/theme';

const DocPastAppointments = ({ navigation }) => {
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

        // Query for appointments that are NOT pending (completed or missed)
        const q = query(
          collection(db, 'appointments'),
          where('docId', '==', user.uid),
          where('status', 'in', ['Completed', 'Missed'])
        );

        const querySnapshot = await getDocs(q);
        let appointmentsList = [];

        for (const appointmentDoc of querySnapshot.docs) {
          const data = appointmentDoc.data();
          const patientId = data.userId;

          const patientRef = doc(db, 'patients', patientId);
          const patientSnap = await getDoc(patientRef);
          const patientData = patientSnap.exists() ? patientSnap.data() : null;

          let fullName = 'Unknown';
          let contact = 'N/A';
          let email = 'N/A';
          let bloodGroup = 'N/A';
          let age = 'N/A';

          if (patientData) {
            fullName = `${patientData.firstName} ${patientData.lastName}`;
            contact = patientData.contact || 'N/A';
            email = patientData.email || 'N/A';
            bloodGroup = patientData.bloodGroup || 'N/A';

            const dob = patientData.dob;
            if (dob) {
              const birthDate = new Date(dob);
              const today = new Date();
              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
              }
              age = calculatedAge;
            }
          }

          appointmentsList.push({
            id: appointmentDoc.id,
            patientId, // Add patientId to the appointment object
            hospital: data.hospitalName || 'N/A',
            date: data.date || 'N/A',
            time: data.time || 'N/A',
            status: data.status || 'N/A',
            notes: data.notes || '',
            patient: {
              fullName,
              contact,
              email,
              bloodGroup,
              age
            }
          });
        }

        // Sort appointments by date and time (most recent first)
        appointmentsList.sort((a, b) => {
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

          // Reverse the order to show most recent first
          return (dateB.getTime() + timeB * 60 * 1000) - (dateA.getTime() + timeA * 60 * 1000);
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
    return (
      <View style={[
        styles.appointmentItem,
        item.status === 'Completed' ? styles.completedAppointment : styles.missedAppointment
      ]}>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Patient Name:</Text> {item.patient.fullName}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Contact:</Text> {item.patient.contact}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Email:</Text> {item.patient.email}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Blood Group:</Text> {item.patient.bloodGroup}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Age:</Text> {item.patient.age}
        </Text>
        <Text style={styles.appointmentText}>
          <Text style={styles.appointmentLabel}>Hospital:</Text> {item.hospital}
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
          item.status === 'Completed' ? styles.completedText : styles.missedText
        ]}>
          <Text style={styles.appointmentLabel}>Status:</Text> {item.status}
        </Text>
        {item.notes && (
          <Text style={styles.appointmentText}>
            <Text style={styles.appointmentLabel}>Notes:</Text> {item.notes}
          </Text>
        )}

        {/* Patient History Button */}
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('ViewHistory', { patientId: item.patientId })}
          style={styles.historyButton}
        >
          Patient History
        </Button>
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
        <Header style={styles.header}>Past Appointments</Header>
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
          onPress={() => navigation.navigate('DocUpcomingAppointments')}
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
  completedAppointment: {
    borderColor: theme.colors.success || '#4CAF50',
    borderLeftWidth: 5,
  },
  missedAppointment: {
    borderColor: theme.colors.error || '#FF5722',
    borderLeftWidth: 5,
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
  completedText: {
    color: theme.colors.success || '#4CAF50',
  },
  missedText: {
    color: theme.colors.error || '#FF5722',
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
    marginBottom: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 180,
    borderRadius: 50,
  },
  historyButton: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
});

export default DocPastAppointments;