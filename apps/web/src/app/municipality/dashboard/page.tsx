"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  MapPin,
  Camera,
  MessageSquare,
  TrendingUp,
  BarChart3,
  XCircle,
  Eye,
} from "lucide-react";

// Mock data
const mockStats = {
  totalIssues: 2100,
  pending: 380,
  inProgress: 245,
  resolved: 1350,
  rejected: 125,
  avgResponseTime: 48,
  score: 82,
  rank: 4,
};

const mockIssues = [
  {
    id: "1",
    title: "Large pothole on MG Road causing accidents",
    type: "pothole",
    severity: "critical",
    status: "pending",
    location: "MG Road, near Brigade Junction",
    createdAt: "2024-01-16T10:30:00Z",
    description: "A large pothole approximately 2 feet wide has formed on MG Road. Multiple vehicles have been damaged and it poses a serious safety risk.",
    images: [],
    daysOpen: 2,
  },
  {
    id: "2",
    title: "Garbage accumulation in residential area",
    type: "garbage",
    severity: "high",
    status: "in_progress",
    location: "4th Block, Koramangala",
    createdAt: "2024-01-14T08:15:00Z",
    description: "Garbage has not been collected for 5 days. The pile is growing and causing health concerns.",
    images: [],
    daysOpen: 4,
    response: {
      message: "Cleaning crew has been dispatched. Expected completion by evening.",
      respondedAt: "2024-01-15T14:00:00Z",
    },
  },
  {
    id: "3",
    title: "Broken streetlight creating dark zone",
    type: "streetlight",
    severity: "medium",
    status: "pending",
    location: "HSR Layout Sector 2",
    createdAt: "2024-01-12T19:45:00Z",
    description: "Streetlight has been non-functional for over a week. The area becomes very dark at night.",
    images: [],
    daysOpen: 6,
  },
  {
    id: "4",
    title: "Drainage overflow during light rain",
    type: "drainage",
    severity: "high",
    status: "acknowledged",
    location: "Silk Board Junction",
    createdAt: "2024-01-10T16:20:00Z",
    description: "Storm drains are blocked causing water logging even during light rain. Traffic disruption and property damage.",
    images: [],
    daysOpen: 8,
  },
];

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
    acknowledged: { variant: "outline", icon: <Eye className="h-3 w-3 mr-1" /> },
    in_progress: { variant: "default", icon: <TrendingUp className="h-3 w-3 mr-1" /> },
    resolved: { variant: "default", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    rejected: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
  };
  const { variant, icon } = config[status] || config.pending;
  return (
    <Badge variant={variant} className="capitalize">
      {icon}
      {status.replace("_", " ")}
    </Badge>
  );
};

const getSeverityBadge = (severity: string) => {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[severity]}`}>
      {severity}
    </span>
  );
};

export default function MunicipalityDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<typeof mockIssues[0] | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssues = mockIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && issue.status === "pending") ||
      (activeTab === "in_progress" && (issue.status === "in_progress" || issue.status === "acknowledged")) ||
      (activeTab === "resolved" && issue.status === "resolved");
    return matchesSearch && matchesTab;
  });

  const handleRespond = async () => {
    if (!selectedIssue || !responseText.trim()) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Response submitted successfully!");
      setResponseText("");
      setSelectedIssue(null);
    } catch {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container px-4 py-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                Municipality Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Bruhat Bengaluru Mahanagara Palike (BBMP)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-4 py-2">
                Rank #{mockStats.rank}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{mockStats.score}%</div>
                <div className="text-sm text-muted-foreground">Performance Score</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Issues</p>
                    <p className="text-2xl font-bold">{mockStats.totalIssues}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{mockStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{mockStats.inProgress}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Resolved</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{mockStats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{mockStats.avgResponseTime}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your municipality's performance metrics for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resolution Rate</span>
                    <span className="font-medium">{((mockStats.resolved / mockStats.totalIssues) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(mockStats.resolved / mockStats.totalIssues) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time Score</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Citizen Satisfaction</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Reported Issues</CardTitle>
                  <CardDescription>Manage and respond to citizen complaints</CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">
                    Pending ({mockStats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress">
                    In Progress ({mockStats.inProgress})
                  </TabsTrigger>
                  <TabsTrigger value="resolved">
                    Resolved ({mockStats.resolved})
                  </TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex gap-4">
                            <Skeleton className="h-16 w-16 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-1/3" />
                            </div>
                          </div>
                        </div>
                      ))
                  ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No issues found</h3>
                      <p className="text-muted-foreground">
                        {activeTab === "pending"
                          ? "Great job! No pending issues to address."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold">{issue.title}</h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {getSeverityBadge(issue.severity)}
                                {getStatusBadge(issue.status)}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {issue.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {issue.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {issue.daysOpen} days ago
                              </span>
                              <span className="capitalize">{issue.type}</span>
                            </div>

                            {issue.response && (
                              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Response: </span>
                                <span className="text-blue-600 dark:text-blue-400">{issue.response.message}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 shrink-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedIssue(issue)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Respond
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Respond to Issue</DialogTitle>
                                  <DialogDescription>
                                    Provide an official response to this citizen complaint.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="p-3 bg-muted rounded-lg">
                                    <h4 className="font-medium mb-1">{issue.title}</h4>
                                    <p className="text-sm text-muted-foreground">{issue.location}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="response">Your Response</Label>
                                    <Textarea
                                      id="response"
                                      placeholder="Describe the action being taken..."
                                      rows={4}
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Attach Resolution Photos (optional)</Label>
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                      <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        Upload before/after photos
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      className="flex-1"
                                      onClick={handleRespond}
                                      disabled={isSubmitting || !responseText.trim()}
                                    >
                                      {isSubmitting ? "Submitting..." : "Submit Response"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
