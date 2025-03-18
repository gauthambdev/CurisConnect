import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Add this import
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5HLMMVOoQRLZylRJJ3bKGWAak-gsC6EM",
  authDomain: "curis-fffdc.firebaseapp.com",
  projectId: "curis-fffdc",
  storageBucket: "curis-fffdc.firebasestorage.app",
  messagingSenderId: "862640950683",
  appId: "1:862640950683:web:e7dedb8333661779f7a53e"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Storage
const storage = getStorage(app);

export { db, auth, storage }; // Export storage along with db and auth