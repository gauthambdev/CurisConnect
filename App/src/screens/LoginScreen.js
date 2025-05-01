import React, { useState } from "react";
import { Alert } from "react-native";
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { theme } from '../core/theme';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { Text } from 'react-native-paper';
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore imports
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase Auth
import { useNavigation } from "@react-navigation/native";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);

  const onLoginPressed = async () => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
  
    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }
  
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
      const user = userCredential.user;
  
      // Fetch user role from Firestore
      const collections = ["patients", "medicalstaff", "admins"];
      let userRole = null;
      let collectionName = null;
  
      for (const collection of collections) {
        const userDoc = await getDoc(doc(db, collection, user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role;
          collectionName = collection;
          break;
        }
      }
  
      if (!userRole) {
        // Handle case where user exists in Auth but not in Firestore
        Alert.alert("Error", "User role not found. Please contact support.");
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // Update last login timestamp
      await setDoc(doc(db, collectionName, user.uid), { 
        lastLogin: new Date().toISOString() 
      }, { merge: true });
      
      // We'll let the AppNavigator handle the navigation based on auth state
      // But we'll navigate directly to Splash screen to trigger re-checking
      navigation.navigate('Splash');
      
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Please check your credentials and try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <Logo />
      <Header>Welcome!</Header>
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
        disabled={loading}
      />
      <TextInput
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
        disabled={loading}
      />
      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ResetPasswordScreen')}
          disabled={loading}
        >
          <Text style={styles.forgot}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
      <Button 
        mode="contained" 
        onPress={onLoginPressed} 
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <View style={styles.row}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('RegisterScreen')}
          disabled={loading}
        >
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});