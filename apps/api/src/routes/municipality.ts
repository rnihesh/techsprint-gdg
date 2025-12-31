import { Router, Response, NextFunction, Request } from "express";
import type { Router as RouterType } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  MunicipalityUser,
  Municipality,
  Issue,
  Response as IssueResponse,
} from "../models/index.js";
import {
  authenticateMunicipality,
  AuthRequest,
  generateToken,
} from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/upload.js";
import { AppError } from "../middleware/errorHandler.js";
import { uploadImageBuffer } from "../config/cloudinary.js";
import { verifyResolution } from "../services/mlService.js";
import { awardResolutionPoints } from "../services/scoringService.js";
import { config } from "../config/index.js";

interface AuthMulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

const router: RouterType = Router();

/**
 * POST /api/municipality/login
 * Municipality user login
 */
router.post(
  "/login",
  authLimiter,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const user = await MunicipalityUser.findOne({
        email: email.toLowerCase(),
        isActive: true,
      });

      if (!user) {
        throw new AppError("Invalid credentials", 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AppError("Invalid credentials", 401);
      }

      if (!user.isVerified) {
        throw new AppError(
          "Account not verified. Please contact administrator.",
          403
        );
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Get municipality info
      const municipality = await Municipality.findById(
        user.municipalityId
      ).select("name type district state");

      // Generate token
      const token = generateToken({
        id: user._id.toString(),
        municipalityId: user.municipalityId.toString(),
        role: "municipality_user",
        userRole: user.role,
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            designation: user.designation,
            role: user.role,
          },
          municipality,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/municipality/profile
 * Get current user profile
 */
router.get(
  "/profile",
  authenticateMunicipality,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await MunicipalityUser.findById(req.user!.id).select(
        "-passwordHash"
      );

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const municipality = await Municipality.findById(user.municipalityId);

      res.json({
        success: true,
        data: {
          user,
          municipality,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/municipality/issues
 * Get issues for the municipality
 */
router.get(
  "/issues",
  authenticateMunicipality,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const municipalityId = req.user!.municipalityId;

      const {
        page = "1",
        limit = "20",
        status,
        issueType,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {
        municipalityId: new mongoose.Types.ObjectId(municipalityId),
      };

      if (status && typeof status === "string") {
        filter.status = status;
      }

      if (issueType && typeof issueType === "string") {
        filter.issueType = issueType;
      }

      const sortField = ["createdAt", "issueType", "status"].includes(
        sortBy as string
      )
        ? (sortBy as string)
        : "createdAt";
      const sortDirection = sortOrder === "asc" ? 1 : -1;

      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .sort({ [sortField]: sortDirection })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Issue.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          issues,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/municipality/issues/:id
 * Get single issue details for municipality
 */
router.get(
  "/issues/:id",
  authenticateMunicipality,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const municipalityId = req.user!.municipalityId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid issue ID", 400);
      }

      const issue = await Issue.findOne({
        _id: id,
        municipalityId,
      }).lean();

      if (!issue) {
        throw new AppError("Issue not found or access denied", 404);
      }

      // Get any existing responses
      const responses = await IssueResponse.find({ issueId: id })
        .populate("respondedBy", "name designation")
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          issue,
          responses,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/municipality/issues/:id/respond
 * Submit a resolution response for an issue
 */
router.post(
  "/issues/:id/respond",
  authenticateMunicipality,
  upload.single("resolutionImage"),
  async (
    req: AuthMulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { resolutionNote } = req.body;
      const municipalityId = req.user!.municipalityId;
      const userId = req.user!.id;

      // Validate
      if (!req.file) {
        throw new AppError("Resolution image is required", 400);
      }

      if (!resolutionNote || resolutionNote.trim().length < 10) {
        throw new AppError(
          "Resolution note must be at least 10 characters",
          400
        );
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid issue ID", 400);
      }

      // Find issue
      const issue = await Issue.findOne({
        _id: id,
        municipalityId,
      });

      if (!issue) {
        throw new AppError("Issue not found or access denied", 404);
      }

      if (issue.status === "VERIFIED") {
        throw new AppError("Issue is already verified as resolved", 400);
      }

      // Upload resolution image
      const uploadResult = await uploadImageBuffer(
        req.file.buffer,
        "civicsense/resolutions"
      );

      // Run ML verification
      const verification = await verifyResolution(
        issue.imageUrl,
        uploadResult.url,
        issue.issueType
      );

      // Determine verification status
      let verificationStatus: "VERIFIED" | "NEEDS_MANUAL_REVIEW" | "REJECTED";
      let issueStatus: "VERIFIED" | "RESPONDED" | "NEEDS_MANUAL_REVIEW";
      let pointsAwarded = 0;

      if (
        verification.confidence >= config.ml.verificationConfidenceThreshold
      ) {
        verificationStatus = "VERIFIED";
        issueStatus = "VERIFIED";
        pointsAwarded = config.scoring.verifiedResolutionPoints;

        // Award points
        await awardResolutionPoints(municipalityId!);
      } else {
        verificationStatus = "NEEDS_MANUAL_REVIEW";
        issueStatus = "NEEDS_MANUAL_REVIEW";
      }

      // Create response record
      const response = new IssueResponse({
        issueId: issue._id,
        municipalityId,
        respondedBy: userId,
        resolutionNote: resolutionNote.trim(),
        resolutionImageUrl: uploadResult.url,
        resolutionImagePublicId: uploadResult.publicId,
        verificationStatus,
        mlVerification: {
          similarityScore: verification.similarityScore,
          resolutionConfidence: verification.confidence,
          beforeImageAnalysis: verification.beforeAnalysis,
          afterImageAnalysis: verification.afterAnalysis,
          modelVersion: verification.modelVersion,
          verifiedAt: new Date(),
        },
        pointsAwarded,
      });

      await response.save();

      // Update issue status
      issue.status = issueStatus;
      await issue.save();

      res.json({
        success: true,
        message:
          verificationStatus === "VERIFIED"
            ? "Resolution verified successfully!"
            : "Response submitted. Pending manual review.",
        data: {
          responseId: response._id,
          verificationStatus,
          confidence: verification.confidence,
          pointsAwarded,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/municipality/stats
 * Get municipality statistics
 */
router.get(
  "/stats",
  authenticateMunicipality,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const municipalityId = req.user!.municipalityId;

      const [
        municipality,
        totalIssues,
        openIssues,
        respondedIssues,
        verifiedIssues,
        issuesByType,
        recentIssues,
        avgResolutionTime,
      ] = await Promise.all([
        Municipality.findById(municipalityId),
        Issue.countDocuments({ municipalityId }),
        Issue.countDocuments({ municipalityId, status: "OPEN" }),
        Issue.countDocuments({ municipalityId, status: "RESPONDED" }),
        Issue.countDocuments({ municipalityId, status: "VERIFIED" }),
        Issue.aggregate([
          {
            $match: {
              municipalityId: new mongoose.Types.ObjectId(municipalityId),
            },
          },
          { $group: { _id: "$issueType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Issue.find({ municipalityId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("issueType status createdAt address.formatted")
          .lean(),
        // Calculate average resolution time for verified issues
        IssueResponse.aggregate([
          {
            $match: {
              municipalityId: new mongoose.Types.ObjectId(municipalityId),
              verificationStatus: "VERIFIED",
            },
          },
          {
            $lookup: {
              from: "issues",
              localField: "issueId",
              foreignField: "_id",
              as: "issue",
            },
          },
          { $unwind: "$issue" },
          {
            $project: {
              resolutionTime: {
                $subtract: ["$createdAt", "$issue.createdAt"],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: "$resolutionTime" },
            },
          },
        ]),
      ]);

      const avgTimeMs = avgResolutionTime[0]?.avgTime || 0;
      const avgTimeDays = Math.round(avgTimeMs / (1000 * 60 * 60 * 24));

      res.json({
        success: true,
        data: {
          municipality: {
            name: municipality?.name,
            score: municipality?.score,
            type: municipality?.type,
          },
          stats: {
            totalIssues,
            openIssues,
            respondedIssues,
            verifiedIssues,
            resolutionRate:
              totalIssues > 0
                ? ((verifiedIssues / totalIssues) * 100).toFixed(2)
                : 0,
            avgResolutionTimeDays: avgTimeDays,
          },
          issuesByType: issuesByType.map((item) => ({
            type: item._id,
            count: item.count,
          })),
          recentIssues,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
