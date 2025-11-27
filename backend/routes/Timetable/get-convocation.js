const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

// POST /api/get-convocation
router.post("/get-convocation", async (req, res) => {
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

    // 2. ✅ CRITICAL CORRECTION: Use a query to find the document based on the 'faculty' FIELD value.
    const convoSnapshot = await db.collection("convocationSchedule")
      .where("faculty", "==", faculty) // Search where the 'faculty' field equals 'science'
      .limit(1) // Only need one result
      .get();

    if (convoSnapshot.empty) {
      // It's possible the data inconsistency is still here, or no schedule exists.
      return res.status(404).json({
        success: false,
        message: `No convocation schedule found for faculty: ${faculty}. Please check data consistency.`,
      });
    }

    // Retrieve the data from the first document found in the snapshot
    const convocationData = convoSnapshot.docs[0].data();

    return res.status(200).json({
      success: true,
      faculty,
      convocation: convocationData,
    });

  } catch (error) {
    console.error("Convocation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;