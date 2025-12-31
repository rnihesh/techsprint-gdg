import { Router, Request, Response, NextFunction } from "express";
import type { Router as RouterType } from "express";
import { Municipality, Issue } from "../models/index.js";

const router: RouterType = Router();

/**
 * GET /api/leaderboard
 * Get municipality leaderboard sorted by score
 */
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = "1", limit = "20", state, type } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {};

      if (state && typeof state === "string") {
        filter.state = { $regex: new RegExp(state, "i") };
      }

      if (type && typeof type === "string") {
        filter.type = type;
      }

      const [municipalities, total] = await Promise.all([
        Municipality.find(filter)
          .sort({ score: -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "name type state district score totalIssuesReceived totalIssuesResolved"
          )
          .lean(),
        Municipality.countDocuments(filter),
      ]);

      // Add rank to each municipality
      const ranked = municipalities.map((m, index) => ({
        ...m,
        rank: skip + index + 1,
        resolutionRate:
          m.totalIssuesReceived > 0
            ? ((m.totalIssuesResolved / m.totalIssuesReceived) * 100).toFixed(2)
            : 0,
      }));

      res.json({
        success: true,
        data: {
          municipalities: ranked,
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
 * GET /api/leaderboard/top
 * Get top 10 municipalities
 */
router.get(
  "/top",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const municipalities = await Municipality.find()
        .sort({ score: -1 })
        .limit(10)
        .select(
          "name type state district score totalIssuesReceived totalIssuesResolved"
        )
        .lean();

      const ranked = municipalities.map((m, index) => ({
        ...m,
        rank: index + 1,
        resolutionRate:
          m.totalIssuesReceived > 0
            ? ((m.totalIssuesResolved / m.totalIssuesReceived) * 100).toFixed(2)
            : 0,
      }));

      res.json({
        success: true,
        data: ranked,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leaderboard/bottom
 * Get bottom 10 municipalities (lowest scores)
 */
router.get(
  "/bottom",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const total = await Municipality.countDocuments();

      const municipalities = await Municipality.find()
        .sort({ score: 1 })
        .limit(10)
        .select(
          "name type state district score totalIssuesReceived totalIssuesResolved"
        )
        .lean();

      const ranked = municipalities.map((m, index) => ({
        ...m,
        rank: total - index,
        resolutionRate:
          m.totalIssuesReceived > 0
            ? ((m.totalIssuesResolved / m.totalIssuesReceived) * 100).toFixed(2)
            : 0,
      }));

      res.json({
        success: true,
        data: ranked,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leaderboard/:id
 * Get detailed stats for a specific municipality
 */
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const municipality = await Municipality.findById(id).lean();

      if (!municipality) {
        res.status(404).json({ error: "Municipality not found" });
        return;
      }

      // Get detailed statistics
      const [issuesByStatus, issuesByType, monthlyTrend, rank] =
        await Promise.all([
          Issue.aggregate([
            { $match: { municipalityId: municipality._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]),
          Issue.aggregate([
            { $match: { municipalityId: municipality._id } },
            { $group: { _id: "$issueType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          Issue.aggregate([
            { $match: { municipalityId: municipality._id } },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                total: { $sum: 1 },
                resolved: {
                  $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] },
                },
              },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 12 },
          ]),
          Municipality.countDocuments({ score: { $gt: municipality.score } }),
        ]);

      res.json({
        success: true,
        data: {
          municipality: {
            ...municipality,
            rank: rank + 1,
            resolutionRate:
              municipality.totalIssuesReceived > 0
                ? (
                    (municipality.totalIssuesResolved /
                      municipality.totalIssuesReceived) *
                    100
                  ).toFixed(2)
                : 0,
          },
          issuesByStatus: issuesByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
          issuesByType: issuesByType.map((item) => ({
            type: item._id,
            count: item.count,
          })),
          monthlyTrend: monthlyTrend.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            total: item.total,
            resolved: item.resolved,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leaderboard/state/:state
 * Get leaderboard for a specific state
 */
router.get(
  "/state/:state",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { state } = req.params;

      const municipalities = await Municipality.find({
        state: { $regex: new RegExp(state, "i") },
      })
        .sort({ score: -1 })
        .select(
          "name type state district score totalIssuesReceived totalIssuesResolved"
        )
        .lean();

      const ranked = municipalities.map((m, index) => ({
        ...m,
        rank: index + 1,
        resolutionRate:
          m.totalIssuesReceived > 0
            ? ((m.totalIssuesResolved / m.totalIssuesReceived) * 100).toFixed(2)
            : 0,
      }));

      res.json({
        success: true,
        data: ranked,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
