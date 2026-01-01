import { Router, Request, Response } from "express";
import type { Router as IRouter } from "express";
import { getAdminDb, COLLECTIONS } from "@techsprint/firebase";
import {
  createIssueInputSchema,
  respondToIssueInputSchema,
  issueFiltersSchema,
  paginationSchema,
} from "@techsprint/validation";
import { generateIssueId } from "@techsprint/utils";
import {
  authMiddleware,
  requireRole,
  requireMunicipality,
  AuthenticatedRequest,
} from "../middleware/auth";
import {
  findMunicipalityForLocation,
  getAdministrativeRegion,
  classifyIssueWithGemini,
} from "../services/location";
import type { Issue, IssueStatus, GeoLocation } from "@techsprint/types";

const router: IRouter = Router();

// Get all issues (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const filters = issueFiltersSchema.parse(req.query);

    let query = db.collection(COLLECTIONS.ISSUES).orderBy("createdAt", "desc");

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.where("status", "in", filters.status);
    }
    if (filters.type && filters.type.length > 0) {
      query = query.where("type", "in", filters.type);
    }
    if (filters.municipalityId) {
      query = query.where("municipalityId", "==", filters.municipalityId);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const snapshot = await query.limit(pageSize).offset(offset).get();

    const issues = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    // Get total count
    const countSnapshot = await db.collection(COLLECTIONS.ISSUES).count().get();
    const total = countSnapshot.data().count;

    res.json({
      success: true,
      data: {
        items: issues,
        total,
        page,
        pageSize,
        hasMore: offset + issues.length < total,
      },
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching issues:", error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to fetch issues",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get global stats (public) - must be before /:id to avoid route conflicts
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const db = getAdminDb();

    // Get total issues count
    const totalSnapshot = await db.collection(COLLECTIONS.ISSUES).count().get();
    const totalIssues = totalSnapshot.data().count;

    // Get resolved issues count (VERIFIED status)
    const resolvedSnapshot = await db
      .collection(COLLECTIONS.ISSUES)
      .where("status", "==", "VERIFIED")
      .count()
      .get();
    const resolvedIssues = resolvedSnapshot.data().count;

    // Get municipalities count
    const municipalitiesSnapshot = await db
      .collection(COLLECTIONS.MUNICIPALITIES)
      .count()
      .get();
    const totalMunicipalities = municipalitiesSnapshot.data().count;

    res.json({
      success: true,
      data: {
        totalIssues,
        resolvedIssues,
        openIssues: totalIssues - resolvedIssues,
        totalMunicipalities,
        avgResponseTime: 48, // This would need more complex calculation
      },
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "Error fetching global stats:",
      error?.message || String(error)
    );
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to fetch stats",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get single issue (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const doc = await db
      .collection(COLLECTIONS.ISSUES)
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Issue not found",
        timestamp: new Date().toISOString(),
      });
    }

    const issue = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    };

    res.json({
      success: true,
      data: issue,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching issue:", error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to fetch issue",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get issues by bounds (for map)
router.get("/map/bounds", async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { north, south, east, west } = req.query;

    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Missing bounds parameters",
        timestamp: new Date().toISOString(),
      });
    }

    // Note: Firestore doesn't support compound geo queries
    // For production, use GeoFirestore or similar
    const snapshot = await db
      .collection(COLLECTIONS.ISSUES)
      .where("location.latitude", ">=", parseFloat(south as string))
      .where("location.latitude", "<=", parseFloat(north as string))
      .limit(500)
      .get();

    const issues = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((issue) => {
        const lng = (issue as any).location?.longitude;
        return (
          lng >= parseFloat(west as string) && lng <= parseFloat(east as string)
        );
      });

    res.json({
      success: true,
      data: issues,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "Error fetching map issues:",
      error?.message || String(error)
    );
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to fetch map issues",
      timestamp: new Date().toISOString(),
    });
  }
});

