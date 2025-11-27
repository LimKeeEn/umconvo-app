const express = require('express');

module.exports = function registerUserRoutes(db, admin) {
  const router = express.Router();

  // ✅ Get Task Status API
  router.get('/get-tasks/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const userDoc = await db.collection('students').doc(email).get();

      if (!userDoc.exists) {
        return res.json({ success: true, tasks: {} });
      }

      const data = userDoc.data();
      res.json({ success: true, tasks: data.tasks || {} });
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  return router;
};
