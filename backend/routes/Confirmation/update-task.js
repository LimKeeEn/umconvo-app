const express = require('express');

module.exports = function registerUserRoutes(db, admin) {
  const router = express.Router();

  // ✅ Update Task API (already fixed in my previous response)
  router.post('/update-task', async (req, res) => {
    try {
      const { email, taskId, status } = req.body;

      if (!email || !taskId || !status) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const userRef = db.collection('students').doc(email);
      
      // Get existing tasks first
      const userDoc = await userRef.get();
      const currentTasks = userDoc.exists ? (userDoc.data().tasks || {}) : {};

      await userRef.set(
        {
          tasks: {
            ...currentTasks, // ✅ Preserve existing tasks
            [taskId]: status,
          },
        },
        { merge: true } 
      );

      res.json({ success: true, message: 'Task updated successfully' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // ✅ Save Attendance Details API (NEW)
  router.post('/save-attendance-details', async (req, res) => {
    try {
      const { email, attendance, reason, attireOption, attireSize } = req.body;

      if (!email || !attendance) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const userRef = db.collection('students').doc(email);
      
      // ✅ Get existing document to preserve tasks
      const userDoc = await userRef.get();
      const existingData = userDoc.exists ? userDoc.data() : {};
      const existingTasks = existingData.tasks || {};

      const updateData = {
        attendanceStatus: attendance,
        tasks: {
          ...existingTasks, // ✅ Preserve all existing task statuses
          'attire-confirmation': 'completed'
        }
      };

      if (attendance === 'not-attending' && reason) {
        updateData.nonAttendanceReason = reason;
        updateData.attireOption = null;
        updateData.attireSize = null;
      } else if (attendance === 'attending') {
        updateData.attireOption = attireOption || null;
        updateData.attireSize = attireSize || null;
        updateData.nonAttendanceReason = null;
      }

      await userRef.set(updateData, { merge: true });

      res.json({ success: true, message: 'Attendance details saved successfully' });
    } catch (error) {
      console.error('Error saving attendance details:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  return router;
};