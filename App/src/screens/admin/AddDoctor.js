import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

// Get screen width for dynamic sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Predefined list of specialties
const SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Oncology',
  'Gastroenterology',
  'Psychiatry',
  'Endocrinology',
  'Ophthalmology',
];

const AddDoctor = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    hospitalId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSpecialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [isHospitalModalVisible, setHospitalModalVisible] = useState(false);
  const [hospitals, setHospitals] = useState([]);

  // Fetch hospitals from Firebase
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'hospitals'));
        const hospitalList = querySnapshot.docs.map(doc => doc.data().name).sort();
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
    if (formData.phone && !/^\+?\d{10,15}$|^$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format (e.g., +1234567890)';
    }
    if (!formData.specialty.trim()) {
      newErrors.specialty = 'Specialty is required';
    } else if (!SPECIALTIES.includes(formData.specialty)) {
      newErrors.specialty = 'Invalid specialty selected';
    }
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    } else {
      const q = query(collection(db, 'medicalstaff'), where('licenseNumber', '==', formData.licenseNumber.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        newErrors.licenseNumber = 'License number already exists';
      }
    }
    if (formData.hospitalId && !hospitals.includes(formData.hospitalId)) {
      newErrors.hospitalId = 'Invalid hospital selected';
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
      await addDoc(collection(db, 'medicalstaff'), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        specialty: formData.specialty.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        hospitalId: formData.hospitalId.trim() || null,
        role: 'doctor',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccessMessage('Doctor added successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialty: '',
        licenseNumber: '',
        hospitalId: '',
      });
      setTimeout(() => {
        navigation.goBack();
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
    handleInputChange('hospitalId', hospital);
    setHospitalModalVisible(false);
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
          onScroll={event => {
            const xOffset = event.nativeEvent.contentOffset.x;
            if (Math.abs(xOffset) > 0.5) {
              console.log(`Horizontal scroll detected: ${xOffset}, resetting to 0`);
              event.target.scrollTo({ x: 0, animated: false });
            }
          }}
          bounces={false}
          alwaysBounceHorizontal={false}
          scrollEnabled={true}
          overScrollMode="never"
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
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={formData.phone}
                  onChangeText={text => handleInputChange('phone', text)}
                  placeholder="Enter phone (e.g., +1234567890)"
                  keyboardType="phone-pad"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
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
                <Text style={styles.label}>License Number</Text>
                <TextInput
                  style={[styles.input, errors.licenseNumber && styles.inputError]}
                  value={formData.licenseNumber}
                  onChangeText={text => handleInputChange('licenseNumber', text)}
                  placeholder="Enter license number"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hospital Name (Optional)</Text>
                <TouchableOpacity
                  style={[styles.input, styles.specialtyButton, errors.hospitalId && styles.inputError]}
                  onPress={() => setHospitalModalVisible(true)}
                >
                  <Text style={[styles.specialtyText, !formData.hospitalId && styles.placeholderText]}>
                    {formData.hospitalId || 'Select hospital'}
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
                keyExtractor={item => item}
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    width: SCREEN_WIDTH,
    minWidth: SCREEN_WIDTH - 40,
    maxWidth: SCREEN_WIDTH - 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexWrap: 'wrap',
    flexDirection: 'column',
    flex: 0,
  },
  inputContainer: {
    marginVertical: 18,
    width: Math.min(260, SCREEN_WIDTH - 40),
    maxWidth: SCREEN_WIDTH - 40,
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
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
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