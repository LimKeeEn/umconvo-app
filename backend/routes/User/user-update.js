const express = require("express");

module.exports = function updateUserRoutes(db, admin) {
  const router = express.Router();

  router.put("/update-user/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const updatedData = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: "Missing email parameter" });
      }

      const userRef = db.collection("students").doc(email);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Update Firestore document
      await userRef.update({
        ...updatedData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true, message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
