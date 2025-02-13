import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { Text } from 'react-native-paper';
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import { emailValidator } from '../helpers/emailValidator';
import { passwordValidator } from '../helpers/passwordValidator';
import { nameValidator } from '../helpers/nameValidator';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState({ value: '', error: '' });
  const [lastName, setLastName] = useState({ value: '', error: '' });
  const [dob, setDob] = useState({ value: '', error: '' });
  const [bloodGroup, setBloodGroup] = useState({ value: '', error: '' });
  const [sex, setSex] = useState({ value: '', error: '' });
  const [address, setAddress] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });

  const onSignUpPressed = async () => {
    const firstNameError = nameValidator(firstName.value);
    const lastNameError = nameValidator(lastName.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    
    if (firstNameError || lastNameError || emailError || passwordError) {
      setFirstName({ ...firstName, error: firstNameError });
      setLastName({ ...lastName, error: lastNameError });
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      const user = userCredential.user;

      // Store user details in Firestore with the role "patient"
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.value,
        lastName: lastName.value,
        dob: dob.value,
        bloodGroup: bloodGroup.value,
        sex: sex.value,
        address: address.value,
        email: email.value,
        role: "patient",
      });

      Alert.alert("Success", "Account created successfully!");
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'PatientDashboard' }],
      });
      
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Logo />
          <Header>Create Account</Header>
          <TextInput label="First Name" returnKeyType="next" value={firstName.value} onChangeText={(text) => setFirstName({ value: text, error: '' })} error={!!firstName.error} errorText={firstName.error} />
          <TextInput label="Last Name" returnKeyType="next" value={lastName.value} onChangeText={(text) => setLastName({ value: text, error: '' })} error={!!lastName.error} errorText={lastName.error} />
          <TextInput label="Date of Birth (YYYY-MM-DD)" returnKeyType="next" value={dob.value} onChangeText={(text) => setDob({ value: text, error: '' })} error={!!dob.error} errorText={dob.error} />
          <TextInput label="Blood Group" returnKeyType="next" value={bloodGroup.value} onChangeText={(text) => setBloodGroup({ value: text, error: '' })} error={!!bloodGroup.error} errorText={bloodGroup.error} />
          <TextInput label="Sex (Male/Female/Other)" returnKeyType="next" value={sex.value} onChangeText={(text) => setSex({ value: text, error: '' })} error={!!sex.error} errorText={sex.error} />
          <TextInput label="Address" returnKeyType="next" value={address.value} onChangeText={(text) => setAddress({ value: text, error: '' })} error={!!address.error} errorText={address.error} />
          <TextInput label="Email" returnKeyType="next" value={email.value} onChangeText={(text) => setEmail({ value: text, error: '' })} error={!!email.error} errorText={email.error} autoCapitalize="none" autoCompleteType="email" textContentType="emailAddress" keyboardType="email-address" />
          <TextInput label="Password" returnKeyType="done" value={password.value} onChangeText={(text) => setPassword({ value: text, error: '' })} error={!!password.error} errorText={password.error} secureTextEntry />
          <Button mode="contained" onPress={onSignUpPressed} style={{ marginTop: 24 }}>Sign Up</Button>
          <View style={styles.row}>
            <Text>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('LoginScreen')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures full height usage
  },
  scrollContainer: {
    width: '100%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
    justifyContent: 'center',
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});