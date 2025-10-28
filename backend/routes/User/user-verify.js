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
      return res.status(400).json({
        success: false,
        message: "ID token is required",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    console.log("User email:", email);

    // Check domain
    if (!isValidSiswaEmail(email)) {
      await admin.auth().deleteUser(uid);
      return res.status(403).json({
        success: false,
        message: "Only @siswa.um.edu.my email addresses are allowed",
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        uid,
        email,
        emailVerified: decodedToken.email_verified,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please sign in again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
