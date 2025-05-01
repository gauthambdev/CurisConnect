import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AddAdmin = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    hospitalId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isHospitalModalVisible, setHospitalModalVisible] = useState(false);
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

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8); // 8-character alphanumeric password
  };

  const validateForm = async () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else {
      const q = query(collection(db, 'admins'), where('email', '==', formData.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        newErrors.email = 'Email already exists';
      }
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.hospitalId.trim()) {
      newErrors.hospitalId = 'Hospital is required';
    } else if (!hospitals.some(h => h.hospitalId === formData.hospitalId)) {
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

    const tempPassword = generateTempPassword();

    try {
      await addDoc(collection(db, 'admins'), {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        hospitalId: formData.hospitalId.trim(),
        password: tempPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccessMessage(`Admin added successfully! Temporary password: ${tempPassword}`);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        hospitalId: '',
      });
      setTimeout(() => {
        navigation.navigate('AdminDashboard');
      }, 2000);
    } catch (error) {
      console.error('Error adding admin:', error.message);
      setErrors({ submit: 'Failed to add admin. Please try again.' });
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

  const handleHospitalSelect = (hospital) => {
    handleInputChange('hospitalId', hospital.hospitalId);
    setHospitalModalVisible(false);
  };

  const renderHospitalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.specialtyItem}
      onPress={() => handleHospitalSelect(item)}
    >
      <Text style={styles.specialtyText}>{`${item.name}, ${item.street}, ${item.city}, ${item.state}`}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>Add Admin</Header>
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
        >
          {successMessage ? (
            <View style={styles.successContainer}>
              <Icon name="check-circle" size={60} color="green" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : (
            <>
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
                  <Text style={styles.submitButtonText}>Add Admin</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

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
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
  },
  scrollViewContainer: {
    flexGrow: 1,
    minHeight: '100%',
    paddingHorizontal: 24,
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 18,
    color: '#1F2937',
    width: 320,
    textAlign: 'center',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  successText: {
    marginTop: 16,
    fontSize: 20,
    color: 'green',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitErrorContainer: {
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
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

export default AddAdmin;