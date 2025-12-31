"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  List,
  Filter,
  Clock,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { issueApi } from "@/lib/api";

interface Issue {
  _id: string;
  issueType: string;
  description: string;
  imageUrl: string;
  status: string;
  address: {
    formatted: string;
    ward?: string;
  };
  location: {
    coordinates: [number, number];
  };
  createdAt: string;
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

const ISSUE_TYPE_COLORS: Record<string, string> = {
  pothole: "#EF4444",
  garbage: "#F59E0B",
  drainage: "#3B82F6",
  streetlight: "#8B5CF6",
  road_damage: "#EC4899",
  water_supply: "#06B6D4",
  sewage: "#84CC16",
  other: "#6B7280",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "destructive",
  RESPONDED: "secondary",
  VERIFIED: "default",
};

// Default center (India)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function MapPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, typeFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;

      const response = await issueApi.list(params);
      setIssues(response.data.issues);

      // Center map on first issue if available
      if (response.data.issues.length > 0) {
        const firstIssue = response.data.issues[0];
        setMapCenter({
          lng: firstIssue.location.coordinates[0],
          lat: firstIssue.location.coordinates[1],
        });
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  // Group issues by type for legend
  const issuesByType = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      counts[issue.issueType] = (counts[issue.issueType] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [issues]);

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Issue Map</h1>
            <p className="text-muted-foreground">
              View all reported civic issues across India
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="RESPONDED">Responded</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-none"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-150 w-full" />
        ) : viewMode === "map" ? (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Map Container */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <div className="relative h-150 bg-muted flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Interactive Map
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your Google Maps API key in the environment
                      variables to enable the interactive map.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {issues.length} issues found in the current view
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {issuesByType.slice(0, 5).map(([type, count]) => (
                        <Badge
                          key={type}
                          variant="outline"
                          style={{
                            borderColor: ISSUE_TYPE_COLORS[type],
                            color: ISSUE_TYPE_COLORS[type],
                          }}
                        >
                          {ISSUE_TYPE_LABELS[type]}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(ISSUE_TYPE_LABELS).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: ISSUE_TYPE_COLORS[type] }}
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selectedIssue && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Selected Issue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                      <Image
                        src={selectedIssue.imageUrl}
                        alt={selectedIssue.issueType}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {ISSUE_TYPE_LABELS[selectedIssue.issueType]}
                    </Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedIssue.description}
                    </p>
                    <Link href={`/issues/${selectedIssue._id}`}>
                      <Button size="sm" className="w-full mt-3">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>No issues found matching your filters</p>
                </CardContent>
              </Card>
            ) : (
              issues.map((issue) => (
                <Link key={issue._id} href={`/issues/${issue._id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <div className="relative aspect-video">
                      <Image
                        src={issue.imageUrl}
                        alt={issue.issueType}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <Badge
                        className="absolute top-2 right-2"
                        variant={
                          (STATUS_COLORS[issue.status] as any) || "outline"
                        }
                      >
                        {issue.status}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: ISSUE_TYPE_COLORS[issue.issueType],
                          }}
                        />
                        <CardTitle className="text-base">
                          {ISSUE_TYPE_LABELS[issue.issueType] ||
                            issue.issueType}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {issue.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {issue.address.formatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getDaysAgo(issue.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
