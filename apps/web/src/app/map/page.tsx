"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { issuesApi } from "@/lib/api";
import {
  MapPin,
  Filter,
  List,
  Map as MapIcon,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Dynamically import Google Maps to avoid SSR issues
const GoogleMapComponent = dynamic(
  () =>
    import("@/components/map/GoogleMap").then((mod) => mod.GoogleMapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface Issue {
  id: string;
  description: string;
  type: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  municipalityId: string;
}

const issueTypes = [
  { value: "all", label: "All Types" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "DRAINAGE", label: "Drainage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "ROAD_DAMAGE", label: "Road Damage" },
  { value: "WATER_SUPPLY", label: "Water Supply" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "RESPONDED", label: "Responded" },
  { value: "VERIFIED", label: "Verified" },
  { value: "NEEDS_MANUAL_REVIEW", label: "Under Review" },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "RESPONDED":
      return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    case "VERIFIED":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "NEEDS_MANUAL_REVIEW":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    OPEN: "secondary",
    RESPONDED: "outline",
    VERIFIED: "default",
    NEEDS_MANUAL_REVIEW: "destructive",
  };
  const labels: Record<string, string> = {
    OPEN: "Open",
    RESPONDED: "Responded",
    VERIFIED: "Verified",
    NEEDS_MANUAL_REVIEW: "Under Review",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  );
};

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    POTHOLE: "bg-orange-100 text-orange-800",
    GARBAGE: "bg-green-100 text-green-800",
    DRAINAGE: "bg-blue-100 text-blue-800",
    STREETLIGHT: "bg-yellow-100 text-yellow-800",
    ROAD_DAMAGE: "bg-red-100 text-red-800",
    WATER_SUPPLY: "bg-cyan-100 text-cyan-800",
    OTHER: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        colors[type] || colors.OTHER
      }`}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
};

export default function MapPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
  });
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const statusFilters =
          filters.status !== "all" ? [filters.status] : undefined;
        const typeFilters = filters.type !== "all" ? [filters.type] : undefined;

        const result = await issuesApi.getAll({
          status: statusFilters,
          type: typeFilters,
        });

        if (result.success && result.data?.items) {
          setIssues(result.data.items as Issue[]);
        } else {
          setError(result.error || "Failed to fetch issues");
          setIssues([]);
        }
      } catch (err) {
        console.error("Error fetching issues:", err);
        setError("Network error. Please try again.");
        setIssues([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [filters]);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.location.address
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false);
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Filters Bar */}
        <div className="border-b bg-background sticky top-16 z-40">
          <div className="container px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-none"
                  >
                    <MapIcon className="h-4 w-4 mr-1" />
                    Map
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {viewMode === "map" ? (
            /* Map View */
            <div className="relative h-[calc(100vh-12rem)]">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center space-y-4">
                    <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              ) : (
                <>
                  <GoogleMapComponent issues={filteredIssues} />
                  {/* Issue count overlay */}
                  <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg z-10">
                    <p className="text-sm font-medium">
                      {filteredIssues.length} issues found
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg z-10">
                    <p className="text-xs font-medium mb-2">Status Legend</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Open</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Responded</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* List View */
            <div className="container px-4 py-6">
              <div className="grid gap-4">
                {isLoading ? (
                  Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <Skeleton className="h-20 w-20 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-1/4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : filteredIssues.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No issues found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search query
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredIssues.map((issue) => (
                    <Card
                      key={issue.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Thumbnail placeholder */}
                          <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold truncate">
                                {issue.description.slice(0, 50)}
                                {issue.description.length > 50 ? "..." : ""}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {getStatusIcon(issue.status)}
                                {getStatusBadge(issue.status)}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                              {getTypeBadge(issue.type)}
                              <span>•</span>
                              <span>{issue.createdAt}</span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {issue.location.address ||
                                  `${issue.location.latitude}, ${issue.location.longitude}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
