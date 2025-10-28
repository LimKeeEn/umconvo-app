const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userVerifyRoutes = require("./routes/User/user-verify");
const userRegisterRoutes = require("./routes/User/user-register")(db, admin);
const userGetRoutes = require("./routes/User/user-get")(db);
const updateUserRoutes = require("./routes/User/user-update")(db,admin);


// Use routes
app.use("/api", userVerifyRoutes);
app.use("/api", userRegisterRoutes);
app.use("/api", userGetRoutes);
app.use("/api", updateUserRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
