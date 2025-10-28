import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

import GetStarted from './Screen/getStarted';
import BottomNav from './NavigationBar/BottomNav';
import Profile from './Screen/Profile/Profile';
import EditProfile from './Screen/Profile/EditProfile';
import TicketDetails from './Screen/Profile/TicketDetails';
import Settings from './Screen/Profile/Settings';
import Register from './Screen/Register';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "MainApp" : "GetStarted"}>
        {/* Get Started Page */}
        <Stack.Screen
          name="GetStarted"
          component={GetStarted}
          options={{ headerShown: false }}
        />
        
        {/* Main App Screens (Bottom Navigation) */}
        <Stack.Screen
          name="MainApp"
          component={BottomNav}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Profile"
          component={Profile}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="EditProfile"
          component={EditProfile}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="TicketDetails"
          component={TicketDetails}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Settings"
          component={Settings}
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Register"
          component={Register}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}