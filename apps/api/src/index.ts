import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/index.js";
import { connectDatabase } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import {
  issueRoutes,
  municipalityRoutes,
  leaderboardRoutes,
  maintainerRoutes,
  metaRoutes,
} from "./routes/index.js";
import { startScoringJobs } from "./services/scoringService.js";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Rate limiting
app.use("/api", apiLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use("/api/issues", issueRoutes);
app.use("/api/municipality", municipalityRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/maintainer", maintainerRoutes);
app.use("/api", metaRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start scheduled jobs
    startScoringJobs();

    // Start listening
    app.listen(config.port, () => {
      console.log(`
🚀 CivicSense API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:      http://localhost:${config.port}
🌍 Environment: ${config.nodeEnv}
📊 Health:      http://localhost:${config.port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
