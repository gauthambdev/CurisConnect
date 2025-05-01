import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import Background from "../../components/Background";
import Logo from "../../components/Logo";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { theme } from "../../core/theme";
import { MaterialIcons } from '@expo/vector-icons';

const Feedback = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchDoctors = async () => {
      try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(appointmentsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const uniqueDoctors = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.doctor && data.docId) {
            uniqueDoctors[data.docId] = data.doctor;
          }
        });

        const doctorsList = Object.entries(uniqueDoctors).map(([id, name]) => ({
          id,
          name
        }));
        
        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [user]);

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    // Month is 0-indexed, so we add 1 and pad with '0' if needed
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDoctorSelect = (doctorId, doctorName) => {
    setSelectedDoctorId(doctorId);
    setSelectedDoctor(doctorName);
    setDropdownVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedDoctorId || rating === 0) {
      alert('Please select a doctor and provide a rating');
      return;
    }

    try {
      setSubmitting(true);
      
      const currentDate = new Date();
      const formattedDate = formatDate(currentDate);
      
      await addDoc(collection(db, "feedback"), {
        by: user.uid,
        docId: selectedDoctorId,
        doctor: selectedDoctor,
        rating,
        date: formattedDate, // Store date in yyyy-mm-dd format
        notes
      });

      alert('Feedback submitted successfully');
      
      // Reset form
      setSelectedDoctorId('');
      setSelectedDoctor('');
      setRating(0);
      setNotes('');
      
      // Navigate back
      navigation.goBack();
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (position) => {
    return (
      <TouchableOpacity 
        key={position} 
        onPress={() => setRating(position)}
        style={styles.starContainer}
      >
        <Text style={[
          styles.star,
          { color: position <= rating ? theme.colors.primary : '#e4e5e9' }
        ]}>
          ★
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.doctorItem}
      onPress={() => handleDoctorSelect(item.id, item.name)}
    >
      <Text style={styles.doctorName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Background>
          <Logo />
          <Header>Feedback</Header>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Background>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Header style={styles.header}>Feedback</Header>
        <ScrollView style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Provide feedback to</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={selectedDoctor ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {selectedDoctor || "Select a doctor"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Rate your experience</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(position => renderStar(position))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Any other notes?</Text>
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={6}
              value={notes}
              onChangeText={setNotes}
              placeholder="Type your message here..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={submitting}
            disabled={submitting}
          >
            Submit feedback
          </Button>
        </View>

        {/* Doctor Selection Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Select a Doctor</Text>
              
              {doctors.length === 0 ? (
                <Text style={styles.noDataText}>No doctors found in your appointment history.</Text>
              ) : (
                <FlatList
                  data={doctors}
                  renderItem={renderDoctorItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.modalListContent}
                />
              )}
              
              <Button
                mode="contained"
                onPress={() => setDropdownVisible(false)}
                style={styles.modalCloseButton}
                labelStyle={styles.buttonLabel}
              >
                Close
              </Button>
            </View>
          </View>
        </Modal>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
  },
  formContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  formSection: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.text,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  starContainer: {
    marginRight: 15,
  },
  star: {
    fontSize: 40,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: 150,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  submitButton: {
    marginBottom: 10,
    width: '100%',
    backgroundColor: theme.colors.primary,
  },
  // Modal styles from BookAppointments
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalListContent: {
    paddingBottom: 15,
  },
  doctorItem: {
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  doctorName: {
    fontSize: 16,
    color: '#000',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 120,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#fff',
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default Feedback;