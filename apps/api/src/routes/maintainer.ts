import { Router, Response, NextFunction } from "express";
import type { Router as RouterType } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  PlatformMaintainer,
  Issue,
  Response as IssueResponse,
  Municipality,
} from "../models/index.js";
import {
  authenticatePlatformMaintainer,
  AuthRequest,
  generateToken,
} from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { AppError } from "../middleware/errorHandler.js";
import { awardResolutionPoints } from "../services/scoringService.js";
import { config } from "../config/index.js";

const router: RouterType = Router();

/**
 * POST /api/maintainer/login
 * Platform maintainer login
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

      const maintainer = await PlatformMaintainer.findOne({
        email: email.toLowerCase(),
        isActive: true,
      });

      if (!maintainer) {
        throw new AppError("Invalid credentials", 401);
      }

      const isValidPassword = await bcrypt.compare(
        password,
        maintainer.passwordHash
      );
      if (!isValidPassword) {
        throw new AppError("Invalid credentials", 401);
      }

      // Update last login
      maintainer.lastLogin = new Date();
      await maintainer.save();

      // Generate token
      const token = generateToken({
        id: maintainer._id.toString(),
        role: "platform_maintainer",
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: maintainer._id,
            email: maintainer.email,
            name: maintainer.name,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/maintainer/reviews
 * Get issues pending manual review
 */
router.get(
  "/reviews",
  authenticatePlatformMaintainer,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page = "1", limit = "20" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNum - 1) * limitNum;

      // Find responses that need manual review
      const [responses, total] = await Promise.all([
        IssueResponse.find({ verificationStatus: "NEEDS_MANUAL_REVIEW" })
          .populate("issueId", "issueType description imageUrl address status")
          .populate("municipalityId", "name type district state")
          .populate("respondedBy", "name designation")
          .sort({ createdAt: 1 }) // Oldest first
          .skip(skip)
          .limit(limitNum)
          .lean(),
        IssueResponse.countDocuments({
          verificationStatus: "NEEDS_MANUAL_REVIEW",
        }),
      ]);

      res.json({
        success: true,
        data: {
          responses,
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
 * GET /api/maintainer/reviews/:id
 * Get single review details
 */
router.get(
  "/reviews/:id",
  authenticatePlatformMaintainer,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid response ID", 400);
      }

      const response = await IssueResponse.findById(id)
        .populate("issueId")
        .populate("municipalityId", "name type district state score")
        .populate("respondedBy", "name designation email")
        .lean();

      if (!response) {
        throw new AppError("Response not found", 404);
      }

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/maintainer/reviews/:id/decide
 * Make a decision on a manual review
 */
router.post(
  "/reviews/:id/decide",
  authenticatePlatformMaintainer,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const maintainerId = req.user!.id;

      if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
        throw new AppError("Decision must be APPROVED or REJECTED", 400);
      }

      if (!notes || notes.trim().length < 5) {
        throw new AppError("Review notes are required", 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid response ID", 400);
      }

      const response = await IssueResponse.findById(id);

      if (!response) {
        throw new AppError("Response not found", 404);
      }

      if (response.verificationStatus !== "NEEDS_MANUAL_REVIEW") {
        throw new AppError("This response has already been reviewed", 400);
      }

      // Update response
      response.verificationStatus =
        decision === "APPROVED" ? "VERIFIED" : "REJECTED";
      response.manualReview = {
        reviewedBy: new mongoose.Types.ObjectId(maintainerId),
        reviewedAt: new Date(),
        decision,
        notes: notes.trim(),
      };

      if (decision === "APPROVED") {
        response.pointsAwarded = config.scoring.verifiedResolutionPoints;

        // Award points to municipality
        await awardResolutionPoints(response.municipalityId.toString());
      }

      await response.save();

      // Update issue status
      const issue = await Issue.findById(response.issueId);
      if (issue) {
        issue.status = decision === "APPROVED" ? "VERIFIED" : "DISPUTED";
        await issue.save();
      }

      res.json({
        success: true,
        message: `Review ${decision.toLowerCase()} successfully`,
        data: {
          responseId: response._id,
          verificationStatus: response.verificationStatus,
          pointsAwarded: response.pointsAwarded,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/maintainer/stats
 * Get platform-wide statistics for maintainer dashboard
 */
router.get(
  "/stats",
  authenticatePlatformMaintainer,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const [
        totalIssues,
        pendingReviews,
        totalMunicipalities,
        issuesByStatus,
        reviewsThisWeek,
      ] = await Promise.all([
        Issue.countDocuments(),
        IssueResponse.countDocuments({
          verificationStatus: "NEEDS_MANUAL_REVIEW",
        }),
        Municipality.countDocuments(),
        Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        IssueResponse.countDocuments({
          "manualReview.reviewedAt": {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalIssues,
          pendingReviews,
          totalMunicipalities,
          reviewsThisWeek,
          issuesByStatus: issuesByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
