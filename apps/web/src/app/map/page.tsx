"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Filter,
  List,
  Map as MapIcon,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

// Mock data for issues
const mockIssues = [
  {
    id: "1",
    title: "Large pothole on MG Road",
    type: "pothole",
    severity: "high",
    status: "pending",
    location: { lat: 12.9716, lng: 77.5946, address: "MG Road, Bangalore" },
    createdAt: "2024-01-15",
    municipality: "BBMP",
  },
  {
    id: "2",
    title: "Garbage not collected for 3 days",
    type: "garbage",
    severity: "medium",
    status: "in_progress",
    location: { lat: 12.9352, lng: 77.6245, address: "Koramangala, Bangalore" },
    createdAt: "2024-01-14",
    municipality: "BBMP",
  },
  {
    id: "3",
    title: "Streetlight not working",
    type: "streetlight",
    severity: "low",
    status: "resolved",
    location: { lat: 12.9698, lng: 77.7500, address: "Whitefield, Bangalore" },
    createdAt: "2024-01-10",
    municipality: "BBMP",
  },
  {
    id: "4",
    title: "Drainage overflow causing flooding",
    type: "drainage",
    severity: "critical",
    status: "pending",
    location: { lat: 12.9850, lng: 77.6050, address: "Indiranagar, Bangalore" },
    createdAt: "2024-01-16",
    municipality: "BBMP",
  },
];

const issueTypes = [
  { value: "all", label: "All Types" },
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage" },
  { value: "drainage", label: "Drainage" },
  { value: "streetlight", label: "Streetlight" },
  { value: "road_damage", label: "Road Damage" },
  { value: "water_supply", label: "Water Supply" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "acknowledged":
    case "in_progress":
      return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    acknowledged: "outline",
    in_progress: "default",
    resolved: "default",
    rejected: "destructive",
  };
  return (
    <Badge variant={variants[status] || "secondary"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
};

const getSeverityBadge = (severity: string) => {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[severity]}`}>
      {severity}
    </span>
  );
};

export default function MapPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
  });
  const [issues, setIssues] = useState(mockIssues);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filters.type === "all" || issue.type === filters.type;
    const matchesStatus = filters.status === "all" || issue.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
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
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
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
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 flex items-center justify-center">
                  <Card className="max-w-md text-center">
                    <CardHeader>
                      <MapPin className="h-12 w-12 mx-auto text-primary mb-4" />
                      <CardTitle>Interactive Map</CardTitle>
                      <CardDescription>
                        Map integration requires Mapbox or Google Maps API key. Configure
                        your API keys in the environment variables to enable the interactive
                        map view.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Found <strong>{filteredIssues.length}</strong> issues in view
                      </p>
                      <Button variant="outline" onClick={() => setViewMode("list")}>
                        <List className="h-4 w-4 mr-2" />
                        Switch to List View
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Issue count overlay */}
              <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium">
                  {filteredIssues.length} issues found
                </p>
              </div>
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
                      <h3 className="text-lg font-semibold mb-2">No issues found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search query
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredIssues.map((issue) => (
                    <Card key={issue.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Thumbnail placeholder */}
                          <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold truncate">{issue.title}</h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {getStatusIcon(issue.status)}
                                {getStatusBadge(issue.status)}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                              <span className="capitalize">{issue.type}</span>
                              <span>•</span>
                              {getSeverityBadge(issue.severity)}
                              <span>•</span>
                              <span>{issue.createdAt}</span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{issue.location.address}</span>
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
