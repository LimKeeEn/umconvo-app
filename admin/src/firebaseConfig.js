import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBBIZsAdAc_cvaUubnd2iQNAPsrJ5G7ZmQ",
  authDomain: "umconvo-app.firebaseapp.com",
  projectId: "umconvo-app",
  storageBucket: "umconvo-app.firebasestorage.app",
  messagingSenderId: "868341431770",
  appId: "1:868341431770:web:577e6f6069cbd269c294e3"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firestore and Storage instances
export const db = getFirestore(app);
export const storage = getStorage(app);