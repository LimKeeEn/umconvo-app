import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn(onSuccess) {
  const redirectUri = makeRedirectUri({
    useProxy: true,
    native: 'umconvoapp://redirect'
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '868341431770-f06uasd307r3p5q2v4ree5lj1bpk1bc8.apps.googleusercontent.com',
    iosClientId: '378967716917-8cvh67gtcel268vl0k5cup07ld2nikbm.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log('Firebase sign in success:', userCredential.user);
          onSuccess?.(); // Navigate on success
        })
        .catch((err) => {
          console.error('Firebase sign in error:', err);
          setError(err);
        })
        .finally(() => setLoading(false));
    }
  }, [response]);

  return { promptAsync, loading, error };
}