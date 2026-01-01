// ============================================
// ISSUE TYPES
// ============================================

export const ISSUE_TYPES = [
  "POTHOLE",
  "GARBAGE",
  "DRAINAGE",
  "ROAD_DAMAGE",
  "STREETLIGHT",
  "WATER_SUPPLY",
  "SEWAGE",
  "ENCROACHMENT",
  "SANITATION",
  "PARKS",
  "OTHER",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_STATUS = [
  "OPEN",
  "RESPONDED",
  "VERIFIED",
  "NEEDS_MANUAL_REVIEW",
] as const;

export type IssueStatus = (typeof ISSUE_STATUS)[number];

// ============================================
// GEOGRAPHIC TYPES
// ============================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AdministrativeRegion {
  state: string;
  district: string;
  municipality: string;
  ward?: string;
  pincode?: string;
}

// ============================================
// RESOLUTION TYPES
// ============================================

export interface ResolutionMetadata {
  resolutionImageUrl: string;
  resolutionNote: string;
  respondedAt: Date;
  respondedBy: string;
  verificationScore: number | null;
  verifiedAt: Date | null;
}

// ============================================
// ISSUE ENTITY
// ============================================

export interface Issue {
  id: string;
  type: IssueType;
  description: string;
  imageUrl: string | null;
  imageUrls?: string[];
  location: GeoLocation;
  region: AdministrativeRegion;
  municipalityId: string;
  municipalityResponse?: string;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolution: ResolutionMetadata | null;
}

export interface CreateIssueInput {
  description: string;
  imageUrl: string;
  location: GeoLocation;
  type?: IssueType;
}

export interface RespondToIssueInput {
  issueId: string;
  resolutionImageUrl: string;
  resolutionNote: string;
}

// ============================================
// MUNICIPALITY TYPES
// ============================================

export const MUNICIPALITY_TYPES = [
  "MUNICIPAL_CORPORATION",
  "MUNICIPALITY",
  "NAGAR_PANCHAYAT",
  "GRAM_PANCHAYAT",
  "CANTONMENT_BOARD",
] as const;

export type MunicipalityType = (typeof MUNICIPALITY_TYPES)[number];

export interface Municipality {
  id: string;
  name: string;
  type: MunicipalityType;
  state: string;
  district: string;
  score: number;
  totalIssues: number;
  resolvedIssues: number;
  avgResolutionTime: number | null; // in hours
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MunicipalityStats {
  municipalityId: string;
  totalIssues: number;
  openIssues: number;
  respondedIssues: number;
  verifiedIssues: number;
  manualReviewIssues: number;
  avgResolutionTimeHours: number | null;
  issuesByType: Record<IssueType, number>;
  monthlyTrend: Array<{
    month: string;
    issues: number;
    resolved: number;
  }>;
}

// ============================================
// USER TYPES
// ============================================

export const USER_ROLES = [
  "USER",
  "MUNICIPALITY_USER",
  "PLATFORM_MAINTAINER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  municipalityId: string | null;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface MunicipalityUser extends User {
  role: "MUNICIPALITY_USER";
  municipalityId: string;
}

// ============================================
// SCORING TYPES
// ============================================

export interface ScoreCalculation {
  municipalityId: string;
  baseScore: number;
  penalties: Array<{
    issueId: string;
    daysOpen: number;
    penalty: number;
  }>;
  bonuses: Array<{
    issueId: string;
    bonus: number;
    reason: string;
  }>;
  finalScore: number;
  calculatedAt: Date;
}

// ============================================
// ML/VERIFICATION TYPES
// ============================================

export interface ClassificationResult {
  type: IssueType;
  confidence: number;
  alternatives: Array<{
    type: IssueType;
    confidence: number;
  }>;
}

export interface VerificationResult {
  isResolved: boolean;
  confidence: number;
  factors: {
    imageSimilarity: number;
    cleanlinessScore: number;
    structuralChange: number;
  };
  explanation: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface IssueFilters {
  status?: IssueStatus[];
  type?: IssueType[];
  municipalityId?: string;
  startDate?: Date;
  endDate?: Date;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export interface LeaderboardEntry {
  rank: number;
  municipality: Municipality;
  score: number;
  trend: "UP" | "DOWN" | "STABLE";
  previousRank: number | null;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  totalMunicipalities: number;
}
