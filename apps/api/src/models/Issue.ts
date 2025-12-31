import mongoose, { Schema, Document } from "mongoose";

// Issue types that ML can classify
export const ISSUE_TYPES = [
  "pothole",
  "garbage",
  "drainage",
  "streetlight",
  "road_damage",
  "water_supply",
  "sewage",
  "encroachment",
  "illegal_dumping",
  "broken_footpath",
  "traffic_signal",
  "public_toilet",
  "stray_animals",
  "noise_pollution",
  "air_pollution",
  "other",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export type IssueStatus =
  | "OPEN"
  | "RESPONDED"
  | "VERIFIED"
  | "DISPUTED"
  | "NEEDS_MANUAL_REVIEW";

export interface IIssue extends Document {
  _id: mongoose.Types.ObjectId;
  // Location
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: {
    formatted: string;
    district: string;
    state: string;
    pincode?: string;
    ward?: string;
  };
  // Municipality linkage
  municipalityId: mongoose.Types.ObjectId;
  // Issue details
  issueType: IssueType;
  issueTypeConfidence: number; // ML confidence 0-1
  description: string;
  // Image
  imageUrl: string;
  imagePublicId: string; // Cloudinary public ID
  // Status tracking
  status: IssueStatus;
  // ML classification metadata
  mlClassification: {
    predictedType: IssueType;
    confidence: number;
    allPredictions: Array<{ type: IssueType; confidence: number }>;
    modelVersion: string;
    classifiedAt: Date;
  };
  // Anonymous submission tracking (hashed IP for spam prevention, not stored)
  submissionHash?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: "Invalid coordinates",
        },
      },
    },
    address: {
      formatted: { type: String, required: true },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      pincode: { type: String },
      ward: { type: String },
    },
    municipalityId: {
      type: Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
      index: true,
    },
    issueType: {
      type: String,
      enum: ISSUE_TYPES,
      required: true,
      index: true,
    },
    issueTypeConfidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "RESPONDED",
        "VERIFIED",
        "DISPUTED",
        "NEEDS_MANUAL_REVIEW",
      ],
      default: "OPEN",
      index: true,
    },
    mlClassification: {
      predictedType: {
        type: String,
        enum: ISSUE_TYPES,
        required: true,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      allPredictions: [
        {
          type: {
            type: String,
            enum: ISSUE_TYPES,
          },
          confidence: Number,
        },
      ],
      modelVersion: {
        type: String,
        required: true,
      },
      classifiedAt: {
        type: Date,
        required: true,
      },
    },
    submissionHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
IssueSchema.index({ location: "2dsphere" });

// Compound indexes for common queries
IssueSchema.index({ municipalityId: 1, status: 1, createdAt: -1 });
IssueSchema.index({ status: 1, createdAt: -1 });
IssueSchema.index({ issueType: 1, status: 1 });
IssueSchema.index({ createdAt: -1 });

// Text index for search
IssueSchema.index({ description: "text", "address.formatted": "text" });

export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);
