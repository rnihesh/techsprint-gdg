import { IssueType, ISSUE_TYPES } from "../models/index.js";
import { config } from "../config/index.js";

/**
 * ML Service for issue classification and resolution verification
 *
 * This is a mock implementation. In production, you would:
 * 1. Use Google Cloud Vision API for image labeling
 * 2. Use a custom trained model for civic issue classification
 * 3. Use image similarity models for before/after comparison
 */

interface ClassificationResult {
  predictedType: IssueType;
  confidence: number;
  allPredictions: Array<{ type: IssueType; confidence: number }>;
  modelVersion: string;
}

interface VerificationResult {
  isResolved: boolean;
  confidence: number;
  similarityScore: number;
  beforeAnalysis: {
    labels: string[];
    issues: string[];
  };
  afterAnalysis: {
    labels: string[];
    improvements: string[];
  };
  modelVersion: string;
}

// Issue type keywords mapping (for mock classification)
const issueKeywords: Record<IssueType, string[]> = {
  pothole: ["hole", "road", "asphalt", "crack", "damage", "pit", "street"],
  garbage: ["trash", "waste", "rubbish", "garbage", "litter", "dump", "debris"],
  drainage: ["water", "flood", "drain", "sewage", "clog", "overflow", "puddle"],
  streetlight: ["light", "lamp", "pole", "dark", "broken", "electric", "bulb"],
  road_damage: ["crack", "broken", "damage", "road", "pavement", "surface"],
  water_supply: ["water", "pipe", "leak", "tap", "supply", "broken", "flow"],
  sewage: ["sewage", "smell", "waste", "overflow", "pipe", "drain", "manhole"],
  encroachment: [
    "illegal",
    "construction",
    "encroach",
    "occupy",
    "build",
    "shop",
  ],
  illegal_dumping: ["dump", "waste", "illegal", "trash", "garbage", "dispose"],
  broken_footpath: ["footpath", "sidewalk", "broken", "crack", "tile", "walk"],
  traffic_signal: ["signal", "traffic", "light", "broken", "stop", "red"],
  public_toilet: ["toilet", "bathroom", "dirty", "clean", "public", "urinal"],
  stray_animals: ["dog", "animal", "stray", "cow", "cattle", "dangerous"],
  noise_pollution: ["noise", "loud", "sound", "music", "horn", "construction"],
  air_pollution: ["smoke", "pollution", "air", "burn", "dust", "fume"],
  other: [],
};

/**
 * Classify issue type from image and description
 * Mock implementation - replace with actual ML model
 */
export const classifyIssue = async (
  imageUrl: string,
  description: string
): Promise<ClassificationResult> => {
  // In production, send image to Google Cloud Vision API
  // const visionLabels = await analyzeImageWithVision(imageUrl);

  // Mock implementation: analyze description text
  const descLower = description.toLowerCase();
  const scores: Array<{ type: IssueType; confidence: number }> = [];

  for (const issueType of ISSUE_TYPES) {
    const keywords = issueKeywords[issueType];
    let matchCount = 0;

    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        matchCount++;
      }
    }

    // Calculate confidence based on keyword matches
    const confidence =
      keywords.length > 0
        ? Math.min(0.95, (matchCount / keywords.length) * 1.5)
        : 0;

    scores.push({ type: issueType, confidence });
  }

  // Sort by confidence descending
  scores.sort((a, b) => b.confidence - a.confidence);

  // If no good match, default to 'other'
  let predicted = scores[0];
  if (predicted.confidence < 0.1) {
    predicted = { type: "other", confidence: 0.5 };
  }

  return {
    predictedType: predicted.type,
    confidence: Math.max(0.3, predicted.confidence), // Minimum confidence floor
    allPredictions: scores.slice(0, 5),
    modelVersion: "mock-v1.0",
  };
};

/**
 * Verify if an issue has been resolved by comparing before/after images
 * Mock implementation - replace with actual ML model
 */
export const verifyResolution = async (
  beforeImageUrl: string,
  afterImageUrl: string,
  issueType: IssueType
): Promise<VerificationResult> => {
  // In production:
  // 1. Use image similarity model (e.g., CLIP embeddings)
  // 2. Use object detection to identify issue presence
  // 3. Use classification model to detect resolution

  // Mock implementation with random confidence
  // In real scenario, this would analyze actual image content

  const mockSimilarity = 0.3 + Math.random() * 0.4; // 0.3-0.7
  const mockConfidence = 0.6 + Math.random() * 0.35; // 0.6-0.95

  const isResolved =
    mockConfidence >= config.ml.verificationConfidenceThreshold;

  return {
    isResolved,
    confidence: mockConfidence,
    similarityScore: mockSimilarity,
    beforeAnalysis: {
      labels: ["road", "damaged", "urban", "infrastructure"],
      issues: [issueType, "visible damage", "needs repair"],
    },
    afterAnalysis: {
      labels: ["road", "repaired", "urban", "infrastructure"],
      improvements: isResolved
        ? ["area cleaned", "repair visible", "issue addressed"]
        : ["partial repair", "issue still visible"],
    },
    modelVersion: "mock-v1.0",
  };
};

/**
 * In production, implement this with Google Cloud Vision API
 */
// async function analyzeImageWithVision(imageUrl: string): Promise<string[]> {
//   const vision = require('@google-cloud/vision');
//   const client = new vision.ImageAnnotatorClient();
//
//   const [result] = await client.labelDetection(imageUrl);
//   const labels = result.labelAnnotations || [];
//
//   return labels.map((label: any) => label.description.toLowerCase());
// }
