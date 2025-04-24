import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Swipeable } from 'react-native-gesture-handler';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { theme } from '../../core/theme';

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
          where('userId', '==', user.uid),
          where('status', '==', 'Pending')
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

        // Sort appointments by date and time in ascending order
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

          return dateTimeA - dateTimeB;
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

  const handleDelete = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await deleteDoc(appointmentRef);
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error.message);
      setError(`Failed to delete appointment: ${error.message}`);
    }
  };

  const renderRightActions = (progress, dragX, appointmentId) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            opacity: progress,
          },
        ]}
      >
        <View style={styles.deleteActionBackground}>
          <Animated.Text
            style={[
              styles.deleteActionText,
              {
                transform: [{ scale }],
              },
            ]}
          >
            Delete
          </Animated.Text>
        </View>
      </Animated.View>
    );
  };

  const renderAppointment = ({ item }) => {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item.id)
        }
        onSwipeableOpen={(direction) => {
          if (direction === 'right') {
            Alert.alert(
              "Delete Appointment",
              "Are you sure you want to delete this appointment?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => handleDelete(item.id),
                },
              ],
              { cancelable: true }
            );
          }
        }}
        rightThreshold={50}
      >
        <View style={styles.appointmentItem}>
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
          <Text style={styles.appointmentText}>
            <Text style={styles.appointmentLabel}>Status:</Text> {item.status}
          </Text>
          {item.notes && (
            <Text style={styles.appointmentText}>
              <Text style={styles.appointmentLabel}>Notes:</Text> {item.notes}
            </Text>
          )}
        </View>
      </Swipeable>
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
          onPress={() => navigation.navigate('BookAppointments')}
          style={styles.backButtonBottom}
        >
          Book New
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
    borderColor: theme.colors.primary || '#800080',
  },
  appointmentText: {
    fontSize: 16,
    color: theme.colors.text || '#000',
    marginBottom: 5,
  },
  appointmentLabel: {
    fontWeight: 'bold', // Bold style for the label
  },
  deleteAction: {
    height: '92%',
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionBackground: {
    backgroundColor: theme.colors.error || '#ff0000',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UpcomingAppointments;