import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./server/db";

// Routes
import authRoutes from "./server/routes/authRoutes";
import userRoutes from "./server/routes/userRoutes";
import donationRoutes from "./server/routes/donationRoutes";
import safetyRoutes from "./server/routes/safetyRoutes";
import rescueRoutes from "./server/routes/rescueRoutes";
import verificationRoutes from "./server/routes/verificationRoutes";
import complaintRoutes from "./server/routes/complaintRoutes";
import emergencyRoutes from "./server/routes/emergencyRoutes";
import notificationRoutes from "./server/routes/notificationRoutes";
import auditRoutes from "./server/routes/auditRoutes";
import analyticsRoutes from "./server/routes/analyticsRoutes";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Connect to Database & Seed Admin
connectDB().catch((err) => {
  console.error("Database connection initialization warning:", err.message);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SafeServe – Smart Food Rescue & Safety Management Platform",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/rescues", rescueRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Production & Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(` SafeServe Server is active on http://0.0.0.0:${PORT}`);
    console.log(` Platform: Smart Food Rescue & Safety Management`);
    console.log(` Default Admin: admin@safeserve.org / AdminSafeServe2026!`);
    console.log(`=======================================================`);
  });
}

startServer();
