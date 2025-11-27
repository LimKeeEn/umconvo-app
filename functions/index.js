// functions/index.js
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch");

initializeApp();

/**
 * 🔔 Send push notification when a new notification document is created
 * Triggers on: notifications/{notificationId} document creation
 */
exports.sendPushNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("❌ No data associated with the event");
      return null;
    }

    const notification = snapshot.data();
    const notificationId = event.params.notificationId;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📢 New notification created");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ID:", notificationId);
    console.log("Title:", notification.title);
    console.log("Body:", notification.body);
    console.log("Type:", notification.type || "custom");

    try {
      const db = getFirestore();
      
      // Get all registered device tokens
      const tokensSnapshot = await db.collection("deviceTokens").get();

      if (tokensSnapshot.empty) {
        console.log("⚠️ No device tokens found");
        return null;
      }

      // Filter and collect valid Expo push tokens
      const tokens = [];
      tokensSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.expoPushToken && data.expoPushToken.startsWith("ExponentPushToken")) {
          tokens.push({
            token: data.expoPushToken,
            userId: data.userId,
            platform: data.platform,
          });
        }
      });

      if (tokens.length === 0) {
        console.log("⚠️ No valid Expo push tokens found");
        return null;
      }

      console.log(`📨 Preparing to send to ${tokens.length} device(s)`);

      // Prepare messages for Expo Push Notification Service
      const messages = tokens.map((device) => ({
        to: device.token,
        sound: "default",
        title: notification.title || "New Notification",
        body: notification.body || "You have a new notification",
        data: {
          notificationId: notificationId,
          type: notification.type || "custom",
          category: notification.metadata?.category || "general",
          screen: "Notification", // Navigate to notification screen
        },
        badge: 1,
        priority: "high",
        channelId: "default",
      }));

      // Send to Expo's push notification service
      console.log("📤 Sending to Expo Push Notification Service...");
      
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      // Log results
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📊 Push Notification Results:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (result.data) {
        let successCount = 0;
        let errorCount = 0;

        result.data.forEach((item, index) => {
          if (item.status === "ok") {
            successCount++;
            console.log(`✅ Device ${index + 1} (${tokens[index].platform}): SUCCESS`);
          } else if (item.status === "error") {
            errorCount++;
            console.error(`❌ Device ${index + 1}: ${item.message}`);
            console.error(`   Details:`, item.details);
          }
        });

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`✅ Success: ${successCount}/${tokens.length}`);
        console.log(`❌ Failed: ${errorCount}/${tokens.length}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      } else {
        console.log("⚠️ Unexpected response format:", result);
      }

      return null;

    } catch (error) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ ERROR sending push notifications");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return null;
    }
  }
);

/**
 * 🧪 Test function to manually trigger a notification
 * Usage: Call this HTTP endpoint to send a test notification
 * Example: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/sendTestNotification
 */
exports.sendTestNotification = onRequest(async (req, res) => {
  console.log("🧪 Test notification endpoint called");
  
  try {
    const db = getFirestore();
    
    // Get all device tokens
    const tokensSnapshot = await db.collection("deviceTokens").get();

    if (tokensSnapshot.empty) {
      console.log("❌ No device tokens found");
      res.status(404).json({ 
        success: false, 
        message: "No device tokens found. Please register a device first." 
      });
      return;
    }

    const tokens = [];
    tokensSnapshot.forEach((doc) => {
      const token = doc.data().expoPushToken;
      if (token && token.startsWith("ExponentPushToken")) {
        tokens.push(token);
      }
    });

    if (tokens.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: "No valid Expo push tokens found" 
      });
      return;
    }

    console.log(`📨 Sending test notification to ${tokens.length} device(s)`);

    // Prepare test messages
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "🧪 Test Notification",
      body: "This is a test notification from Firebase Cloud Functions!",
      data: { 
        type: "test",
        timestamp: Date.now(),
      },
      badge: 1,
      priority: "high",
      channelId: "default",
    }));

    // Send notifications
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    
    console.log("✅ Test notification sent");
    console.log("Result:", JSON.stringify(result, null, 2));

    res.status(200).json({ 
      success: true, 
      devicesCount: tokens.length,
      result: result 
    });

  } catch (error) {
    console.error("❌ Error sending test notification:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 🗑️ Clean up old device tokens (optional maintenance function)
 * Remove tokens that haven't been updated in 90 days
 */
exports.cleanupOldTokens = onRequest(async (req, res) => {
  try {
    const db = getFirestore();
    const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    const snapshot = await db.collection("deviceTokens")
      .where("updatedAt", "<", cutoffDate)
      .get();
    
    if (snapshot.empty) {
      res.status(200).json({ 
        success: true, 
        message: "No old tokens to clean up" 
      });
      return;
    }

    const batch = db.batch();
    let deleteCount = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    await batch.commit();
    
    console.log(`🗑️ Cleaned up ${deleteCount} old device tokens`);
    res.status(200).json({ 
      success: true, 
      deletedCount: deleteCount 
    });

  } catch (error) {
    console.error("❌ Error cleaning up tokens:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});