const express = require("express");

module.exports = function registerUserRoutes(db, admin) {
  const router = express.Router();

  router.post("/register-user", async (req, res) => {
    try {
      const { email, username, matricNo, phoneNo, educationLevel, faculty, programme, graduationSession } = req.body;

      if (!email || !username) {
        return res.status(400).json({ success: false, message: "Missing email or username" });
      }

      await db.collection("students").doc(email).set({
        username,
        email,
        matricNo,
        phoneNo,
        educationLevel,
        faculty,
        programme,
        graduationSession,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: "User registered successfully" });
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
