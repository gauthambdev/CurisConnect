import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddHospital = ({ navigation }) => {
  const [formData, setFormData] = useState({
    hospitalId: '',
    name: '',
    state: '',
    city: '',
    street: '',
    contact: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = async () => {
    const newErrors = {};
    if (!formData.hospitalId.trim()) newErrors.hospitalId = 'Hospital ID is required';
    else {
      const q = query(collection(db, 'hospitals'), where('hospitalId', '==', formData.hospitalId.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        newErrors.hospitalId = 'Hospital ID already exists';
      }
    }
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.contact.trim()) newErrors.contact = 'Contact information is required';
    else if (!/^\+?\d{10,15}$/.test(formData.contact.trim())) {
      newErrors.contact = 'Enter a valid phone number (10-15 digits)';
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
      await addDoc(collection(db, 'hospitals'), {
        hospitalId: formData.hospitalId.trim(),
        name: formData.name.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        street: formData.street.trim(),
        contact: formData.contact.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccessMessage('Hospital added successfully!');
      setFormData({
        hospitalId: '',
        name: '',
        state: '',
        city: '',
        street: '',
        contact: '',
      });
      setTimeout(() => {
        navigation.navigate('AdminDashboard');
      }, 1500);
    } catch (error) {
      console.error('Error adding hospital:', error.message);
      setErrors({ submit: 'Failed to add hospital. Please try again.' });
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>Add Hospital</Header>
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {successMessage ? (
            <View style={styles.successContainer}>
              <Icon name="check-circle" size={60} color="green" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.inputContainer, styles.firstInputContainer]}>
                <Text style={styles.label}>Hospital ID</Text>
                <TextInput
                  style={[styles.input, errors.hospitalId && styles.inputError]}
                  value={formData.hospitalId}
                  onChangeText={text => handleInputChange('hospitalId', text)}
                  placeholder="Enter hospital ID"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.hospitalId && <Text style={styles.errorText}>{errors.hospitalId}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={text => handleInputChange('name', text)}
                  placeholder="Enter hospital name"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={[styles.input, errors.state && styles.inputError]}
                  value={formData.state}
                  onChangeText={text => handleInputChange('state', text)}
                  placeholder="Enter state"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  value={formData.city}
                  onChangeText={text => handleInputChange('city', text)}
                  placeholder="Enter city"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  style={[styles.input, errors.street && styles.inputError]}
                  value={formData.street}
                  onChangeText={text => handleInputChange('street', text)}
                  placeholder="Enter street address"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={[styles.input, errors.contact && styles.inputError]}
                  value={formData.contact}
                  onChangeText={text => handleInputChange('contact', text)}
                  placeholder="Enter contact number"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={15}
                  keyboardType="phone-pad"
                  textBreakStrategy="simple"
                />
                {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
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
                  <Text style={styles.submitButtonText}>Add Hospital</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
    marginTop: Platform.OS === 'ios' ? Math.max(24, SCREEN_HEIGHT * 0.04) : 16,
    paddingVertical: 8,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  firstInputContainer: {
    marginTop: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#1F2937',
    width: 320,
    textAlign: 'center',
    minHeight: 60,
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
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
    minHeight: 60,
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
});

export default AddHospital;