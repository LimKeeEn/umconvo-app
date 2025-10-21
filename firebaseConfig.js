import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBBIZsAdAc_cvaUubnd2iQNAPsrJ5G7ZmQ",
  authDomain: "umconvo-app.firebaseapp.com",
  projectId: "umconvo-app",
  storageBucket: "umconvo-app.appspot.com",
  messagingSenderId: "868341431770",
  appId: "1:868341431770:web:577e6f6069cbd269c294e3",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export REST API base URLs
export const firestoreBaseURL = "https://firestore.googleapis.com/v1/projects/umconvo-app/databases/(default)/documents/";
export const storageBaseURL = "https://firebasestorage.googleapis.com/v0/b/umconvo-app.appspot.com/o";

export default app;
//IOS: 378967716917-8cvh67gtcel268vl0k5cup07ld2nikbm.apps.googleusercontent.com
//Android: 378967716917-lt9avrrtpo78a8vvehg328g4q3jhtsa2.apps.googleusercontent.com