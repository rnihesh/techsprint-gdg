import mongoose, { Schema, Document } from "mongoose";

export interface IMunicipalityUser extends Document {
  _id: mongoose.Types.ObjectId;
  municipalityId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  designation: string;
  role: "admin" | "officer" | "viewer";
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MunicipalityUserSchema = new Schema<IMunicipalityUser>(
  {
    municipalityId: {
      type: Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
      index: true,
    },
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
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "officer", "viewer"],
      default: "officer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for municipality-based queries
MunicipalityUserSchema.index({ municipalityId: 1, isActive: 1 });

export const MunicipalityUser = mongoose.model<IMunicipalityUser>(
  "MunicipalityUser",
  MunicipalityUserSchema
);
