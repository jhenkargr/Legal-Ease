// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Optional for Node 18+, can remove if global fetch is available
import path from "path";
import { fileURLToPath } from "url";

// ✅ Needed for ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Import Routers
import chatRouter from "./routes/chat.js";
import lawyerRouter from "./routes/lawyer.js";
import simplifierRouter from "./routes/simplifier.js";
import translatorRouter from "./routes/translator.js";

// ✅ Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*", // Set your frontend URL in .env for security
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

// ✅ Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
