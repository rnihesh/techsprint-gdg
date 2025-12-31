import mongoose, { Schema, Document } from "mongoose";

// For platform maintainers who handle manual reviews
export interface IPlatformMaintainer extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformMaintainerSchema = new Schema<IPlatformMaintainer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformMaintainer = mongoose.model<IPlatformMaintainer>(
  "PlatformMaintainer",
  PlatformMaintainerSchema
);
