import cron from "node-cron";
import { Issue, Municipality } from "../models/index.js";
import { config } from "../config/index.js";

/**
 * Scoring Service
 *
 * Municipality Scoring Algorithm:
 * - Base score: 10,000 points
 * - For each VERIFIED resolution: +10 points
 * - For each OPEN issue:
 *   - Month 1 (0-30 days): -200 points
 *   - Month 2 (31-60 days): -300 points
 *   - Month 3+ (61+ days): -500 points per month
 */

interface ScoreBreakdown {
  baseScore: number;
  resolutionBonus: number;
  openIssuePenalty: number;
  finalScore: number;
  openIssuesByAge: {
    month1: number;
    month2: number;
    month3Plus: number;
  };
}

/**
 * Calculate score for a municipality
 */
export const calculateMunicipalityScore = async (
  municipalityId: string
): Promise<ScoreBreakdown> => {
  const now = new Date();
  const month1Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const month2Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Get municipality stats
  const municipality = await Municipality.findById(municipalityId);
  if (!municipality) {
    throw new Error("Municipality not found");
  }

  // Count open issues by age
  const openIssues = await Issue.find({
    municipalityId,
    status: "OPEN",
  }).select("createdAt");

  let month1Count = 0;
  let month2Count = 0;
  let month3PlusCount = 0;

  for (const issue of openIssues) {
    if (issue.createdAt >= month1Ago) {
      month1Count++;
    } else if (issue.createdAt >= month2Ago) {
      month2Count++;
    } else {
      // Calculate additional months beyond 2
      const ageMs = now.getTime() - issue.createdAt.getTime();
      const ageMonths = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));
      month3PlusCount += ageMonths - 2; // Count each additional month
    }
  }

  // Calculate penalties
  const { scoring } = config;
  const month1Penalty = month1Count * scoring.penaltyMonth1;
  const month2Penalty = month2Count * scoring.penaltyMonth2;
  const month3PlusPenalty = month3PlusCount * scoring.penaltyMonth3Plus;
  const totalPenalty = month1Penalty + month2Penalty + month3PlusPenalty;

  // Calculate bonus from verified resolutions
  const resolutionBonus =
    municipality.totalIssuesResolved * scoring.verifiedResolutionPoints;

  // Calculate final score
  const finalScore = Math.max(
    0,
    scoring.baseScore + resolutionBonus - totalPenalty
  );

  return {
    baseScore: scoring.baseScore,
    resolutionBonus,
    openIssuePenalty: totalPenalty,
    finalScore,
    openIssuesByAge: {
      month1: month1Count,
      month2: month2Count,
      month3Plus: month3PlusCount,
    },
  };
};

/**
 * Update all municipality scores
 */
export const updateAllMunicipalityScores = async (): Promise<void> => {
  console.log("Starting municipality score update...");

  const municipalities = await Municipality.find({}).select("_id name");

  for (const municipality of municipalities) {
    try {
      const scoreBreakdown = await calculateMunicipalityScore(
        municipality._id.toString()
      );

      await Municipality.findByIdAndUpdate(municipality._id, {
        score: scoreBreakdown.finalScore,
      });

      console.log(
        `Updated score for ${municipality.name}: ${scoreBreakdown.finalScore}`
      );
    } catch (error) {
      console.error(`Error updating score for ${municipality.name}:`, error);
    }
  }

  console.log("Municipality score update complete.");
};

/**
 * Award points for verified resolution
 */
export const awardResolutionPoints = async (
  municipalityId: string
): Promise<void> => {
  await Municipality.findByIdAndUpdate(municipalityId, {
    $inc: {
      score: config.scoring.verifiedResolutionPoints,
      totalIssuesResolved: 1,
    },
  });
};

/**
 * Increment issue count for municipality
 */
export const incrementIssueCount = async (
  municipalityId: string
): Promise<void> => {
  await Municipality.findByIdAndUpdate(municipalityId, {
    $inc: { totalIssuesReceived: 1 },
  });
};

/**
 * Start scheduled scoring jobs
 */
export const startScoringJobs = (): void => {
  // Run score update every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      await updateAllMunicipalityScores();
    } catch (error) {
      console.error("Scheduled score update failed:", error);
    }
  });

  console.log("✅ Scoring jobs scheduled");
};
