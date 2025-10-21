// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';
// import React from 'react';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
// import { auth } from './firebaseConfig';
// import { makeRedirectUri } from 'expo-auth-session';

// WebBrowser.maybeCompleteAuthSession();

// export function useGoogleSignIn(onSuccess) {
//   const redirectUri = makeRedirectUri({
//     useProxy: true,
//   });

//   const [request, response, promptAsync] = Google.useAuthRequest({
//     webClientId: '868341431770-f06uasd307r3p5q2v4ree5lj1bpk1bc8.apps.googleusercontent.com',
//     iosClientId: '868341431770-8v1t0r0i1kde0vu991jt0f1d53t2gm97.apps.googleusercontent.com',
//     androidClientId: '868341431770-pk954cct62n716pf3nsbdlinlq4dcfhc.apps.googleusercontent.com',
//     scopes: ['profile', 'email'],
//     redirectUri
//   });

//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState(null);

//   React.useEffect(() => {
//     if (response?.type === 'success') {
//       const { id_token } = response.authentication;
//       const credential = GoogleAuthProvider.credential(id_token);

//       setLoading(true);
//       signInWithCredential(auth, credential)
//         .then((userCredential) => {
//           console.log('Firebase sign in success:', userCredential.user);
//           onSuccess?.(); // Navigate on success
//         })
//         .catch((err) => {
//           console.error('Firebase sign in error:', err);
//           setError(err);
//         })
//         .finally(() => setLoading(false));
//     }
//   }, [response]);

//   return { promptAsync, loading, error };
// }

import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
// Import the native Google Sign-In library
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// NOTE: WebBrowser.maybeCompleteAuthSession() and makeRedirectUri are no longer needed
// for the native flow, but you need your Web Client ID for configuration.

// --- Configuration (Outside the Hook) ---
// Use the Web Client ID for configuration, as Firebase needs it for token verification.
// The Android and iOS client IDs are handled by the native SDK/config files.
GoogleSignin.configure({
  webClientId: '868341431770-f06uasd307r3p5q2v4ree5lj1bpk1bc8.apps.googleusercontent.com',
  // You can also include other options here, like offlineAccess or scopes, if needed.
  // scopes: ['profile', 'email'], 
});
// ----------------------------------------

export function useGoogleSignIn(onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Function to handle the full sign-in process:
   * 1. Check Play Services (Android only)
   * 2. Initiate native Google Sign-In
   * 3. Exchange the ID token for a Firebase credential
   */
  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check for Play Services on Android
      await GoogleSignin.hasPlayServices();

      // 2. Initiate Native Google Sign-In
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo;

      if (!idToken) {
        throw new Error('Google Sign-In failed to return an ID token.');
      }

      // 3. Exchange ID token for a Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      console.log('Firebase sign in success:', userCredential.user);
      onSuccess?.(); // Navigate on success

    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in flow.');
      } else {
        console.error('Sign-in error:', err);
        setError(err);
      } A
    } finally {
      setLoading(false);
    }
  };

  return { promptAsync: signIn, loading, error };
}