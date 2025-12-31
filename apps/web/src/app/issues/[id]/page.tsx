"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Share2,
  ThumbsUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { issueApi } from "@/lib/api";

interface Response {
  _id: string;
  responseType: string;
  description: string;
  imageUrl?: string;
  mlVerification?: {
    resolved: boolean;
    confidence: number;
    analysis: string;
  };
  createdAt: string;
}

interface Issue {
  _id: string;
  issueType: string;
  description: string;
  imageUrl: string;
  status: string;
  address: {
    formatted: string;
    ward?: string;
    locality?: string;
    city?: string;
    state?: string;
  };
  location: {
    coordinates: [number, number];
  };
  municipality?: {
    _id: string;
    name: string;
    type: string;
    district: string;
    state: string;
    score: number;
  };
  mlClassification?: {
    label: string;
    confidence: number;
    severityScore: number;
    suggestedCategory: string;
  };
  responses: Response[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage Accumulation",
  drainage: "Drainage Issue",
  streetlight: "Street Light",
  road_damage: "Road Damage",
  water_supply: "Water Supply",
  sewage: "Sewage Problem",
  other: "Other",
};

const ISSUE_TYPE_ICONS: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  drainage: "🌊",
  streetlight: "💡",
  road_damage: "🛣️",
  water_supply: "💧",
  sewage: "🚽",
  other: "📋",
};

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; description: string }
> = {
  OPEN: {
    color: "destructive",
    label: "Open",
    description: "This issue has been reported and is awaiting action",
  },
  RESPONDED: {
    color: "secondary",
    label: "Responded",
    description: "Municipality has claimed resolution, pending verification",
  },
  VERIFIED: {
    color: "default",
    label: "Resolved",
    description: "Resolution has been verified by our ML system",
  },
  DISPUTED: {
    color: "destructive",
    label: "Disputed",
    description: "Resolution claim was not verified, issue remains open",
  },
  NEEDS_MANUAL_REVIEW: {
    color: "outline",
    label: "Under Review",
    description: "This case requires manual verification",
  },
};

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssue();
  }, [params.id]);

  const fetchIssue = async () => {
    try {
      const response = await issueApi.getById(params.id as string);
      setIssue(response.data);
    } catch (error) {
      console.error("Failed to fetch issue:", error);
      toast.error("Failed to load issue details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysOpen = () => {
    if (!issue) return 0;
    const endDate = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date();
    const startDate = new Date(issue.createdAt);
    return Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Civic Issue - ${
            ISSUE_TYPE_LABELS[issue?.issueType || "other"]
          }`,
          text: issue?.description,
          url,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 py-8">
        <div className="container max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Issue Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This issue may have been removed or the link is invalid.
            </p>
            <Button onClick={() => router.push("/map")}>Browse Issues</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.OPEN;
  const daysOpen = getDaysOpen();

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/map"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Link>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Issue Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Card */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={issue.imageUrl}
                  alt={issue.issueType}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge
                    variant={statusConfig.color as any}
                    className="text-sm"
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {ISSUE_TYPE_ICONS[issue.issueType] || "📋"}
                  </span>
                  <h1 className="text-2xl font-bold">
                    {ISSUE_TYPE_LABELS[issue.issueType] || issue.issueType}
                  </h1>
                </div>
                <p className="text-muted-foreground">{issue.description}</p>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
                <CardDescription>{statusConfig.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Reported */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 w-px bg-border mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Issue Reported</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(issue.createdAt)}
                      </p>
                      {issue.mlClassification && (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">ML Classification</p>
                          <p className="text-muted-foreground">
                            Category: {issue.mlClassification.suggestedCategory}
                          </p>
                          <p className="text-muted-foreground">
                            Severity: {issue.mlClassification.severityScore}/10
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Responses */}
                  {issue.responses.map((response, index) => (
                    <div key={response._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            response.mlVerification?.resolved
                              ? "bg-green-500"
                              : "bg-secondary"
                          } text-white`}
                        >
                          {response.mlVerification?.resolved ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        {index < issue.responses.length - 1 && (
                          <div className="flex-1 w-px bg-border mt-2" />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="font-medium">Municipality Response</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(response.createdAt)}
                        </p>
                        <p className="mt-2 text-sm">{response.description}</p>
                        {response.imageUrl && (
                          <div className="mt-2 relative h-32 w-48 rounded-lg overflow-hidden">
                            <Image
                              src={response.imageUrl}
                              alt="Response"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {response.mlVerification && (
                          <div
                            className={`mt-2 p-3 rounded-lg text-sm ${
                              response.mlVerification.resolved
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-medium">
                              {response.mlVerification.resolved ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">
                                    Verified as Resolved
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-red-700">
                                    Verification Failed
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1">
                              Confidence:{" "}
                              {(
                                response.mlVerification.confidence * 100
                              ).toFixed(0)}
                              %
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Resolved */}
                  {issue.resolvedAt && (
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">
                          Issue Resolved
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(issue.resolvedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{issue.address.formatted}</p>
                {issue.address.ward && (
                  <p className="text-sm text-muted-foreground">
                    Ward: {issue.address.ward}
                  </p>
                )}
                <Separator className="my-3" />
                <a
                  href={`https://www.google.com/maps?q=${issue.location.coordinates[1]},${issue.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  View on Google Maps
                  <ArrowLeft className="h-3 w-3 ml-1 rotate-[135deg]" />
                </a>
              </CardContent>
            </Card>

            {/* Municipality Card */}
            {issue.municipality && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Responsible Authority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{issue.municipality.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {issue.municipality.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {issue.municipality.district}, {issue.municipality.state}
                  </p>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Accountability Score
                    </span>
                    <span className="font-bold text-primary">
                      {issue.municipality.score.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      (issue.municipality.score / 15000) * 100
                    )}
                    className="mt-2"
                  />
                  <Link
                    href={`/leaderboard?municipality=${issue.municipality._id}`}
                    className="inline-flex items-center text-sm text-primary hover:underline mt-3"
                  >
                    View on Leaderboard
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Days {issue.resolvedAt ? "to Resolve" : "Open"}
                  </span>
                  <span className="font-medium">{daysOpen}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Responses
                  </span>
                  <span className="font-medium">{issue.responses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Issue ID
                  </span>
                  <span className="font-mono text-xs">
                    #{issue._id.slice(-8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
