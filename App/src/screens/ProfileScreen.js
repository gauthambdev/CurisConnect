import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

const ProfileScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState({ value: '', error: '' });
  const [lastName, setLastName] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [phoneNumber, setPhoneNumber] = useState({ value: '', error: '' });
  const [birthDate, setBirthDate] = useState({ value: '', error: '' });
  const [gender, setGender] = useState({ value: '', error: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName({ value: userData.firstName || '', error: '' });
            setLastName({ value: userData.lastName || '', error: '' });
            setEmail({ value: userData.email || '', error: '' });
            setPhoneNumber({ value: userData.phoneNumber || '', error: '' });
            setBirthDate({ value: userData.birthDate || '', error: '' });
            setGender({ value: userData.gender || '', error: '' });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          phoneNumber: phoneNumber.value,
          birthDate: birthDate.value,
          gender: gender.value,
        });
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <BackButton goBack={navigation.goBack} />
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={() => console.log('Edit profile picture')}>
              <Image
                source={require('../assets/profile-placeholder.jpg')}
                style={styles.profileImage}
              />
              <View style={styles.editIcon}>
                <Text style={styles.editText}>🖌️</Text>
              </View>
            </TouchableOpacity>
            <Header>Edit Profile</Header>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              label="First Name"
              returnKeyType="next"
              value={firstName.value}
              onChangeText={(text) => setFirstName({ value: text, error: '' })}
              error={!!firstName.error}
              errorText={firstName.error}
              editable={isEditing}
            />
            <TextInput
              label="Last Name"
              returnKeyType="next"
              value={lastName.value}
              onChangeText={(text) => setLastName({ value: text, error: '' })}
              error={!!lastName.error}
              errorText={lastName.error}
              editable={isEditing}
            />
            <TextInput
              label="Email"
              returnKeyType="next"
              value={email.value}
              onChangeText={(text) => setEmail({ value: text, error: '' })}
              error={!!email.error}
              errorText={email.error}
              autoCapitalize="none"
              autoCompleteType="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              editable={isEditing}
            />
            <TextInput
              label="Phone Number"
              returnKeyType="next"
              value={phoneNumber.value}
              onChangeText={(text) => setPhoneNumber({ value: text, error: '' })}
              error={!!phoneNumber.error}
              errorText={phoneNumber.error}
              keyboardType="phone-pad"
              editable={isEditing}
            />
            <TextInput
              label="Birth Date (YYYY-MM-DD)"
              returnKeyType="next"
              value={birthDate.value}
              onChangeText={(text) => setBirthDate({ value: text, error: '' })}
              error={!!birthDate.error}
              errorText={birthDate.error}
              placeholder="YYYY-MM-DD"
              editable={isEditing}
            />
            <TextInput
              label="Gender (Male/Female/Other)"
              returnKeyType="next"
              value={gender.value}
              onChangeText={(text) => setGender({ value: text, error: '' })}
              error={!!gender.error}
              errorText={gender.error}
              editable={isEditing}
            />
          </View>
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
                Save
              </Button>
            ) : (
              <Button mode="contained" onPress={() => setIsEditing(true)} style={styles.editButton}>
                Edit
              </Button>
            )}
            <Button mode="contained" onPress={handleChangePassword} style={styles.changePasswordButton}>
              Change Password 🔒
            </Button>
          </View>
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 2,
  },
  editText: {
    color: '#fff',
    fontSize: 12,
  },
  inputContainer: {
    paddingVertical: 20,
  },
  buttonContainer: {
    marginTop: 10,
    alignSelf: 'flex-end', // Move the entire button container to the right
    width: 'auto', // Ensure it doesn't stretch unnecessarily
  },
  saveButton: {
    marginHorizontal: 80, // Keep original horizontal margin
    backgroundColor: theme.colors.primary,
    width:'auto',
    marginBottom: 10, // Spacing between buttons
  },
  editButton: {
    marginHorizontal: 80, // Keep original horizontal margin
    backgroundColor: theme.colors.primary,
    width:"auto",
    marginBottom: 10, // Spacing between buttons
  },
  changePasswordButton: {
    marginHorizontal: 20, // Keep original horizontal margin
    backgroundColor: theme.colors.primary,
  },
});

export default ProfileScreen;