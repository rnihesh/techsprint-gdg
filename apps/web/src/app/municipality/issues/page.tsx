"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components/layout";
import { MunicipalityOnly } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertCircle,
  Search,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  RefreshCw,
  Filter,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { getOptimizedImageUrl, getThumbnailUrl } from "@/lib/cloudinary";

interface Issue {
  id: string;
  description: string;
  type: string;
  status: "OPEN" | "RESPONDED" | "VERIFIED" | "RESOLVED" | "REJECTED";
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrls?: string[];
  municipalityId?: string;
  municipalityResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 border-yellow-200",
  RESPONDED: "bg-blue-100 text-blue-800 border-blue-200",
  VERIFIED: "bg-purple-100 text-purple-800 border-purple-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const issueTypeLabels: Record<string, string> = {
  POTHOLE: "Pothole",
  GARBAGE: "Garbage",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
  ROAD_DAMAGE: "Road Damage",
  WATER_SUPPLY: "Water Supply",
  ENCROACHMENT: "Encroachment",
  SANITATION: "Sanitation",
  PARKS: "Parks & Gardens",
  OTHER: "Other",
};

export default function MunicipalityIssuesPage() {
  return (
    <MunicipalityOnly>
      <IssuesContent />
    </MunicipalityOnly>
  );
}

function IssuesContent() {
  const { getToken, userProfile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const params = new URLSearchParams();
      if (userProfile?.municipalityId) {
        params.append('municipalityId', userProfile.municipalityId);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/issues?${params}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data?.items) {
        setIssues(data.data.items);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [getToken, userProfile?.municipalityId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = 
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesType = typeFilter === "all" || issue.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRespond = async () => {
    if (!selectedIssue || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsResponding(true);
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/issues/${selectedIssue.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ response: responseText }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Response submitted successfully");
        setSelectedIssue(null);
        setResponseText("");
        fetchIssues();
      } else {
        toast.error(data.error || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error responding to issue:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsResponding(false);
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/issues/${issueId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Issue marked as ${newStatus.toLowerCase()}`);
        fetchIssues();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === "OPEN").length,
    responded: issues.filter(i => i.status === "RESPONDED").length,
    resolved: issues.filter(i => i.status === "RESOLVED").length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Issues in Your Area</h1>
              <p className="text-muted-foreground">
                View and respond to citizen complaints in your jurisdiction
              </p>
            </div>
            <Button onClick={fetchIssues} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.responded}</p>
                  <p className="text-sm text-muted-foreground">Responded</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="RESPONDED">Responded</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Issue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(issueTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-20 w-20 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No issues have been reported in your area yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="w-full md:w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {issue.imageUrls && issue.imageUrls.length > 0 ? (
                          <img
                            src={getThumbnailUrl(issue.imageUrls[0], 150)}
                            alt="Issue"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {issueTypeLabels[issue.type] || issue.type}
                            </Badge>
                            <Badge className={statusColors[issue.status]}>
                              {issue.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(issue.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm mb-3 line-clamp-2">
                          {issue.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {issue.location.address || 
                              `${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}
                          </span>
                        </div>

                        {issue.municipalityResponse && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Your Response:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {issue.municipalityResponse}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setResponseText(issue.municipalityResponse || "");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View & Respond
                          </Button>
                          {issue.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(issue.id, "RESPONDED")}
                              disabled={isUpdating}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Mark Responded
                            </Button>
                          )}
                          {(issue.status === "OPEN" || issue.status === "RESPONDED") && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateStatus(issue.id, "RESOLVED")}
                              disabled={isUpdating}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Response Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
            <DialogDescription>
              View issue details and submit your response
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-6">
              {/* Images */}
              {selectedIssue.imageUrls && selectedIssue.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedIssue.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={getOptimizedImageUrl(url, { width: 400 })}
                      alt={`Issue image ${i + 1}`}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">
                    {issueTypeLabels[selectedIssue.type] || selectedIssue.type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedIssue.description}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedIssue.location.address ||
                      `${selectedIssue.location.latitude}, ${selectedIssue.location.longitude}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported</Label>
                  <p>{formatDate(selectedIssue.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedIssue.status]}>
                    {selectedIssue.status}
                  </Badge>
                </div>
              </div>

              {/* Response Form */}
              <div className="space-y-2">
                <Label>Your Response</Label>
                <Textarea
                  placeholder="Enter your response to this issue..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIssue(null)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={isResponding}>
              {isResponding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Response"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
