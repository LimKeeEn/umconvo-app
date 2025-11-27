import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from "expo-notifications";
import { auth } from './firebaseConfig';

import GetStarted from './Screen/getStarted';
import BottomNav from './NavigationBar/BottomNav';
import GuestBottomNav from './Screen/GuestPage/GuestBottomNavigation';
import Profile from './Screen/Profile/Profile';
import EditProfile from './Screen/Profile/EditProfile';
import TicketDetails from './Screen/Profile/TicketDetails';
import Settings from './Screen/Profile/Settings';
import Register from './Screen/Register';
import AttendanceConfirm from './Screen/Confirmation/AttendanceConfirm';
import NonAttendance from './Screen/Confirmation/NonAttendance';
import Confirmation from './Screen/Confirmation/Confirmation';
import YesAttendance from './Screen/Confirmation/YesAttendance';
import FAQ from './Screen/HelpSupport/FAQ';
import AboutUs from './Screen/HelpSupport/AboutUs';
import Background from './Screen/HelpSupport/Background';
import KeyPeople from './Screen/HelpSupport/KeyPeople';
import CampusMap from './Screen/HelpSupport/CampusMap';
import ContactUs from './Screen/HelpSupport/ContactUs';
import Notification from './Screen/Notification';

import { registerPushToken } from "./utils/pushNotifications";

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationSetupDone, setNotificationSetupDone] = useState(false);

  // ----------------------------
  // AUTHENTICATION LISTENER
  // ----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("🔐 Auth state changed:", currentUser ? "Logged in" : "Logged out");
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -------------------------------------------------
  // REGISTER PUSH TOKEN & SETUP NOTIFICATION LISTENERS
  // -------------------------------------------------
  useEffect(() => {
    if (notificationSetupDone) return;

    console.log("🚀 Setting up push notifications...");
    
    // Register for push notifications
    registerPushToken()
      .then((token) => {
        if (token) {
          console.log("✅ Push notification setup complete");
          setNotificationSetupDone(true);
        } else {
          console.log("⚠️ Failed to setup push notifications");
        }
      })
      .catch((error) => {
        console.error("❌ Push notification setup error:", error);
      });

    // Listen for notifications received while app is open
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received:", notification.request.content.title);
        
        // Optional: Show an in-app alert or update UI
        // You can also update a badge count here
      }
    );

    // Listen for when user taps on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👉 Notification tapped:", response.notification.request.content.title);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.screen === "Notification") {
          // The user will be navigated to the Notification screen
          console.log("Navigate to Notification screen");
        }
        
        // You can add more navigation logic based on data.type or data.category
        if (data?.type === "news_added") {
          console.log("Navigate to news:", data.category);
        }
      }
    );

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, [notificationSetupDone]);

  // ----------------------------
  // SHOW LOADING SCREEN
  // ----------------------------
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF' 
      }}>
        <ActivityIndicator size="large" color="#13274f" />
      </View>
    );
  }

  // ----------------------------
  // MAIN APP NAVIGATION
  // ----------------------------
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={user ? "MainApp" : "GetStarted"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {/* Auth Screen */}
        <Stack.Screen 
          name="GetStarted" 
          component={GetStarted} 
        />

        {/* Main App */}
        <Stack.Screen 
          name="MainApp" 
          component={BottomNav} 
        />

        <Stack.Screen 
          name="GuestMainApp" 
          component={GuestBottomNav} 
        />

        {/* Profile Screens */}
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="TicketDetails" component={TicketDetails} />
        <Stack.Screen name="Settings" component={Settings} />

        {/* Registration */}
        <Stack.Screen name="Register" component={Register} />

        {/* Attendance Confirmation */}
        <Stack.Screen name="AttendanceConfirm" component={AttendanceConfirm} />
        <Stack.Screen name="NonAttendance" component={NonAttendance} />
        <Stack.Screen name="Confirmation" component={Confirmation} />
        <Stack.Screen name="YesAttendance" component={YesAttendance} />

        {/* Help & Support */}
        <Stack.Screen name="FAQ" component={FAQ} />
        <Stack.Screen name="AboutUs" component={AboutUs} />
        <Stack.Screen name="Background" component={Background} />
        <Stack.Screen name="KeyPeople" component={KeyPeople} />
        <Stack.Screen name="CampusMap" component={CampusMap} />
        <Stack.Screen name="ContactUs" component={ContactUs} />

        {/* Guest Interface */}

        {/* Notifications */}
        <Stack.Screen name="Notification" component={Notification} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}