// Create new issue (anonymous/public)
router.post("/", async (req: Request, res: Response) => {
  try {
    const input = createIssueInputSchema.parse(req.body);
    const db = getAdminDb();

    const issueId = generateIssueId();
    const now = new Date();

    const { latitude, longitude } = input.location;

    // Classify issue type using Gemini (if type not provided)
    let classifiedType = input.type || "OTHER";
    if (!input.type) {
      try {
        const classification = await classifyIssueWithGemini(input.description);
        if (classification && classification.confidence > 0.7) {
          classifiedType = classification.type as any;
          console.log(
            `Issue classified as ${classifiedType} with confidence ${classification.confidence}`
          );
        }
      } catch (err) {
        console.warn("Issue classification failed, using default type:", err);
      }
    }

    // Get administrative region from coordinates
    let region = {
      state: "Unknown",
      district: "Unknown",
      municipality: "Unknown",
    };

    try {
      const adminRegion = await getAdministrativeRegion(latitude, longitude);
      if (adminRegion) {
        region = {
          state: adminRegion.state || "Unknown",
          district: adminRegion.district || "Unknown",
          municipality: adminRegion.municipality || "Unknown",
          ...(adminRegion.pincode && { pincode: adminRegion.pincode }),
        };
      }
    } catch (err) {
      console.warn("Failed to get administrative region:", err);
    }

    // Find the appropriate municipality based on location
    let municipalityId = "MUN-DEFAULT";
    try {
      const municipalityMatch = await findMunicipalityForLocation(
        latitude,
        longitude,
        db
      );
      if (municipalityMatch) {
        municipalityId = municipalityMatch.municipalityId;
        console.log(
          `Issue assigned to municipality ${municipalityMatch.name} (${municipalityMatch.matchType})`
        );
      }
    } catch (err) {
      console.warn("Failed to find municipality for location:", err);
    }

    const location: GeoLocation = {
      latitude,
      longitude,
    };

    // Support both single imageUrl and imageUrls array
    const imageUrls =
      req.body.imageUrls || (input.imageUrl ? [input.imageUrl] : []);

    const issue: Omit<Issue, "id"> = {
      type: classifiedType,
      description: input.description,
      imageUrl: input.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : null),
      imageUrls: imageUrls,
      location,
      region,
      municipalityId,
      status: "OPEN" as IssueStatus,
      createdAt: now,
      updatedAt: now,
      resolution: null,
    };

    await db
      .collection(COLLECTIONS.ISSUES)
      .doc(issueId)
      .set({
        ...issue,
        createdAt: now,
        updatedAt: now,
      });

    // Update municipality stats
    await db
      .collection(COLLECTIONS.MUNICIPALITIES)
      .doc(municipalityId)
      .update({
        totalIssues:
          require("firebase-admin").firestore.FieldValue.increment(1),
        updatedAt: now,
      })
      .catch(() => {
        // Municipality might not exist yet
      });

    res.status(201).json({
      success: true,
      data: { id: issueId, ...issue },
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating issue:", error?.message || error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        data: null,
        error:
          "Validation failed: " +
          error.errors.map((e: any) => e.message).join(", "),
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to create issue",
      timestamp: new Date().toISOString(),
    });
  }
});

// Respond to issue (municipality user only)
router.post(
  "/:id/respond",
  authMiddleware,
  requireRole("MUNICIPALITY_USER"),
  requireMunicipality,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        response: responseText,
        resolutionImageUrl,
        resolutionNote,
      } = req.body;

      if (!responseText && !resolutionNote) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "Response text is required",
          timestamp: new Date().toISOString(),
        });
      }

      const db = getAdminDb();

      // Get the issue
      const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(id).get();

      if (!issueDoc.exists) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "Issue not found",
          timestamp: new Date().toISOString(),
        });
      }

      const issue = issueDoc.data() as Issue;

      // Check jurisdiction
      if (issue.municipalityId !== req.user?.municipalityId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: "Issue not in your jurisdiction",
          timestamp: new Date().toISOString(),
        });
      }

      const now = new Date();

      await db
        .collection(COLLECTIONS.ISSUES)
        .doc(id)
        .update({
          status: issue.status === "OPEN" ? "RESPONDED" : issue.status,
          municipalityResponse: responseText || resolutionNote,
          resolution: {
            resolutionImageUrl: resolutionImageUrl || null,
            resolutionNote: responseText || resolutionNote,
            respondedAt: now,
            respondedBy: req.user?.uid,
            verificationScore: null,
            verifiedAt: null,
          },
          updatedAt: now,
        });

      res.json({
        success: true,
        data: {
          issueId: id,
          status: issue.status === "OPEN" ? "RESPONDED" : issue.status,
        },
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        "Error responding to issue:",
        error?.message || String(error)
      );

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          data: null,
          error:
            "Validation failed: " +
            error.errors.map((e: any) => e.message).join(", "),
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        data: null,
        error: "Failed to respond to issue",
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Update issue status (municipality user only)
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("MUNICIPALITY_USER"),
  requireMunicipality,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "OPEN",
        "RESPONDED",
        "VERIFIED",
        "RESOLVED",
        "REJECTED",
      ];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
          timestamp: new Date().toISOString(),
        });
      }

      const db = getAdminDb();

      // Get the issue
      const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(id).get();

      if (!issueDoc.exists) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "Issue not found",
          timestamp: new Date().toISOString(),
        });
      }

      const issue = issueDoc.data() as Issue;

      // Check jurisdiction
      if (issue.municipalityId !== req.user?.municipalityId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: "Issue not in your jurisdiction",
          timestamp: new Date().toISOString(),
        });
      }

      const now = new Date();

      await db
        .collection(COLLECTIONS.ISSUES)
        .doc(id)
        .update({
          status,
          updatedAt: now,
          ...(status === "RESOLVED" ? { resolvedAt: now } : {}),
        });

      // Update municipality stats if resolved
      if (status === "RESOLVED" && issue.municipalityId) {
        const muniRef = db
          .collection(COLLECTIONS.MUNICIPALITIES)
          .doc(issue.municipalityId);
        const muniDoc = await muniRef.get();
        if (muniDoc.exists) {
          const muniData = muniDoc.data();
          await muniRef.update({
            resolvedIssues: (muniData?.resolvedIssues || 0) + 1,
            updatedAt: now,
          });
        }
      }

      res.json({
        success: true,
        data: { issueId: id, status },
        error: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        "Error updating issue status:",
        error?.message || String(error)
      );
      res.status(500).json({
        success: false,
        data: null,
        error: "Failed to update issue status",
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export { router as issueRoutes };
