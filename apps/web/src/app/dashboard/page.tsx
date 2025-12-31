"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  PieChart,
} from "lucide-react";
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
import { Navbar, Footer } from "@/components/layout";
import { issueApi, metaApi } from "@/lib/api";

interface Stats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  resolutionRate: string;
  issuesByType: Array<{ type: string; count: number }>;
  issuesByMonth: Array<{ year: number; month: number; count: number }>;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  drainage: "Drainage",
  streetlight: "Street Light",
  road_damage: "Road Damage",
  water_supply: "Water Supply",
  sewage: "Sewage",
  encroachment: "Encroachment",
  illegal_dumping: "Illegal Dumping",
  broken_footpath: "Broken Footpath",
  traffic_signal: "Traffic Signal",
  public_toilet: "Public Toilet",
  stray_animals: "Stray Animals",
  noise_pollution: "Noise Pollution",
  air_pollution: "Air Pollution",
  other: "Other",
};

const ISSUE_TYPE_COLORS: Record<string, string> = {
  pothole: "bg-red-500",
  garbage: "bg-green-500",
  drainage: "bg-blue-500",
  streetlight: "bg-yellow-500",
  road_damage: "bg-orange-500",
  water_supply: "bg-cyan-500",
  sewage: "bg-purple-500",
  encroachment: "bg-pink-500",
  illegal_dumping: "bg-lime-500",
  broken_footpath: "bg-indigo-500",
  traffic_signal: "bg-amber-500",
  public_toilet: "bg-teal-500",
  stray_animals: "bg-rose-500",
  noise_pollution: "bg-violet-500",
  air_pollution: "bg-gray-500",
  other: "bg-slate-500",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await issueApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[month - 1];
  };

  const maxMonthlyCount = stats?.issuesByMonth
    ? Math.max(...stats.issuesByMonth.map((m) => m.count))
    : 0;

  const totalByType = stats?.issuesByType
    ? stats.issuesByType.reduce((acc, item) => acc + item.count, 0)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Transparency Dashboard
              </h1>
              <p className="text-muted-foreground">
                Public data on civic issues and municipal performance across
                India
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Overview Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Issues
                    </CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalIssues.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reported across India
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
                      {stats.openIssues.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting resolution
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Resolved Issues
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.resolvedIssues.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verified as resolved
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Resolution Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {stats.resolutionRate}%
                    </div>
                    <Progress
                      value={parseFloat(stats.resolutionRate)}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                {/* Issues by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Issues by Type
                    </CardTitle>
                    <CardDescription>
                      Distribution of civic issues by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.issuesByType.slice(0, 8).map((item) => (
                        <div key={item.type} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {ISSUE_TYPE_LABELS[item.type] || item.type}
                            </span>
                            <span className="text-muted-foreground">
                              {item.count} (
                              {((item.count / totalByType) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                ISSUE_TYPE_COLORS[item.type] || "bg-slate-500"
                              }`}
                              style={{
                                width: `${(item.count / totalByType) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Monthly Trend
                    </CardTitle>
                    <CardDescription>
                      Issue submissions over the past 12 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.issuesByMonth
                        .slice(0, 12)
                        .reverse()
                        .map((item) => (
                          <div
                            key={`${item.year}-${item.month}`}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {getMonthName(item.month)} {item.year}
                              </span>
                              <span className="text-muted-foreground">
                                {item.count} issues
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${
                                    maxMonthlyCount > 0
                                      ? (item.count / maxMonthlyCount) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Status Breakdown
                  </CardTitle>
                  <CardDescription>
                    Current status of all reported issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="text-3xl font-bold text-red-600">
                        {stats.openIssues}
                      </div>
                      <div className="text-sm text-red-700">Open</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-3xl font-bold text-yellow-600">
                        {Math.round(
                          stats.totalIssues -
                            stats.openIssues -
                            stats.resolvedIssues
                        )}
                      </div>
                      <div className="text-sm text-yellow-700">In Progress</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-3xl font-bold text-green-600">
                        {stats.resolvedIssues}
                      </div>
                      <div className="text-sm text-green-700">Resolved</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.resolutionRate}%
                      </div>
                      <div className="text-sm text-blue-700">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Failed to load dashboard data. Please try again later.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
