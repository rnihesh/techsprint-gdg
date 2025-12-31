import mongoose, { Schema, Document } from "mongoose";

export interface IMunicipality extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: "corporation" | "municipality" | "town_panchayat" | "gram_panchayat";
  state: string;
  district: string;
  // Geospatial boundary (polygon)
  boundary: {
    type: "Polygon";
    coordinates: number[][][];
  };
  // Center point for quick reference
  center: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Scoring
  score: number;
  totalIssuesReceived: number;
  totalIssuesResolved: number;
  // Contact info
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const MunicipalitySchema = new Schema<IMunicipality>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["corporation", "municipality", "town_panchayat", "gram_panchayat"],
      required: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    center: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    score: {
      type: Number,
      default: 10000,
      min: 0,
    },
    totalIssuesReceived: {
      type: Number,
      default: 0,
    },
    totalIssuesResolved: {
      type: Number,
      default: 0,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial indexes
MunicipalitySchema.index({ boundary: "2dsphere" });
MunicipalitySchema.index({ center: "2dsphere" });

// Compound indexes for queries
MunicipalitySchema.index({ state: 1, district: 1 });
MunicipalitySchema.index({ score: -1 });

export const Municipality = mongoose.model<IMunicipality>(
  "Municipality",
  MunicipalitySchema
);
