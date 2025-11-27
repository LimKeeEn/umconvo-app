// routes/user-verify.js
const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Email validation helper
const isValidSiswaEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@siswa\.um\.edu\.my$/;
  return emailRegex.test(email);
};

// POST /api/verify-user
router.post("/verify-user", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    if (!isValidSiswaEmail(email)) {
      await admin.auth().deleteUser(uid);
      return res.status(403).json({
        success: false,
        message: "Only @siswa.um.edu.my email addresses are allowed",
      });
    }

    // Check if user exists in Firestore
    const db = admin.firestore();
    const userDoc = await db.collection("students").doc(email).get();
    const isRegistered = userDoc.exists;

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      isRegistered, // New field
      user: {
        uid,
        email,
        emailVerified: decodedToken.email_verified,
        ...(isRegistered && { userData: userDoc.data() }) // Include user data if registered
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
