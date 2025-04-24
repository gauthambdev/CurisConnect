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

const AddHospital = ({ navigation }) => {
  const [formData, setFormData] = useState({
    hospitalId: '',
    name: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = async () => {
    const newErrors = {};
    if (!formData.hospitalId.trim()) newErrors.hospitalId = 'Hospital ID is required';
    else {
      // Check for duplicate hospitalId
      const q = query(collection(db, 'hospitals'), where('hospitalId', '==', formData.hospitalId.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        newErrors.hospitalId = 'Hospital ID already exists';
      }
    }
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
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
        address: formData.address.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccessMessage('Hospital added successfully!');
      setFormData({
        hospitalId: '',
        name: '',
        address: '',
      });
      setTimeout(() => {
        navigation.goBack();
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
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  value={formData.address}
                  onChangeText={text => handleInputChange('address', text)}
                  placeholder="Enter hospital address"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  maxLength={40}
                  textBreakStrategy="simple"
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
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
});

export default AddHospital;