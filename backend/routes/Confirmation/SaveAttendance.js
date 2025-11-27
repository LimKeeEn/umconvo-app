const express = require("express");

module.exports = function registerSaveAttendanceRoute(db, admin) {
    const router = express.Router();

    // Helper function to generate unique 6-digit confirmation codes
    function generateConfirmationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    router.post("/save-attendance-details", async (req, res) => {
        try {
            const { 
                email, 
                attendance, 
                reason, 
                attire, 
                size, 
                representative, 
                representativeDetails 
            } = req.body;

            // Basic validation check
            if (!email || !attendance) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Missing required fields: email or attendance status." 
                });
            }

            // 1. Prepare the base data to be saved/updated
            const updateData = {
                attendanceStatus: attendance, // 'attending' or 'not-attending'
                attireConfirmationCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // 2. Handle NOT ATTENDING scenario
            if (attendance === 'not-attending') {
                updateData.nonAttendanceReason = reason || 'Not specified';
                updateData.attireOption = 'N/A';
                
                // Clear any previously generated tickets
                updateData.attendanceConfirmationCode = null;
                updateData.gownConfirmationCode = null;
                updateData.attireSize = null;
                updateData.attireRepresentative = null;
                updateData.representativeDetails = null;
            }

            // 3. Handle ATTENDING scenario
            if (attendance === 'attending') {
                // ✅ GENERATE ATTENDANCE TICKET for all attending students
                const attendanceCode = generateConfirmationCode();
                updateData.attendanceConfirmationCode = attendanceCode;
                updateData.attireOption = attire; // 'collect' or 'purchase'

                console.log(`✅ Generated Attendance Ticket for ${email}: ${attendanceCode}`);

                // Handle COLLECT option
                if (attire === 'collect') {
                    // Validate size is provided
                    if (!size) {
                        return res.status(400).json({ 
                            success: false, 
                            message: "Attire size is required for collection option." 
                        });
                    }

                    // ✅ GENERATE GOWN COLLECTION TICKET
                    const gownCode = generateConfirmationCode();
                    updateData.gownConfirmationCode = gownCode;
                    updateData.attireSize = size;
                    updateData.attireRepresentative = representative || 'no';

                    console.log(`✅ Generated Gown Collection Ticket for ${email}: ${gownCode}`);

                    // Handle representative details
                    if (representative === 'yes') {
                        if (!representativeDetails || !representativeDetails.name || !representativeDetails.id) {
                            return res.status(400).json({ 
                                success: false, 
                                message: "Representative details (name and ID) are required." 
                            });
                        }
                        updateData.representativeDetails = representativeDetails;
                    } else {
                        updateData.representativeDetails = null;
                    }
                }

                // Handle PURCHASE option
                if (attire === 'purchase') {
                    // No gown collection ticket needed for purchase
                    updateData.gownConfirmationCode = null;
                    updateData.attireSize = size || null; // Optional for purchase
                    updateData.attireRepresentative = null;
                    updateData.representativeDetails = null;
                }

                // Clear non-attendance reason if previously set
                updateData.nonAttendanceReason = null;
            }
            
            // 4. Update the existing student document and mark the task as complete
            await db.collection("students").doc(email).update({
                ...updateData,
                'tasks.attire-confirmation': 'completed'
            });
            
            // 5. Prepare response data
            const responseData = {
                attendance: attendance,
                attendanceConfirmationCode: updateData.attendanceConfirmationCode,
                gownConfirmationCode: updateData.gownConfirmationCode,
                attireOption: updateData.attireOption,
                attireSize: updateData.attireSize,
            };

            // Log ticket generation summary
            console.log(`\n📋 Ticket Generation Summary for ${email}:`);
            console.log(`   Attendance: ${attendance}`);
            if (attendance === 'attending') {
                console.log(`   🎟️  Attendance Ticket: ${updateData.attendanceConfirmationCode}`);
                if (attire === 'collect') {
                    console.log(`   👔 Gown Collection Ticket: ${updateData.gownConfirmationCode}`);
                    console.log(`   📏 Size: ${size}`);
                    console.log(`   👥 Representative: ${representative}`);
                }
            } else {
                console.log(`   ❌ No tickets generated (not attending)`);
            }
            console.log('─────────────────────────────────\n');
            
            // 6. Send success response
            res.json({ 
                success: true, 
                message: "Attendance and attire details saved successfully.",
                data: responseData
            });

        } catch (error) {
            console.error("❌ Error saving attendance details:", error);
            
            // Respond with specific error code if document not found
            if (error.code === 5) { // Firestore code 5: NOT_FOUND
                res.status(404).json({ 
                    success: false, 
                    message: "Student document not found. Check if the email exists." 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: "Internal server error during data save.",
                    error: error.message 
                });
            }
        }
    });

    // ✅ NEW: Optional endpoint to refresh a specific ticket
    router.post("/refresh-ticket/:email/:ticketType", async (req, res) => {
        try {
            const { email, ticketType } = req.params; // ticketType: 'attendance' or 'gown'

            if (!email || !ticketType) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email and ticket type are required' 
                });
            }

            // Validate ticket type
            if (ticketType !== 'attendance' && ticketType !== 'gown') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid ticket type. Use "attendance" or "gown"' 
                });
            }

            // Check if student exists
            const studentDoc = await db.collection("students").doc(email).get();
            if (!studentDoc.exists) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Student not found' 
                });
            }

            const studentData = studentDoc.data();

            // Validate student is attending
            if (studentData.attendanceStatus !== 'attending') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot refresh ticket for non-attending student' 
                });
            }

            // Generate new confirmation code
            const newCode = generateConfirmationCode();
            const updateData = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (ticketType === 'attendance') {
                updateData.attendanceConfirmationCode = newCode;
                console.log(`🔄 Refreshed Attendance Ticket for ${email}: ${newCode}`);
            } else if (ticketType === 'gown') {
                // Check if student has gown collection ticket
                if (studentData.attireOption !== 'collect') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Student does not have a gown collection ticket' 
                    });
                }
                updateData.gownConfirmationCode = newCode;
                console.log(`🔄 Refreshed Gown Collection Ticket for ${email}: ${newCode}`);
            }

            // Update the document
            await db.collection("students").doc(email).update(updateData);

            res.json({ 
                success: true, 
                message: 'Ticket refreshed successfully',
                newConfirmationCode: newCode,
                ticketType: ticketType
            });

        } catch (error) {
            console.error('❌ Error refreshing ticket:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error while refreshing ticket',
                error: error.message 
            });
        }
    });

    return router;
};