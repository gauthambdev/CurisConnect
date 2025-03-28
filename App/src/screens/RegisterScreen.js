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

      await setDoc(doc(db, "patients", user.uid), {
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <View style={styles.topContainer}>
          <BackButton goBack={navigation.goBack} />
          <Logo />
          <Header>Create Account</Header>
        </View>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          <TextInput 
            label="First Name" 
            returnKeyType="next" 
            value={firstName.value} 
            onChangeText={(text) => setFirstName({ value: text, error: '' })} 
            error={!!firstName.error} 
            errorText={firstName.error} 
            style={styles.input}
          />
          <TextInput 
            label="Last Name" 
            returnKeyType="next" 
            value={lastName.value} 
            onChangeText={(text) => setLastName({ value: text, error: '' })} 
            error={!!lastName.error} 
            errorText={lastName.error} 
            style={styles.input}
          />
          <TextInput 
            label="Date of Birth (YYYY-MM-DD)" 
            returnKeyType="next" 
            value={dob.value} 
            onChangeText={(text) => setDob({ value: text, error: '' })} 
            error={!!dob.error} 
            errorText={dob.error} 
            style={styles.input}
          />
          <TextInput 
            label="Blood Group" 
            returnKeyType="next" 
            value={bloodGroup.value} 
            onChangeText={(text) => setBloodGroup({ value: text, error: '' })} 
            error={!!bloodGroup.error} 
            errorText={bloodGroup.error} 
            style={styles.input}
          />
          <TextInput 
            label="Sex (Male/Female/Other)" 
            returnKeyType="next" 
            value={sex.value} 
            onChangeText={(text) => setSex({ value: text, error: '' })} 
            error={!!sex.error} 
            errorText={sex.error} 
            style={styles.input}
          />
          <TextInput 
            label="Address" 
            returnKeyType="next" 
            value={address.value} 
            onChangeText={(text) => setAddress({ value: text, error: '' })} 
            error={!!address.error} 
            errorText={address.error} 
            style={styles.input}
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
            style={styles.input}
          />
          <TextInput 
            label="Password" 
            returnKeyType="done" 
            value={password.value} 
            onChangeText={(text) => setPassword({ value: text, error: '' })} 
            error={!!password.error} 
            errorText={password.error} 
            secureTextEntry 
            style={styles.input}
          />
        </ScrollView>
        <View style={styles.bottomContainer}>
          <Button 
            mode="contained" 
            onPress={onSignUpPressed} 
            style={styles.signUpButton}
          >
            Sign Up
          </Button>
          <View style={styles.row}>
            <Text>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('LoginScreen')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topContainer: {
    alignItems: 'center',
    paddingTop: 30, // Adjusted for iPhone 14 notch
    paddingBottom: 10,
  },
  scrollContainer: {
    paddingVertical: 10,
    paddingHorizontal: 25, // Slightly wider padding for iPhone 14
    flexGrow: 1,
  },
  input: {
    width: '100%',
    height: 60, // Larger input height for better touch targets on iPhone 14
    marginBottom: 20, // Increased spacing for readability
    paddingHorizontal: 15, // More padding inside inputs
    fontSize: 16, // Slightly larger text for iPhone 14
  },
  bottomContainer: {
    paddingHorizontal: 25,
    paddingBottom: 30, // Extra padding to avoid overlap with iPhone 14's home indicator
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    height: 50, // Fixed height for consistency
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontSize: 16, // Larger text for readability
  },
});

