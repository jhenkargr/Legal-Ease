// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ✅ Load environment variables first
dotenv.config();

// ✅ Import Routers
const chatRouter = require("./routes/chat.js");
const lawyerRouter = require("./routes/lawyer.js");
const simplifierRouter = require("./routes/simplifier.js");
const translatorRouter = require("./routes/translator.js");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ✅ API Routes
app.use("/chat", chatRouter);
app.use("/lawyer", lawyerRouter);
app.use("/simplifier", simplifierRouter);
app.use("/translator", translatorRouter);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🧠 Legal AI Backend Server is running smoothly!");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message
  });
});

// ✅ Start Server binding to 0.0.0.0 for Render compatibility
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
