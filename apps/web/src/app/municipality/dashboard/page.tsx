"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  TrendingUp,
  FileText,
  BarChart3,
  ChevronRight,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { municipalityApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

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
  createdAt: string;
}

interface Stats {
  municipality: {
    name: string;
    score: number;
    type: string;
  };
  stats: {
    totalIssues: number;
    openIssues: number;
    respondedIssues: number;
    verifiedIssues: number;
    resolutionRate: string;
    avgResolutionTimeDays: number;
  };
  issuesByType: Array<{ type: string; count: number }>;
  recentIssues: Issue[];
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

const STATUS_COLORS: Record<string, string> = {
  OPEN: "destructive",
  RESPONDED: "secondary",
  VERIFIED: "default",
  DISPUTED: "destructive",
  NEEDS_MANUAL_REVIEW: "outline",
};

export default function MunicipalityDashboard() {
  const router = useRouter();
  const { user, municipality, isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/municipality/login");
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIssues();
    }
  }, [statusFilter, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, issuesRes] = await Promise.all([
        municipalityApi.getStats(),
        municipalityApi.getIssues({ limit: "10", status: "OPEN" }),
      ]);
      setStats(statsRes.data);
      setIssues(issuesRes.data.issues);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const params: Record<string, string> = { limit: "10" };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await municipalityApi.getIssues(params);
      setIssues(response.data.issues);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/");
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">{municipality?.name}</h1>
              <p className="text-xs text-muted-foreground">
                {municipality?.district}, {municipality?.state}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              Welcome, {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Municipality Score
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {stats.municipality.score.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Base: 10,000 points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Open Issues
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.stats.openIssues}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Resolved
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.stats.verifiedIssues}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.stats.resolutionRate}% resolution rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Resolution Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.stats.avgResolutionTimeDays} days
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      100 - stats.stats.avgResolutionTimeDays * 3
                    )}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Issues Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Issues List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Civic Issues
                      </CardTitle>
                      <CardDescription>
                        Issues reported in your jurisdiction
                      </CardDescription>
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40">
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {issues.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No issues found
                      </p>
                    ) : (
                      issues.map((issue) => (
                        <Link
                          key={issue._id}
                          href={`/municipality/issues/${issue._id}`}
                          className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={issue.imageUrl}
                              alt={issue.issueType}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">
                                {ISSUE_TYPE_LABELS[issue.issueType] ||
                                  issue.issueType}
                              </Badge>
                              <Badge
                                variant={
                                  (STATUS_COLORS[issue.status] as any) ||
                                  "outline"
                                }
                              >
                                {issue.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {issue.address.formatted}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getDaysAgo(issue.createdAt)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                        </Link>
                      ))
                    )}
                  </div>
                  <Separator className="my-4" />
                  <Link href="/municipality/issues">
                    <Button variant="outline" className="w-full">
                      View All Issues
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Issues by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Issues by Type
                  </CardTitle>
                  <CardDescription>
                    Distribution of issues in your area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.issuesByType.map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {ISSUE_TYPE_LABELS[item.type] || item.type}
                          </span>
                          <span className="text-muted-foreground">
                            {item.count}
                          </span>
                        </div>
                        <Progress
                          value={(item.count / stats.stats.totalIssues) * 100}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Failed to load dashboard data. Please try again.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
