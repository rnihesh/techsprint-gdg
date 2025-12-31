"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
  MessageSquare,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { municipalityApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

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
  };
  location: {
    coordinates: [number, number];
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
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  drainage: "Drainage",
  streetlight: "Street Light",
  road_damage: "Road Damage",
  water_supply: "Water Supply",
  sewage: "Sewage",
  other: "Other",
};

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: any }
> = {
  OPEN: { color: "destructive", label: "Open", icon: AlertTriangle },
  RESPONDED: { color: "secondary", label: "Responded", icon: MessageSquare },
  VERIFIED: { color: "default", label: "Verified", icon: CheckCircle },
  DISPUTED: { color: "destructive", label: "Disputed", icon: XCircle },
  NEEDS_MANUAL_REVIEW: {
    color: "outline",
    label: "Needs Review",
    icon: AlertTriangle,
  },
};

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Response form state
  const [responseDescription, setResponseDescription] = useState("");
  const [responseImage, setResponseImage] = useState<File | null>(null);
  const [responseImagePreview, setResponseImagePreview] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/municipality/login");
      return;
    }
    fetchIssue();
  }, [isAuthenticated, router, params.id]);

  const fetchIssue = async () => {
    try {
      const response = await municipalityApi.getIssueDetails(
        params.id as string
      );
      setIssue(response.data);
    } catch (error) {
      console.error("Failed to fetch issue:", error);
      toast.error("Failed to load issue details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResponseImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResponseImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseDescription.trim()) {
      toast.error("Please provide a response description");
      return;
    }

    if (!responseImage) {
      toast.error("Please upload an image showing the resolution");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("description", responseDescription);
      formData.append("responseType", "RESOLUTION_CLAIMED");
      formData.append("image", responseImage);

      await municipalityApi.respondToIssue(params.id as string, formData);

      toast.success("Response submitted successfully!", {
        description: "The image is being verified by our ML system.",
      });

      // Refresh issue data
      fetchIssue();

      // Reset form
      setResponseDescription("");
      setResponseImage(null);
      setResponseImagePreview(null);
    } catch (error: any) {
      console.error("Failed to submit response:", error);
      toast.error(error.response?.data?.error || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 p-8">
        <div className="container max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96" />
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
            <p className="text-muted-foreground">Issue not found</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container max-w-4xl py-8">
        <Link
          href="/municipality/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Issue Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="text-base">
                {ISSUE_TYPE_LABELS[issue.issueType] || issue.issueType}
              </Badge>
              <Badge variant={statusConfig.color as any}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {issue.mlClassification && (
                <Badge variant="secondary">
                  Severity: {issue.mlClassification.severityScore}/10
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">
              Issue #{issue._id.slice(-8)}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {issue.address.formatted}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(issue.createdAt)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={issue.imageUrl}
                  alt="Issue image"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{issue.description}</p>

                {issue.mlClassification && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      ML Classification
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Category: {issue.mlClassification.suggestedCategory}
                      </p>
                      <p>
                        Confidence:{" "}
                        {(issue.mlClassification.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response History */}
        {issue.responses && issue.responses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Response History</CardTitle>
              <CardDescription>
                {issue.responses.length} response(s) submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {issue.responses.map((response, index) => (
                  <div
                    key={response._id}
                    className={index > 0 ? "pt-6 border-t" : ""}
                  >
                    <div className="flex items-start gap-4">
                      {response.imageUrl && (
                        <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={response.imageUrl}
                            alt="Response image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {response.responseType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(response.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{response.description}</p>

                        {response.mlVerification && (
                          <div
                            className={`mt-2 p-3 rounded-lg ${
                              response.mlVerification.resolved
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {response.mlVerification.resolved ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">
                                    ML Verified as Resolved
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-red-700">
                                    ML Verification Failed
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">
                              Confidence:{" "}
                              {(
                                response.mlVerification.confidence * 100
                              ).toFixed(0)}
                              %
                            </p>
                            {response.mlVerification.analysis && (
                              <p className="text-xs mt-1">
                                {response.mlVerification.analysis}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Form */}
        {issue.status === "OPEN" || issue.status === "DISPUTED" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Submit Resolution Response
              </CardTitle>
              <CardDescription>
                Upload an image showing the issue has been resolved. Our ML
                system will verify the resolution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitResponse} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Response Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work done to resolve this issue..."
                    value={responseDescription}
                    onChange={(e) => setResponseDescription(e.target.value)}
                    rows={4}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resolution Image *</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="response-image"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          submitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        {responseImagePreview ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={responseImagePreview}
                              alt="Preview"
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload image
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        )}
                        <input
                          id="response-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={submitting}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    📸 Image Guidelines for Verification
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      • Take the photo from the same angle as the original issue
                    </li>
                    <li>• Ensure good lighting and clear visibility</li>
                    <li>
                      • Show the complete area where the issue was present
                    </li>
                    <li>• Include surrounding landmarks for reference</li>
                  </ul>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>This issue has been resolved and verified.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
