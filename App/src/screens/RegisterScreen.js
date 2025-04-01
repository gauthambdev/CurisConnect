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
import { Text, Menu, Divider } from 'react-native-paper';
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Background from '../components/Background';
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
  const [bloodGroupVisible, setBloodGroupVisible] = useState(false);
  const [sex, setSex] = useState({ value: '', error: '' });
  const [sexVisible, setSexVisible] = useState(false);
  const [address, setAddress] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

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
        profileImageURL: "",
        contact: "",
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
        <View style={styles.header}>
          <Text style={styles.appName}></Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          <Header>        Create Your Account</Header>
          <Text style={styles.subtitle}>
            Provide details to tailor your health journey.
          </Text>
          
          <View style={styles.formContainer}>
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
              returnKeyType="next" 
              value={password.value} 
              onChangeText={(text) => setPassword({ value: text, error: '' })} 
              error={!!password.error} 
              errorText={password.error} 
              secureTextEntry 
              style={styles.input}
            />
            
            <Menu
              visible={sexVisible}
              onDismiss={() => setSexVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={[styles.dropdownButton, !!sex.error && styles.errorInput]} 
                  onPress={() => setSexVisible(true)}
                >
                  <Text style={sex.value ? styles.dropdownValue : styles.dropdownPlaceholder}>
                    {sex.value || "Gender"}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    {sexVisible ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
              }
            >
              {genders.map((gender) => (
                <Menu.Item 
                  key={gender} 
                  onPress={() => {
                    setSex({ value: gender, error: '' });
                    setSexVisible(false);
                  }} 
                  title={gender} 
                />
              ))}
            </Menu>
            {!!sex.error && <Text style={styles.errorText}>{sex.error}</Text>}
            
            <TextInput 
              label="Date of Birth (DD/MM/YYYY)" 
              returnKeyType="next" 
              value={dob.value} 
              onChangeText={(text) => setDob({ value: text, error: '' })} 
              error={!!dob.error} 
              errorText={dob.error} 
              style={styles.input}
            />
            
            <Menu
              visible={bloodGroupVisible}
              onDismiss={() => setBloodGroupVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={[styles.dropdownButton, !!bloodGroup.error && styles.errorInput]} 
                  onPress={() => setBloodGroupVisible(true)}
                >
                  <Text style={bloodGroup.value ? styles.dropdownValue : styles.dropdownPlaceholder}>
                    {bloodGroup.value || "Blood Group"}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    {bloodGroupVisible ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
              }
            >
              {bloodGroups.map((group) => (
                <Menu.Item 
                  key={group} 
                  onPress={() => {
                    setBloodGroup({ value: group, error: '' });
                    setBloodGroupVisible(false);
                  }} 
                  title={group} 
                />
              ))}
            </Menu>
            {!!bloodGroup.error && <Text style={styles.errorText}>{bloodGroup.error}</Text>}
            
            <TextInput 
              label="Address" 
              returnKeyType="done" 
              value={address.value} 
              onChangeText={(text) => setAddress({ value: text, error: '' })} 
              error={!!address.error} 
              errorText={address.error} 
              style={styles.input}
            />
            
            <Button 
              mode="contained" 
              onPress={onSignUpPressed} 
              style={styles.registerButton}
            >
              Register
            </Button>
            
            <TouchableOpacity 
              style={styles.loginLink} 
              onPress={() => navigation.replace('LoginScreen')}
            >
              <Text style={styles.loginText}>Already have an account? Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  placeholder: {
    width: 40, // Same width as back button for alignment
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  dropdownButton: {
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    height: 56,
    marginBottom: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    color: '#888',
    fontSize: 16,
  },
  dropdownValue: {
    color: '#000',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 16,
  },
  errorInput: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    paddingHorizontal: 4,
    marginTop: -14,
    marginBottom: 12,
  },
  registerButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#670cce', // Purple color from your image
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
});