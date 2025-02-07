import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // Import the getAuth function for auth
import { getFirestore } from 'firebase/firestore';

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
const auth = getAuth(app)

export { db, auth };
