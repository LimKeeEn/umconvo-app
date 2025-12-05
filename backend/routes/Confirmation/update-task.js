const express = require('express');

module.exports = function registerUserRoutes(db, admin) {
  const router = express.Router();

  // ✅ Update Task API
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
            ...currentTasks,
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

  // ✅ Save Attendance Details API
  router.post('/save-attendance-details', async (req, res) => {
    try {
      const { email, attendance, reason, attireOption, attireSize, collectionRepresentative } = req.body;

      if (!email || !attendance) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const userRef = db.collection('students').doc(email);
      
      const userDoc = await userRef.get();
      const existingData = userDoc.exists ? userDoc.data() : {};
      const existingTasks = existingData.tasks || {};

      const updateData = {
        attendanceStatus: attendance,
        tasks: {
          ...existingTasks,
          'attire-confirmation': 'completed'
        }
      };

      if (attendance === 'not-attending' && reason) {
        updateData.nonAttendanceReason = reason;
        updateData.attireOption = null;
        updateData.attireSize = null;
        updateData.collectionRepresentative = null;
        updateData.returnAttireStatus = null; // Not applicable for non-attending students
      } else if (attendance === 'attending') {
        updateData.attireOption = attireOption || null;
        updateData.attireSize = attireSize || null;
        updateData.nonAttendanceReason = null;
        
        // ✅ Handle collection representative for 'collect' option
        if (attireOption === 'collect') {
          updateData.collectionRepresentative = collectionRepresentative || null; // 'yes' or 'no'
          updateData.returnAttireStatus = 'not-returned'; // Initialize for students collecting attire
        } else {
          updateData.collectionRepresentative = null; // Not applicable for purchasing students
          updateData.returnAttireStatus = null; // Not applicable for purchasing students
        }
      }

      await userRef.set(updateData, { merge: true });

      res.json({ success: true, message: 'Attendance details saved successfully' });
    } catch (error) {
      console.error('Error saving attendance details:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // ✅ NEW: Update Rehearsal Attendance Status
  router.post('/update-rehearsal-status', async (req, res) => {
    try {
      const { email, rehearsalAttendanceStatus } = req.body;

      if (!email || !rehearsalAttendanceStatus) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Validate status values
      if (!['attend', 'not-attend'].includes(rehearsalAttendanceStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid rehearsal status. Must be "attend" or "not-attend"' 
        });
      }

      const userRef = db.collection('students').doc(email);
      
      await userRef.set(
        {
          rehearsalAttendanceStatus: rehearsalAttendanceStatus,
        },
        { merge: true }
      );

      res.json({ 
        success: true, 
        message: 'Rehearsal attendance status updated successfully',
        rehearsalAttendanceStatus 
      });
    } catch (error) {
      console.error('Error updating rehearsal status:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // ✅ NEW: Update Return Attire Status
  router.post('/update-return-attire-status', async (req, res) => {
    try {
      const { email, returnAttireStatus } = req.body;

      if (!email || !returnAttireStatus) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Validate status values
      if (!['not-returned', 'returned'].includes(returnAttireStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid return status. Must be "not-returned" or "returned"' 
        });
      }

      const userRef = db.collection('students').doc(email);
      
      await userRef.set(
        {
          returnAttireStatus: returnAttireStatus,
        },
        { merge: true }
      );

      res.json({ 
        success: true, 
        message: 'Return attire status updated successfully',
        returnAttireStatus 
      });
    } catch (error) {
      console.error('Error updating return attire status:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // ✅ Get Student Details API
  router.get('/get-student-details/:email', async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const userRef = db.collection('students').doc(email);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const data = userDoc.data();

      res.json({ 
        success: true, 
        data: {
          ...data,
          // Ensure default values for new fields
          rehearsalAttendanceStatus: data.rehearsalAttendanceStatus || null,
          returnAttireStatus: data.returnAttireStatus !== undefined ? data.returnAttireStatus : null,
          collectionRepresentative: data.collectionRepresentative || null,
        }
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  return router;
};