import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { issueRoutes } from "./routes/issues";
import { municipalityRoutes } from "./routes/municipalities";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { healthRoutes } from "./routes/health";
import { uploadRoutes } from "./routes/upload";
import { classifyRoutes } from "./routes/classify";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import type { Express } from "express";

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required when behind reverse proxy (nginx) to get real client IP
app.set("trust proxy", true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/municipalities", municipalityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/classify", classifyRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
