import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBBIZsAdAc_cvaUubnd2iQNAPsrJ5G7ZmQ",
  authDomain: "umconvo-app.firebaseapp.com",
  projectId: "umconvo-app",
  storageBucket: "umconvo-app.firebasestorage.app",
  messagingSenderId: "868341431770",
  appId: "1:868341431770:web:577e6f6069cbd269c294e3"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };
//IOS: 378967716917-8cvh67gtcel268vl0k5cup07ld2nikbm.apps.googleusercontent.com
//Android: 378967716917-lt9avrrtpo78a8vvehg328g4q3jhtsa2.apps.googleusercontent.com