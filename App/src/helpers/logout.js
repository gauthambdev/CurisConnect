// utils/logout.js
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Assuming Firebase auth is already configured

export const logout = async (navigation) => {
  try {
    // Sign out the user from Firebase
    await signOut(auth);

    // Reset navigation stack and navigate to the StartScreen (login page)
    navigation.reset({
      index: 0,
      routes: [{ name: 'StartScreen' }],
    });
  } catch (error) {
    console.error("Logout error: ", error.message);
  }
};
