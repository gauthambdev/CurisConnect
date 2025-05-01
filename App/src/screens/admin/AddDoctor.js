import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology',
  'Oncology', 'Gastroenterology', 'Psychiatry', 'Endocrinology', 'Ophthalmology',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEX_OPTIONS = ['Male', 'Female', 'Other'];

const AddDoctor = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    specialty: '',
    hospitalId: '',
    bloodGroup: '',
    dob: '',
    sex: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSpecialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [isHospitalModalVisible, setHospitalModalVisible] = useState(false);
  const [isBloodGroupModalVisible, setBloodGroupModalVisible] = useState(false);
  const [isSexModalVisible, setSexModalVisible] = useState(false);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'hospitals'));
        const hospitalList = querySnapshot.docs.map(doc => ({
          hospitalId: doc.data().hospitalId,
          name: doc.data().name,
          street: doc.data().street,
          city: doc.data().city,
          state: doc.data().state,
        })).sort((a, b) => a.name.localeCompare(b.name));
        setHospitals(hospitalList);
      } catch (error) {
        console.error('Error fetching hospitals:', error.message);
      }
    };
    fetchHospitals();
  }, []);

  const validateForm = async () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!/^\+?\d{10,15}$/.test(formData.contact.trim())) {
      newErrors.contact = 'Invalid phone format (e.g., +1234567890)';
    }
    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Specialty is required';
    } else if (!SPECIALTIES.includes(formData.specialty)) {
      newErrors.specialty = 'Invalid specialty selected';
    }
    if (!formData.hospitalId.trim()) {
      newErrors.hospitalId = 'Hospital is required';
    } else if (!hospitals.some(h => h.hospitalId === formData.hospitalId)) {
      newErrors.hospitalId = 'Invalid hospital selected';
    }
    if (!formData.bloodGroup.trim()) {
      newErrors.bloodGroup = 'Blood group is required';
    } else if (!BLOOD_GROUPS.includes(formData.bloodGroup)) {
      newErrors.bloodGroup = 'Invalid blood group selected';
    }
    if (!formData.dob.trim()) {
      newErrors.dob = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dob) || isNaN(new Date(formData.dob).getTime())) {
      newErrors.dob = 'Invalid date format (yyyy-mm-dd)';
    }
    if (!formData.sex.trim()) {
      newErrors.sex = 'Sex is required';
    } else if (!SEX_OPTIONS.includes(formData.sex)) {
      newErrors.sex = 'Invalid sex selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), '123');
      const user = userCredential.user;
      const uid = user.uid;
      await addDoc(collection(db, 'medicalstaff', uid), {

        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        contact: formData.contact.trim(),
        speciality: formData.specialty.trim(),
        hospitalId: formData.hospitalId.trim(),
        bloodGroup: formData.bloodGroup.trim(),
        dob: formData.dob.trim(),
        sex: formData.sex.trim(),
        role: 'doctor',
        createdAt: new Date(),
        profileImageURL: '',
      });

      setSuccessMessage('Doctor added successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        specialty: '',
        hospitalId: '',
        bloodGroup: '',
        dob: '',
        sex: '',
      });
      setTimeout(() => {
        navigation.navigate('ManageAdmins');
      }, 1500);
    } catch (error) {
      console.error('Error adding doctor:', error.message);
      setErrors({ submit: 'Failed to add doctor. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field] || errors.submit) {
      setErrors(prev => ({ ...prev, [field]: null, submit: null }));
    }
  };

  const handleSpecialtySelect = (specialty) => {
    handleInputChange('specialty', specialty);
    setSpecialtyModalVisible(false);
  };

  const handleHospitalSelect = (hospital) => {
    handleInputChange('hospitalId', hospital.hospitalId);
    setHospitalModalVisible(false);
  };

  const handleBloodGroupSelect = (bloodGroup) => {
    handleInputChange('bloodGroup', bloodGroup);
    setBloodGroupModalVisible(false);
  };

  const handleSexSelect = (sex) => {
    handleInputChange('sex', sex);
    setSexModalVisible(false);
  };

  const renderSpecialtyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specialtyItem}
      onPress={() => handleSpecialtySelect(item)}
    >
      <Text style={styles.specialtyText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHospitalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specialtyItem}
      onPress={() => handleHospitalSelect(item)}
    >
      <Text style={styles.specialtyText}>{`${item.name}, ${item.street}, ${item.city}, ${item.state}`}</Text>
    </TouchableOpacity>
  );

  const renderBloodGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specialtyItem}
      onPress={() => handleBloodGroupSelect(item)}
    >
      <Text style={styles.specialtyText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSexItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specialtyItem}
      onPress={() => handleSexSelect(item)}
    >
      <Text style={styles.specialtyText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>Add Doctor</Header>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentInset={{ left: 0, right: 0 }}
          scrollEventThrottle={16}
          bounces={false}
          alwaysBounceHorizontal={false}
          scrollEnabled={true}
          overScrollMode="never"
          style={{ width: '100%' }}
        >
          {successMessage ? (
            <View style={styles.successContainer}>
              <Icon name="check-circle" size={60} color="green" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={formData.firstName}
                  onChangeText={text => handleInputChange('firstName', text)}
                  placeholder="Enter first name"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={formData.lastName}
                  onChangeText={text => handleInputChange('lastName', text)}
                  placeholder="Enter last name"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={text => handleInputChange('email', text)}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={[styles.input, errors.contact && styles.inputError]}
                  value={formData.contact}
                  onChangeText={text => handleInputChange('contact', text)}
                  placeholder="Enter contact (e.g., 1234567890)"
                  keyboardType="phone-pad"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={15}
                  textBreakStrategy="simple"
                />
                {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth (yyyy-mm-dd)</Text>
                <TextInput
                  style={[styles.input, errors.dob && styles.inputError]}
                  value={formData.dob}
                  onChangeText={text => handleInputChange('dob', text)}
                  placeholder="Enter DOB (yyyy-mm-dd)"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={10}
                  textBreakStrategy="simple"
                />
                {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Blood Group</Text>
                <TouchableOpacity
                  style={[styles.input, styles.specialtyButton, errors.bloodGroup && styles.inputError]}
                  onPress={() => setBloodGroupModalVisible(true)}
                >
                  <Text style={[styles.specialtyText, !formData.bloodGroup && styles.placeholderText]}>
                    {formData.bloodGroup || 'Select blood group'}
                  </Text>
                </TouchableOpacity>
                {errors.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sex</Text>
                <TouchableOpacity
                  style={[styles.input, styles.specialtyButton, errors.sex && styles.inputError]}
                  onPress={() => setSexModalVisible(true)}
                >
                  <Text style={[styles.specialtyText, !formData.sex && styles.placeholderText]}>
                    {formData.sex || 'Select sex'}
                  </Text>
                </TouchableOpacity>
                {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specialty</Text>
                <TouchableOpacity
                  style={[styles.input, styles.specialtyButton, errors.specialty && styles.inputError]}
                  onPress={() => setSpecialtyModalVisible(true)}
                >
                  <Text style={[styles.specialtyText, !formData.specialty && styles.placeholderText]}>
                    {formData.specialty || 'Select specialty'}
                  </Text>
                </TouchableOpacity>
                {errors.specialty && <Text style={styles.errorText}>{errors.specialty}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hospital</Text>
                <TouchableOpacity
                  style={[styles.input, styles.specialtyButton, errors.hospitalId && styles.inputError]}
                  onPress={() => setHospitalModalVisible(true)}
                >
                  <Text style={[styles.specialtyText, !formData.hospitalId && styles.placeholderText]}>
                    {formData.hospitalId ? hospitals.find(h => h.hospitalId === formData.hospitalId)?.name || 'Select hospital' : 'Select hospital'}
                  </Text>
                </TouchableOpacity>
                {errors.hospitalId && <Text style={styles.errorText}>{errors.hospitalId}</Text>}
              </View>
              {errors.submit && (
                <View style={styles.submitErrorContainer}>
                  <Icon name="alert-circle" size={60} color="red" />
                  <Text style={styles.errorText}>{errors.submit}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Doctor</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Specialty Selection Modal */}
        <Modal
          visible={isSpecialtyModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSpecialtyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Specialty</Text>
              <FlatList
                data={SPECIALTIES}
                renderItem={renderSpecialtyItem}
                keyExtractor={item => item}
                style={styles.specialtyList}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSpecialtyModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hospital Selection Modal */}
        <Modal
          visible={isHospitalModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setHospitalModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Hospital</Text>
              <FlatList
                data={hospitals}
                renderItem={renderHospitalItem}
                keyExtractor={item => item.hospitalId}
                style={styles.specialtyList}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setHospitalModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Blood Group Selection Modal */}
        <Modal
          visible={isBloodGroupModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setBloodGroupModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <FlatList
                data={BLOOD_GROUPS}
                renderItem={renderBloodGroupItem}
                keyExtractor={item => item}
                style={styles.specialtyList}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setBloodGroupModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Sex Selection Modal */}
        <Modal
          visible={isSexModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSexModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Sex</Text>
              <FlatList
                data={SEX_OPTIONS}
                renderItem={renderSexItem}
                keyExtractor={item => item}
                style={styles.specialtyList}
                showsVerticalScrollIndicator={false}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSexModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
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
    backgroundColor: '#fff',
    width: SCREEN_WIDTH,
    maxWidth: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: SCREEN_WIDTH,
    maxWidth: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  scrollViewContainer: {
    flexGrow: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginVertical: 18,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1F2937',
    width: 320,
    flexShrink: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
  specialtyButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyText: {
    fontSize: 18,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 20,
    color: 'red',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
    maxWidth: '100%',
    ellipsizeMode: 'tail',
    numberOfLines: 1,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 20,
    alignItems: 'center',
    width: Math.min(260, SCREEN_WIDTH - 40),
    maxWidth: SCREEN_WIDTH - 40,
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#aaa',
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  successContainer: {
    width: Math.min(260, SCREEN_WIDTH - 40),
    maxWidth: SCREEN_WIDTH - 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    alignSelf: 'center',
  },
  successText: {
    fontSize: 18,
    color: 'green',
    textAlign: 'center',
    marginTop: 12,
    width: Math.min(260, SCREEN_WIDTH - 40),
    maxWidth: SCREEN_WIDTH - 40,
    ellipsizeMode: 'tail',
    numberOfLines: 1,
    overflow: 'hidden',
  },
  submitErrorContainer: {
    width: Math.min(260, SCREEN_WIDTH - 40),
    maxWidth: SCREEN_WIDTH - 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: Math.min(300, SCREEN_WIDTH - 40),
    maxHeight: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  specialtyList: {
    maxHeight: 300,
  },
  specialtyItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AddDoctor;