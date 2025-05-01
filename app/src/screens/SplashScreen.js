import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import Logo from '../components/Logo';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Wait for 2 seconds to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (user) {
        // Fetch role from Firestore
        const collections = ["patients", "medicalstaff", "admins"];
        let userRole = null;
        for (const collectionName of collections) {
          const userDoc = await getDoc(doc(db, collectionName, user.uid));
          if (userDoc.exists()) {
            userRole = userDoc.data().role;
            break;
          }
        }
        if (userRole === "doctor") {
          navigation.reset({ index: 0, routes: [{ name: "DoctorTabs" }] });
        } else if (userRole === "admin") {
          navigation.reset({ index: 0, routes: [{ name: "AdminTabs" }] });
        } else if (userRole === "patient") {
          navigation.reset({ index: 0, routes: [{ name: "PatientTabs" }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "Start" }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Start" }] });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Logo animated={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default SplashScreen; 