import { Router, Request, Response } from "express";
import type { Router as IRouter } from "express";
import {
  ML_CLASS_TO_ISSUE_TYPE,
  ISSUE_TYPE_LABELS,
  IssueType,
} from "@techsprint/types";

const router: IRouter = Router();

// ML model class names (alphabetically sorted - matches model output order)
const ML_CLASS_NAMES = [
  "Broken Road Sign Issues",
  "Damaged Electric wires and poles",
  "Damaged concrete structures",
  "Dead Animal Pollution",
  "Fallen trees",
  "Illegal Parking Issues",
  "Littering",
  "Potholes and Road Damage",
  "Vandalism Issues",
];

// Confidence thresholds
const CONFIDENCE_THRESHOLD = 0.7;
const WARNING_THRESHOLD = 0.85;

interface ClassifyRequest {
  imageUrl: string;
}

interface ClassifyResponse {
  success: boolean;
  isValid: boolean;
  issueType: IssueType | null;
  className: string | null;
  confidence: number;
  message: string;
  allPredictions?: { className: string; probability: number }[];
}

/**
 * POST /api/classify
 * Classify an image to identify municipal issues
 *
 * For now, this uses image analysis heuristics.
 * When the TensorFlow model is deployed, this will use the trained model.
 */
router.post(
  "/",
  async (
    req: Request<object, ClassifyResponse, ClassifyRequest>,
    res: Response<ClassifyResponse>
  ) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          isValid: false,
          issueType: null,
          className: null,
          confidence: 0,
          message: "Image URL is required",
        });
      }

      // TODO: When TensorFlow Serving or TF.js backend is set up, call the model here
      // For now, return a placeholder that lets the frontend handle classification

      // Attempt to fetch and analyze the image
      const result = await analyzeImage(imageUrl);

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Classification error:", error);
      return res.status(500).json({
        success: false,
        isValid: true, // Allow submission even if classification fails
        issueType: null,
        className: null,
        confidence: 0,
        message:
          "Classification service unavailable. Please select issue type manually.",
      });
    }
  }
);

/**
 * GET /api/classify/issue-types
 * Get list of all valid issue types that can be classified
 */
router.get("/issue-types", (_req: Request, res: Response) => {
  const issueTypes = ML_CLASS_NAMES.map((className) => ({
    className,
    issueType: ML_CLASS_TO_ISSUE_TYPE[className],
    label: ISSUE_TYPE_LABELS[ML_CLASS_TO_ISSUE_TYPE[className] as IssueType],
  }));

  res.json({
    success: true,
    issueTypes,
    count: issueTypes.length,
  });
});

/**
 * Analyze image using basic heuristics
 * This is a placeholder until the TensorFlow model is deployed
 */
async function analyzeImage(
  imageUrl: string
): Promise<Omit<ClassifyResponse, "success">> {
  try {
    // Fetch image to verify it exists
    const response = await fetch(imageUrl, { method: "HEAD" });

    if (!response.ok) {
      return {
        isValid: false,
        issueType: null,
        className: null,
        confidence: 0,
        message: "Could not access the image. Please try uploading again.",
      };
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return {
        isValid: false,
        issueType: null,
        className: null,
        confidence: 0,
        message: "The uploaded file is not a valid image.",
      };
    }

    // For now, return a result that lets the user select the type
    // The frontend will do client-side analysis
    return {
      isValid: true,
      issueType: null,
      className: null,
      confidence: 0.5,
      message:
        "Image uploaded successfully. Please select or confirm the issue type.",
    };
  } catch (error) {
    console.error("Image analysis error:", error);
    return {
      isValid: true,
      issueType: null,
      className: null,
      confidence: 0,
      message: "Could not analyze image. Please select issue type manually.",
    };
  }
}

export const classifyRoutes = router;
