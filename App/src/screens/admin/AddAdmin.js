import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

// Get screen width for dynamic sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AddAdmin = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      // Check for duplicate email
      const q = query(collection(db, 'admins'), where('email', '==', formData.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        newErrors.email = 'Email already exists';
      }
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
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
      });
      setTimeout(() => {
        navigation.goBack();
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
    numberOfLines: 2, // Allow 2 lines for password display
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
});

export default AddAdmin;