const express = require('express');

module.exports = function registerGetStudentDetailsRoute(db) {
    const router = express.Router();

    router.get('/get-student-details/:email', async (req, res) => {
        try {
            const { email } = req.params;
            const userDoc = await db.collection('students').doc(email).get();

            if (!userDoc.exists) {
                // If user not found, return an empty but successful structure
                return res.json({ success: true, data: { tasks: {} } });
            }

            const data = userDoc.data();
            res.json({ success: true, data: data }); // Return ALL document data
        } catch (error) {
            console.error('Error getting student details:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    return router;
};