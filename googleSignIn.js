// import React, { useState, useEffect } from 'react';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
// import { auth } from './firebaseConfig';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// const API_URL = 'http://10.0.2.2:3000';

// GoogleSignin.configure({
//   webClientId: '868341431770-f06uasd307r3p5q2v4ree5lj1bpk1bc8.apps.googleusercontent.com',
//   offlineAccess: false,
//   forceCodeForRefreshToken: true,
//   scopes: ['profile', 'email']
// });

// export function useGoogleSignIn(onSuccess) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   /**
//    * Function to handle the full sign-in process:
//    * 1. Check Play Services (Android only)
//    * 2. Initiate native Google Sign-In
//    * 3. Exchange the ID token for a Firebase credential
//    */
//   const signIn = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await GoogleSignin.signOut();
//       // 1. Check for Play Services on Android
//       await GoogleSignin.hasPlayServices();

//       // 2. Initiate Native Google Sign-In
//       const userInfo = await GoogleSignin.signIn();
//       console.log('Full userInfo:', JSON.stringify(userInfo, null, 2));
//       const idToken = userInfo.idToken || userInfo.data?.idToken || userInfo.user?.idToken;
//       console.log('ID Token:', idToken);

//       if (!idToken) {
//         throw new Error('Google Sign-In failed to return an ID token.');
//       }

//       // 3. Exchange ID token for a Firebase credential
//       const googleCredential = GoogleAuthProvider.credential(idToken);
//       const userCredential = await signInWithCredential(auth, googleCredential);

//       console.log('Firebase sign in success:', userCredential.user);
//       onSuccess?.(); // Navigate on success

//     } catch (err) {
//       if (err.code === statusCodes.SIGN_IN_CANCELLED) {
//         console.log('User cancelled the sign-in flow.');
//       } else {
//         console.error('Sign-in error:', err);
//         setError(err);
//       } 
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { promptAsync: signIn, loading, error };
// }

import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.0.2.2:5000';

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
      if (!idToken) throw new Error('Google Sign-In failed to return an ID token.');

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
      navigation.navigate('Register', { 
      userInfo: {
        user: {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
        }
      }
    });

    } catch (err) {
      console.error('❌ Sign-in error:', err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled sign-in.');
        setError({ message: 'Sign-in cancelled.' });
      } else if (err.message?.includes('@siswa.um.edu.my')) {
        // Already handled above
        setError({ message: err.message });
      } else if (err.message?.includes('JSON')) {
        Alert.alert(
          'Server Error',
          'The backend did not return valid JSON. Please check your server connection or logs.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sign-in Error', err.message || 'Something went wrong. Please try again.');
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return { promptAsync: signIn, loading, error };
}
