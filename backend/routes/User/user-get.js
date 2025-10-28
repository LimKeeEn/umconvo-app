const express = require("express");

module.exports = function getUserRoutes(db) {
  const router = express.Router();

  // GET user data by email
  router.get("/get-user/:email", async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ success: false, message: "Missing email" });
      }

      const docRef = db.collection("students").doc(email);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({ success: true, user: doc.data() });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  return router;
};
