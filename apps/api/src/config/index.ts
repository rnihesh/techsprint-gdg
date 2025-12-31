import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export const config = {
  // Server
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/civicsense",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "default-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",

  // Google Cloud Vision
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
  googleApplicationCredentials:
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "",

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  // Frontend URL (for CORS)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Scoring configuration
  scoring: {
    baseScore: 10000,
    verifiedResolutionPoints: 10,
    penaltyMonth1: 200,
    penaltyMonth2: 300,
    penaltyMonth3Plus: 500,
  },

  // ML thresholds
  ml: {
    classificationConfidenceThreshold: 0.6,
    verificationConfidenceThreshold: 0.75,
  },
};

// Validate required config in production
if (config.nodeEnv === "production") {
  const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "GOOGLE_MAPS_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
