import mongoose, { Schema, Document } from "mongoose";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_MANUAL_REVIEW";

export interface IResponse extends Document {
  _id: mongoose.Types.ObjectId;
  issueId: mongoose.Types.ObjectId;
  municipalityId: mongoose.Types.ObjectId;
  respondedBy: mongoose.Types.ObjectId; // MunicipalityUser ID
  // Resolution details
  resolutionNote: string;
  resolutionImageUrl: string;
  resolutionImagePublicId: string;
  // ML verification
  verificationStatus: VerificationStatus;
  mlVerification: {
    similarityScore: number; // 0-1 (lower = more different = likely resolved)
    resolutionConfidence: number; // 0-1 confidence that issue is resolved
    beforeImageAnalysis: {
      labels: string[];
      issues: string[];
    };
    afterImageAnalysis: {
      labels: string[];
      improvements: string[];
    };
    modelVersion: string;
    verifiedAt: Date;
  };
  // Manual review (if needed)
  manualReview?: {
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    decision: "APPROVED" | "REJECTED";
    notes: string;
  };
  // Points awarded
  pointsAwarded: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    issueId: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },
    municipalityId: {
      type: Schema.Types.ObjectId,
      ref: "Municipality",
      required: true,
      index: true,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "MunicipalityUser",
      required: true,
    },
    resolutionNote: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    resolutionImageUrl: {
      type: String,
      required: true,
    },
    resolutionImagePublicId: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED", "NEEDS_MANUAL_REVIEW"],
      default: "PENDING",
      index: true,
    },
    mlVerification: {
      similarityScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      resolutionConfidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      beforeImageAnalysis: {
        labels: [String],
        issues: [String],
      },
      afterImageAnalysis: {
        labels: [String],
        improvements: [String],
      },
      modelVersion: String,
      verifiedAt: Date,
    },
    manualReview: {
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "MunicipalityUser",
      },
      reviewedAt: Date,
      decision: {
        type: String,
        enum: ["APPROVED", "REJECTED"],
      },
      notes: String,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ResponseSchema.index({ issueId: 1, createdAt: -1 });
ResponseSchema.index({ municipalityId: 1, verificationStatus: 1 });

export const Response = mongoose.model<IResponse>("Response", ResponseSchema);
