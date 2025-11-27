const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

router.post("/get-attire", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID token is required" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      return res.status(400).json({ success: false, message: "User email not found" });
    }

    const db = admin.firestore();

    // 1. Get student profile
    const studentRef = db.collection("students").doc(email);
    const studentDoc = await studentRef.get();

    if (!studentDoc.exists) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const faculty = studentDoc.data().faculty; // e.g., 'science'

    if (!faculty) {
      return res.status(400).json({ success: false, message: "Faculty not found in user profile" });
    }

    // 2. Query the attireSchedule collection by the standardized 'faculty' key
    const attireSnapshot = await db.collection("attireSchedule")
      .where("faculty", "==", faculty) // Search where the 'faculty' field equals the student's faculty ID
      .limit(1)
      .get();

    if (attireSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: `No attire schedule found for faculty: ${faculty}`,
      });
    }

    // Retrieve the data from the first document found in the snapshot
    const attireData = attireSnapshot.docs[0].data();

    return res.status(200).json({
      success: true,
      faculty,
      attireSchedule: attireData,
    });

  } catch (error) {
    console.error("Attire Schedule Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;