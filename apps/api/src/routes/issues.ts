import { Router, Request, Response, NextFunction } from "express";
import type { Router as RouterType } from "express";
import mongoose from "mongoose";
import { Issue, Municipality, ISSUE_TYPES } from "../models/index.js";
import { upload } from "../middleware/upload.js";
import { issueSubmitLimiter } from "../middleware/rateLimiter.js";
import { AppError } from "../middleware/errorHandler.js";
import { uploadImageBuffer } from "../config/cloudinary.js";
import { reverseGeocode, getLocationFromIP } from "../services/geocoding.js";
import {
  findMunicipalityByLocation,
  findMunicipalityByAddress,
} from "../services/municipalityMatcher.js";
import { classifyIssue } from "../services/mlService.js";
import { incrementIssueCount } from "../services/scoringService.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router: RouterType = Router();

/**
 * POST /api/issues
 * Submit a new civic issue (anonymous)
 */
router.post(
  "/",
  issueSubmitLimiter,
  upload.single("image"),
  async (
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { latitude, longitude, description } = req.body;

      // Validate required fields
      if (!req.file) {
        throw new AppError("Image is required", 400);
      }

      if (!description || description.trim().length < 10) {
        throw new AppError("Description must be at least 10 characters", 400);
      }

      if (description.length > 1000) {
        throw new AppError(
          "Description must be less than 1000 characters",
          400
        );
      }

      // Get coordinates
      let lat = parseFloat(latitude);
      let lng = parseFloat(longitude);

      // If no coordinates provided, try IP-based geolocation
      if (isNaN(lat) || isNaN(lng)) {
        const clientIP = req.ip || req.socket.remoteAddress || "";
        const ipLocation = await getLocationFromIP(clientIP);

        if (ipLocation) {
          lat = ipLocation.latitude;
          lng = ipLocation.longitude;
        } else {
          throw new AppError(
            "Location is required. Please enable location access or provide coordinates.",
            400
          );
        }
      }

      // Validate coordinates are within India (approximate bounds)
      if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
        throw new AppError("Location must be within India", 400);
      }

      // Reverse geocode to get address
      const address = await reverseGeocode(lat, lng);
      if (!address) {
        throw new AppError(
          "Could not determine address for this location",
          400
        );
      }

      // Find matching municipality
      let municipalityMatch = await findMunicipalityByLocation(lng, lat);

      if (!municipalityMatch) {
        // Fallback to address-based matching
        municipalityMatch = await findMunicipalityByAddress(
          address.district,
          address.state
        );
      }

      if (!municipalityMatch) {
        throw new AppError(
          "No municipality found for this location. This area may not be covered yet.",
          400
        );
      }

      // Upload image to Cloudinary
      const uploadResult = await uploadImageBuffer(
        req.file.buffer,
        "civicsense/issues"
      );

      // Classify issue using ML
      const classification = await classifyIssue(uploadResult.url, description);

      // Create issue
      const issue = new Issue({
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        address: {
          formatted: address.formatted,
          district: address.district,
          state: address.state,
          pincode: address.pincode,
          ward: address.ward,
        },
        municipalityId: municipalityMatch.municipalityId,
        issueType: classification.predictedType,
        issueTypeConfidence: classification.confidence,
        description: description.trim(),
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
        status: "OPEN",
        mlClassification: {
          predictedType: classification.predictedType,
          confidence: classification.confidence,
          allPredictions: classification.allPredictions,
          modelVersion: classification.modelVersion,
          classifiedAt: new Date(),
        },
      });

      await issue.save();

      // Increment municipality issue count
      await incrementIssueCount(municipalityMatch.municipalityId.toString());

      res.status(201).json({
        success: true,
        message: "Issue submitted successfully",
        data: {
          issueId: issue._id,
          issueType: issue.issueType,
          confidence: issue.issueTypeConfidence,
          municipality: municipalityMatch.name,
          status: issue.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues
 * Get all issues (public, with filters)
 */
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = "1",
        limit = "20",
        status,
        issueType,
        municipalityId,
        district,
        state,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNum - 1) * limitNum;

      // Build filter
      const filter: Record<string, unknown> = {};

      if (status && typeof status === "string") {
        filter.status = status;
      }

      if (
        issueType &&
        typeof issueType === "string" &&
        ISSUE_TYPES.includes(issueType as any)
      ) {
        filter.issueType = issueType;
      }

      if (municipalityId && typeof municipalityId === "string") {
        filter.municipalityId = new mongoose.Types.ObjectId(municipalityId);
      }

      if (district && typeof district === "string") {
        filter["address.district"] = { $regex: new RegExp(district, "i") };
      }

      if (state && typeof state === "string") {
        filter["address.state"] = { $regex: new RegExp(state, "i") };
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          (filter.createdAt as Record<string, Date>).$gte = new Date(
            startDate as string
          );
        }
        if (endDate) {
          (filter.createdAt as Record<string, Date>).$lte = new Date(
            endDate as string
          );
        }
      }

      // Build sort
      const sortField = ["createdAt", "issueType", "status"].includes(
        sortBy as string
      )
        ? (sortBy as string)
        : "createdAt";
      const sortDirection = sortOrder === "asc" ? 1 : -1;

      // Execute query
      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .populate("municipalityId", "name type district state")
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
 * GET /api/issues/map
 * Get issues for map display (lightweight)
 */
router.get(
  "/map",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        bounds, // "sw_lat,sw_lng,ne_lat,ne_lng"
        status,
        issueType,
        limit = "500",
      } = req.query;

      const filter: Record<string, unknown> = {};

      // Parse bounds for geospatial query
      if (bounds && typeof bounds === "string") {
        const [swLat, swLng, neLat, neLng] = bounds.split(",").map(Number);

        if (!isNaN(swLat) && !isNaN(swLng) && !isNaN(neLat) && !isNaN(neLng)) {
          filter.location = {
            $geoWithin: {
              $box: [
                [swLng, swLat], // Southwest corner
                [neLng, neLat], // Northeast corner
              ],
            },
          };
        }
      }

      if (status && typeof status === "string") {
        filter.status = status;
      }

      if (issueType && typeof issueType === "string") {
        filter.issueType = issueType;
      }

      const limitNum = Math.min(1000, parseInt(limit as string, 10));

      const issues = await Issue.find(filter)
        .select("location issueType status createdAt")
        .limit(limitNum)
        .lean();

      // Transform for map markers
      const markers = issues.map((issue) => ({
        id: issue._id,
        lat: issue.location.coordinates[1],
        lng: issue.location.coordinates[0],
        type: issue.issueType,
        status: issue.status,
        date: issue.createdAt,
      }));

      res.json({
        success: true,
        data: markers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues/heatmap
 * Get aggregated data for heatmap
 */
router.get(
  "/heatmap",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { issueType, status } = req.query;

      const matchStage: Record<string, unknown> = {};

      if (issueType && typeof issueType === "string") {
        matchStage.issueType = issueType;
      }

      if (status && typeof status === "string") {
        matchStage.status = status;
      }

      const heatmapData = await Issue.aggregate([
        { $match: matchStage },
        {
          $project: {
            lat: { $arrayElemAt: ["$location.coordinates", 1] },
            lng: { $arrayElemAt: ["$location.coordinates", 0] },
          },
        },
        { $limit: 5000 },
      ]);

      res.json({
        success: true,
        data: heatmapData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues/:id
 * Get single issue details
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid issue ID", 400);
      }

      const issue = await Issue.findById(id)
        .populate("municipalityId", "name type district state contactEmail")
        .lean();

      if (!issue) {
        throw new AppError("Issue not found", 404);
      }

      res.json({
        success: true,
        data: issue,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/issues/stats/overview
 * Get overall statistics
 */
router.get(
  "/stats/overview",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalIssues,
        openIssues,
        resolvedIssues,
        issuesByType,
        issuesByMonth,
      ] = await Promise.all([
        Issue.countDocuments(),
        Issue.countDocuments({ status: "OPEN" }),
        Issue.countDocuments({ status: "VERIFIED" }),
        Issue.aggregate([
          { $group: { _id: "$issueType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Issue.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
          { $limit: 12 },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalIssues,
          openIssues,
          resolvedIssues,
          resolutionRate:
            totalIssues > 0
              ? ((resolvedIssues / totalIssues) * 100).toFixed(2)
              : 0,
          issuesByType: issuesByType.map((item) => ({
            type: item._id,
            count: item.count,
          })),
          issuesByMonth: issuesByMonth.map((item) => ({
            year: item._id.year,
            month: item._id.month,
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
