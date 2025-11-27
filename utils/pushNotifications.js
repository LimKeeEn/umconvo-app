// utils/pushNotifications.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { auth } from "../firebaseConfig";

// Configure how notifications are handled when app is in foreground
// ONLY SET THIS ONCE - preferably here in the utility file
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Your EAS Project ID from app.json
const EAS_PROJECT_ID = "84debcc5-87cc-43de-9adc-85593eb31ea5";

export async function registerPushToken() {
  console.log("🔔 Starting push token registration...");
  
  try {
    // Log device info for debugging
    console.log("📱 Device.isDevice:", Device.isDevice);
    console.log("📱 Platform:", Platform.OS);
    
    // Set up Android notification channel (required for Android)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        showBadge: true,
      });
      console.log("✅ Android notification channel created");
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log("🔐 Current permission status:", existingStatus);

    if (existingStatus !== "granted") {
      console.log("🔐 Requesting notification permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Permission not granted for push notifications");
      alert("Please enable notifications in your device settings to receive updates.");
      return null;
    }

    console.log("✅ Notification permissions granted");

    // Get the Expo push token with your project ID
    console.log("🎫 Requesting Expo push token...");
    console.log("📋 Using Project ID:", EAS_PROJECT_ID);
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    const token = tokenData.data;
    console.log("✅ Expo Push Token received:", token);

    // Validate token format
    if (!token.startsWith("ExponentPushToken[")) {
      console.warn("⚠️ Token format seems incorrect:", token);
    }

    // Save token to Firestore
    const userId = auth.currentUser?.uid || `device_${Date.now()}`;
    const saved = await saveTokenToFirestore(token, userId);

    if (saved) {
      console.log("✅ Push notification setup complete");
      return token;
    } else {
      console.log("⚠️ Token received but not saved to Firestore");
      return token;
    }

  } catch (error) {
    console.error("❌ Error registering push token:", error);
    console.error("Error details:", error.message);
    
    // Check for common errors
    if (error.message.includes("projectId")) {
      console.error("💡 Hint: Make sure you've run 'eas build' at least once");
    }
    
    return null;
  }
}

async function saveTokenToFirestore(token, userId) {
  try {
    const projectID = "umconvo-app";
    const url = `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/deviceTokens/${userId}`;
    
    console.log("💾 Saving token to Firestore for user:", userId);
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          expoPushToken: { stringValue: token },
          userId: { stringValue: userId },
          platform: { stringValue: Platform.OS },
          deviceName: { stringValue: Device.deviceName || "Unknown" },
          osVersion: { stringValue: Device.osVersion || "Unknown" },
          createdAt: { integerValue: Date.now().toString() },
          updatedAt: { integerValue: Date.now().toString() },
        },
      }),
    });

    if (response.ok) {
      console.log("✅ Push token saved to Firestore");
      return true;
    } else {
      const error = await response.text();
      console.error("❌ Failed to save token to Firestore:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error saving token to Firestore:", error);
    return false;
  }
}

// Function to test local notifications (for debugging)
export async function sendTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 🔔",
        body: "This is a test notification from your app!",
        data: { type: "test" },
        sound: true,
      },
      trigger: { seconds: 2 },
    });
    console.log("📨 Test notification scheduled for 2 seconds from now");
    return true;
  } catch (error) {
    console.error("❌ Error scheduling test notification:", error);
    return false;
  }
}

// Function to handle notification permissions on app settings change
export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  console.log("🔐 Current notification permission status:", status);
  return status === "granted";
}