import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { theme } from '../../core/theme';

const ViewPatients = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculateAge = (dobString) => {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'appointments'), where('docId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const appointmentsByUser = {};
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = data.userId;
          if (!appointmentsByUser[uid]) appointmentsByUser[uid] = [];
          appointmentsByUser[uid].push({ ...data, id: docSnap.id });
        });

        const uniqueUserIds = Object.keys(appointmentsByUser);

        const patientData = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            const patientRef = doc(db, 'patients', userId);
            const patientSnap = await getDoc(patientRef);

            if (!patientSnap.exists()) return null;

            const pdata = patientSnap.data();
            const age = calculateAge(pdata.dob);

            // Filter only completed appointments and sort by date descending
            const completedAppointments = appointmentsByUser[userId]
            .filter(appt => appt.status === 'Completed')
            .sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
            });

            const mostRecent = completedAppointments[0];


            return {
              userId,
              firstName: pdata.firstName,
              lastName: pdata.lastName,
              contact: pdata.contact,
              email: pdata.email,
              age,
              recentAppointment: mostRecent?.date || 'N/A',
            };
          })
        );

        const filtered = patientData.filter(Boolean);
        setPatients(filtered);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Background>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </Background>
      </SafeAreaView>
    );
  }

  const renderPatient = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.text}><Text style={styles.label}>Name:</Text> {item.firstName} {item.lastName}</Text>
      <Text style={styles.text}><Text style={styles.label}>Contact:</Text> {item.contact}</Text>
      <Text style={styles.text}><Text style={styles.label}>Email:</Text> {item.email}</Text>
      <Text style={styles.text}><Text style={styles.label}>Age:</Text> {item.age}</Text>
      <Text style={styles.text}><Text style={styles.label}>Recent Appointment:</Text> {item.recentAppointment}</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('PatientDocs', { userId: item.userId })}
        >
        Patient Docs
      </Button>

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <Header style={styles.header}>Your Patients</Header>
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
        />
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20, // Removed horizontal padding to allow full width
    width: '100%', // Ensure the list takes full width
  },
  card: {
    backgroundColor: theme.colors.surface || '#fff',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    marginHorizontal: 0, // Ensure no horizontal margin
    width: '100%', // Make card take full width
  },
  text: {
    fontSize: 16,
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
  },
  historyButton: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
});

export default ViewPatients;