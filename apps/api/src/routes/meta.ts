import { Router, Request, Response } from "express";
import type { Router as RouterType } from "express";
import { Municipality, ISSUE_TYPES } from "../models/index.js";

const router: RouterType = Router();

/**
 * GET /api/municipalities
 * Get list of municipalities for dropdowns/filters
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, district, type, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (state && typeof state === "string") {
      filter.state = { $regex: new RegExp(state, "i") };
    }

    if (district && typeof district === "string") {
      filter.district = { $regex: new RegExp(district, "i") };
    }

    if (type && typeof type === "string") {
      filter.type = type;
    }

    if (search && typeof search === "string") {
      filter.name = { $regex: new RegExp(search, "i") };
    }

    const municipalities = await Municipality.find(filter)
      .select("name type state district")
      .sort({ name: 1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: municipalities,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch municipalities" });
  }
});

/**
 * GET /api/municipalities/states
 * Get list of unique states
 */
router.get("/states", async (req: Request, res: Response): Promise<void> => {
  try {
    const states = await Municipality.distinct("state");
    states.sort();

    res.json({
      success: true,
      data: states,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

/**
 * GET /api/municipalities/districts/:state
 * Get districts for a state
 */
router.get(
  "/districts/:state",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { state } = req.params;

      const districts = await Municipality.distinct("district", {
        state: { $regex: new RegExp(state, "i") },
      });
      districts.sort();

      res.json({
        success: true,
        data: districts,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  }
);

/**
 * GET /api/municipalities/types
 * Get municipality types
 */
router.get("/types", async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: ["corporation", "municipality", "town_panchayat", "gram_panchayat"],
  });
});

/**
 * GET /api/issue-types
 * Get all issue types
 */
router.get(
  "/issue-types",
  async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      data: ISSUE_TYPES,
    });
  }
);

export default router;
