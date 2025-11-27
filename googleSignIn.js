import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://192.168.0.162:5000';

GoogleSignin.configure({
  webClientId: '868341431770-f06uasd307r3p5q2v4ree5lj1bpk1bc8.apps.googleusercontent.com',
  offlineAccess: false,
  forceCodeForRefreshToken: true,
  scopes: ['profile', 'email']
});

export function useGoogleSignIn(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const signIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();

      // Step 1: Start Google sign-in
      const userInfo = await GoogleSignin.signIn();
      console.log('Full userInfo:', JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.idToken || userInfo.data?.idToken || userInfo.user?.idToken;

      // Step 2: Sign in to Firebase using Google credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const firebaseUser = userCredential.user;
      console.log('Firebase sign in success:', userCredential.user.email);

      // Step 3: Get Firebase ID token to send to backend
      const firebaseIdToken = await userCredential.user.getIdToken(true);

      // Step 4: Call backend to verify email domain
      console.log('Sending ID token to backend...');
      const response = await fetch(`${API_URL}/api/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken }),
      });

      // Step 5: Handle response safely
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('⚠️ Backend returned non-JSON response:', text);
        throw new Error('Server did not return valid JSON. Check backend logs.');
      }

      if (!response.ok || !data.success) {
        // Sign out on failure
        await GoogleSignin.signOut();
        await auth.signOut();
        Alert.alert(
          'Access Denied',
          data.message || 'Only @siswa.um.edu.my email addresses are allowed to sign in.',
          [{ text: 'OK' }]
        );
        throw new Error(data.message || 'Email verification failed.');
      }

      console.log('✅ Email verified successfully:', data.user);

      // Step 6: Check if user exists in Firestore database
      console.log('Checking if user is registered...');
      const userCheckResponse = await fetch(`${API_URL}/api/get-user/${encodeURIComponent(firebaseUser.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const userCheckData = await userCheckResponse.json();

      if (userCheckResponse.ok && userCheckData.success && userCheckData.user) {
        // User exists in database - navigate to MainApp
        console.log('✅ User found in database, navigating to MainApp');
        navigation.navigate('MainApp', {
          userInfo: {
            user: {
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photo: firebaseUser.photoURL,
              ...userCheckData.user // Include additional user data from Firestore
            }
          }
        });
      } else {
        // User does not exist - navigate to Register
        console.log('⚠️ User not found in database, navigating to Register');
        navigation.navigate('Register', {
          userInfo: {
            user: {
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photo: firebaseUser.photoURL,
            }
          }
        });
      }

    } catch (err) {
      
      // Handle sign-in cancellation silently (user clicked outside or pressed back)
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign-in.');
        // Don't show error, just remain on the page
        setLoading(false);
        return;
      } 
      
      // Handle when user closes the dialog without selecting an account
      if (err.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in already in progress.');
        setLoading(false);
        return;
      }
      
      // Only show errors for actual failures, not cancellations
      if (err.message?.includes('@siswa.um.edu.my')) {
        setError({ message: err.message });
      } else if (err.message?.includes('JSON')) {
        Alert.alert(
          'Server Error',
          'The backend did not return valid JSON. Please check your server connection or logs.',
          [{ text: 'OK' }]
        );
      } else if (err.message?.includes('ID token')) {
        // User likely cancelled during the Google sign-in process
        console.log('Sign-in was cancelled or incomplete.');
        // Don't show error, just remain on the page
      }
    } finally {
      setLoading(false);
    }
  };

  return { promptAsync: signIn, loading, error };
}