const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/tracer-proofs/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tracer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = function registerUserRoutes(db, admin) {
  const router = express.Router();

  // ✅ Upload Tracer Proof API with Enhanced Error Handling
  router.post('/upload-tracer-proof', (req, res) => {
    upload.single('file')(req, res, async function (err) {
      // Handle Multer errors first
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false, 
            message: 'File size exceeds 5MB limit' 
          });
        }
        return res.status(400).json({ 
          success: false, 
          message: `Upload error: ${err.message}` 
        });
      } else if (err) {
        console.error('❌ Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'File upload failed' 
        });
      }

      try {
        const { email, taskId } = req.body;
        const file = req.file;

        console.log('📥 Upload request received');
        console.log('📧 Email:', email);
        console.log('📋 Task ID:', taskId);
        console.log('📄 File:', file ? file.originalname : 'No file');

        // Validate email
        if (!email) {
          // Clean up uploaded file if exists
          if (file && file.path) {
            fs.unlink(file.path, (unlinkErr) => {
              if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
          }
          return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
          });
        }

        // Validate file
        if (!file) {
          return res.status(400).json({ 
            success: false, 
            message: 'No file uploaded' 
          });
        }

        // Verify file is actually a PDF
        if (file.mimetype !== 'application/pdf') {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
          return res.status(400).json({ 
            success: false, 
            message: 'Only PDF files are allowed' 
          });
        }

        console.log('🔍 Looking up user in Firestore...');

        // Store file information in Firestore
        const userRef = db.collection('students').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          console.error('❌ User not found:', email);
          // Clean up uploaded file
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }

        console.log('✅ User found, updating document...');

        // Update user document with tracer proof information
        await userRef.update({
          tracerProof: {
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            uploadDate: admin.firestore.FieldValue.serverTimestamp(),
            mimeType: file.mimetype
          },
          'tasks.graduate-tracer': 'completed'
        });

        console.log('✅ Tracer proof uploaded successfully');

        res.json({ 
          success: true, 
          message: 'Tracer proof uploaded successfully',
          fileName: file.originalname
        });

      } catch (error) {
        console.error('❌ Error uploading tracer proof:', error);
        console.error('Error stack:', error.stack);
        
        // If there's an error, try to delete the uploaded file
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
        }

        res.status(500).json({ 
          success: false, 
          message: 'Server error while uploading file',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  });

  // ✅ Get Tracer Proof Info API (Optional - to retrieve uploaded file info)
  router.get('/get-tracer-proof/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      console.log('🔍 Fetching tracer proof for:', email);
      
      const userDoc = await db.collection('students').doc(email).get();

      if (!userDoc.exists) {
        console.error('❌ User not found:', email);
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const data = userDoc.data();
      
      if (!data.tracerProof) {
        console.log('ℹ️ No tracer proof uploaded yet');
        return res.json({ 
          success: true, 
          hasProof: false,
          message: 'No tracer proof uploaded yet' 
        });
      }

      console.log('✅ Tracer proof found');

      res.json({ 
        success: true, 
        hasProof: true,
        tracerProof: {
          fileName: data.tracerProof.fileName,
          uploadDate: data.tracerProof.uploadDate,
          fileSize: data.tracerProof.fileSize
        }
      });

    } catch (error) {
      console.error('❌ Error getting tracer proof:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ✅ Delete Tracer Proof API (Optional - allows users to re-upload)
  router.delete('/delete-tracer-proof/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      console.log('🗑️ Deleting tracer proof for:', email);
      
      const userRef = db.collection('students').doc(email);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const data = userDoc.data();
      
      if (data.tracerProof && data.tracerProof.filePath) {
        // Delete the physical file
        fs.unlink(data.tracerProof.filePath, (err) => {
          if (err) {
            console.error('⚠️ Error deleting physical file:', err);
          } else {
            console.log('✅ Physical file deleted');
          }
        });
      }

      // Remove from Firestore
      await userRef.update({
        tracerProof: admin.firestore.FieldValue.delete(),
        'tasks.graduate-tracer': 'pending'
      });

      console.log('✅ Tracer proof deleted from database');

      res.json({ 
        success: true, 
        message: 'Tracer proof deleted successfully' 
      });

    } catch (error) {
      console.error('❌ Error deleting tracer proof:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  return router;
};