import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import { theme } from '../../core/theme';
import { navigationRef } from '../../navigation/navigationRef';

const AdminProfileScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState({ value: '', error: '' });
  const [lastName, setLastName] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [contact, setContact] = useState({ value: '', error: '' });
  const [address, setAddress] = useState({ value: '', error: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageURL, setProfileImageURL] = useState(null);
  const defaultImage = require('../../assets/icon.png');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'admins', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName({ value: userData.firstName || '', error: '' });
            setLastName({ value: userData.lastName || '', error: '' });
            setEmail({ value: userData.email || '', error: '' });
            setContact({ value: String(userData.contact || ''), error: '' });
            setAddress({ value: userData.address || '', error: '' });
            if (userData.profileImageURL) {
              setProfileImageURL(userData.profileImageURL);
            } else {
              setProfileImageURL(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };
    fetchUserData();
    requestGalleryPermission();
  }, []);

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to change profile picture.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        await uploadImageToFirebase(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setProfileImageURL(downloadURL);
      const userDocRef = doc(db, 'admins', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        await updateDoc(userDocRef, { profileImageURL: downloadURL });
      }
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    }
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'admins', user.uid);
        const updateData = {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          contact: contact.value ? Number(contact.value) : '',
          address: address.value,
        };
        if (profileImageURL) {
          updateData.profileImageURL = profileImageURL;
        }
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          await updateDoc(userDocRef, updateData);
        }
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ResetPassword');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Start');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <ScrollView contentContainerStyle={styles.scrollViewContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={pickImage}>
              {profileImageURL ? (
                <Image
                  source={{ uri: profileImageURL }}
                  style={styles.profileImage}
                  onError={() => {
                    setProfileImageURL(null);
                  }}
                />
              ) : (
                <Image
                  source={defaultImage}
                  style={styles.profileImage}
                />
              )}
              <View style={styles.editIcon}>
                <Text style={styles.editText}>🖌️</Text>
              </View>
            </TouchableOpacity>
            <Header>Admin Profile</Header>
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
              label="Address"
              returnKeyType="next"
              value={address.value}
              onChangeText={(text) => setAddress({ value: text, error: '' })}
              error={!!address.error}
              errorText={address.error}
              editable={isEditing}
            />
            <TextInput
              label="Contact Number"
              returnKeyType="next"
              value={contact.value}
              onChangeText={(text) => setContact({ value: text, error: '' })}
              error={!!contact.error}
              errorText={contact.error}
              keyboardType="phone-pad"
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
            <Button 
              mode="contained" 
              onPress={handleLogout} 
              style={styles.logoutButton}
            >
              Log Out
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
    paddingVertical: 0,
  },
  buttonContainer: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: 'auto',
  },
  saveButton: {
    marginHorizontal: 80,
    backgroundColor: theme.colors.primary,
    width:'auto',
    marginBottom: 10,
  },
  editButton: {
    marginHorizontal: 80,
    backgroundColor: theme.colors.primary,
    width:'auto',
    marginBottom: 10,
  },
  changePasswordButton: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.primary,
  },
  logoutButton: {
    marginHorizontal: 70,
    backgroundColor: theme.colors.primary,
    width:'60%',
  },
});

export default AdminProfileScreen; 