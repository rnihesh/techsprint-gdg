import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import { AppError } from "./errorHandler.js";

// Store files in memory for Cloudinary upload
const storage = multer.memoryStorage();

// File filter for images only
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed", 400) as any);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
});

// For multiple files (if needed)
export const uploadMultiple = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});
