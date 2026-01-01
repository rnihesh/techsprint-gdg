"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { AdminOnly } from "@/components/auth/ProtectedRoute";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  MapPin,
  Shield,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalMunicipalities: number;
  totalIssues: number;
  pendingRegistrations: number;
  issuesByStatus: {
    OPEN: number;
    RESPONDED: number;
    VERIFIED: number;
    NEEDS_MANUAL_REVIEW: number;
  };
}

interface Municipality {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  score: number;
  totalIssues: number;
  resolvedIssues: number;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  municipalityName: string;
  state: string;
  district: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  municipalityId?: string;
  createdAt: string;
}

function AdminDashboardContent() {
  const { getToken, userProfile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state for creating municipality
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "MUNICIPALITY",
    state: "",
    district: "",
    north: "",
    south: "",
    east: "",
    west: "",
  });

  // Rejection dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    registrationId: string;
    reason: string;
  }>({
    open: false,
    registrationId: "",
    reason: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch stats
      const statsRes = await fetch("http://localhost:3001/api/admin/stats", {
        headers,
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      // Fetch municipalities
      const muniRes = await fetch(
        "http://localhost:3001/api/admin/municipalities",
        { headers }
      );
      if (muniRes.ok) {
        const muniData = await muniRes.json();
        if (muniData.success) setMunicipalities(muniData.data.items || []);
      }

      // Fetch pending registrations
      const regRes = await fetch(
        "http://localhost:3001/api/admin/registrations?status=PENDING",
        { headers }
      );
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success) setRegistrations(regData.data.items || []);
      }

      // Fetch users
      const usersRes = await fetch("http://localhost:3001/api/admin/users", {
        headers,
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data.items || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMunicipality = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        "http://localhost:3001/api/admin/municipalities",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: createForm.name,
            type: createForm.type,
            state: createForm.state,
            district: createForm.district,
            bounds: {
              north: parseFloat(createForm.north) || 0,
              south: parseFloat(createForm.south) || 0,
              east: parseFloat(createForm.east) || 0,
              west: parseFloat(createForm.west) || 0,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Municipality created successfully");
        setShowCreateDialog(false);
        setCreateForm({
          name: "",
          type: "MUNICIPALITY",
          state: "",
          district: "",
          north: "",
          south: "",
          east: "",
          west: "",
        });
        fetchData();
      } else {
        toast.error(data.error || "Failed to create municipality");
      }
    } catch (error) {
      console.error("Error creating municipality:", error);
      toast.error("Failed to create municipality");
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `http://localhost:3001/api/admin/registrations/${registrationId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Registration approved");
        fetchData();
      } else {
        toast.error(data.error || "Failed to approve registration");
      }
    } catch (error) {
      console.error("Error approving registration:", error);
      toast.error("Failed to approve registration");
    }
  };

  const handleRejectRegistration = async () => {
    if (!rejectDialog.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(
        `http://localhost:3001/api/admin/registrations/${rejectDialog.registrationId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectDialog.reason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Registration rejected");
        setRejectDialog({ open: false, registrationId: "", reason: "" });
        fetchData();
      } else {
        toast.error(data.error || "Failed to reject registration");
      }
    } catch (error) {
      console.error("Error rejecting registration:", error);
      toast.error("Failed to reject registration");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string, municipalityId?: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `http://localhost:3001/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role, municipalityId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("User role updated");
        fetchData();
      } else {
        toast.error(data.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage municipalities, users, and platform settings
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Municipalities
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalMunicipalities || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Issues
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalIssues || 0}</div>
            </CardContent>
          </Card>

          <Card className={stats?.pendingRegistrations ? "border-yellow-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Registrations
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pendingRegistrations || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issue Status Breakdown */}
        {stats?.issuesByStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Issue Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Open: {stats.issuesByStatus.OPEN}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Responded: {stats.issuesByStatus.RESPONDED}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Verified: {stats.issuesByStatus.VERIFIED}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Manual Review: {stats.issuesByStatus.NEEDS_MANUAL_REVIEW}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="municipalities">
              Municipalities
              {municipalities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {municipalities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="registrations">
              Registrations
              {registrations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {registrations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Municipalities Tab */}
          <TabsContent value="municipalities" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search municipalities..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Municipality
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Municipality</DialogTitle>
                    <DialogDescription>
                      Add a new municipality to the platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Municipality Name</Label>
                      <Input
                        placeholder="e.g., Municipal Corporation of Delhi"
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={createForm.type}
                          onValueChange={(value) =>
                            setCreateForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MUNICIPAL_CORPORATION">Municipal Corporation</SelectItem>
                            <SelectItem value="MUNICIPALITY">Municipality</SelectItem>
                            <SelectItem value="NAGAR_PANCHAYAT">Nagar Panchayat</SelectItem>
                            <SelectItem value="GRAM_PANCHAYAT">Gram Panchayat</SelectItem>
                            <SelectItem value="CANTONMENT_BOARD">Cantonment Board</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select
                          value={createForm.state}
                          onValueChange={(value) =>
                            setCreateForm((prev) => ({ ...prev, state: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input
                        placeholder="Enter district"
                        value={createForm.district}
                        onChange={(e) =>
                          setCreateForm((prev) => ({ ...prev, district: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jurisdiction Bounds (Coordinates)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="North (lat)"
                          value={createForm.north}
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, north: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="South (lat)"
                          value={createForm.south}
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, south: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="East (lng)"
                          value={createForm.east}
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, east: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="West (lng)"
                          value={createForm.west}
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, west: e.target.value }))
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Define the rectangular boundary for this municipality's jurisdiction
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMunicipality}>
                      Create Municipality
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {municipalities
                .filter(
                  (m) =>
                    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.district.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((municipality) => (
                  <Card key={municipality.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{municipality.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {municipality.district}, {municipality.state}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="text-xl font-bold text-primary">
                              {municipality.score}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Issues</p>
                            <p className="text-lg font-semibold">
                              {municipality.resolvedIssues}/{municipality.totalIssues}
                            </p>
                          </div>
                          <Badge>{municipality.type.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {municipalities.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Municipalities Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first municipality to get started
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Municipality
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Municipality Registrations</CardTitle>
                <CardDescription>
                  Review and approve municipality registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">
                      No pending registration requests
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{reg.municipalityName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {reg.district}, {reg.state}
                            </p>
                          </div>
                          <Badge
                            variant={
                              reg.status === "PENDING"
                                ? "secondary"
                                : reg.status === "APPROVED"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {reg.status}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <p>
                            <strong>Contact:</strong> {reg.name} ({reg.email})
                          </p>
                          <p>
                            <strong>Submitted:</strong>{" "}
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRegistration(reg.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setRejectDialog({
                                open: true,
                                registrationId: reg.id,
                                reason: "",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog
              open={rejectDialog.open}
              onOpenChange={(open) =>
                setRejectDialog((prev) => ({ ...prev, open }))
              }
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Registration</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this registration
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Rejection reason..."
                    value={rejectDialog.reason}
                    onChange={(e) =>
                      setRejectDialog((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setRejectDialog({ open: false, registrationId: "", reason: "" })
                    }
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleRejectRegistration}>
                    Reject Registration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => {
                            if (value === "municipality") {
                              // Would need to show a municipality selector
                              toast.info("Select a municipality to assign this user to");
                            } else {
                              handleUpdateUserRole(user.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="citizen">Citizen</SelectItem>
                            <SelectItem value="municipality">Municipality</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "destructive"
                              : user.role === "municipality"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Users Found</h3>
                      <p className="text-muted-foreground">
                        Users will appear here once they register
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations.length > 0 ? (
                    <div className="space-y-3">
                      {registrations.slice(0, 3).map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{reg.municipalityName}</p>
                            <p className="text-sm text-muted-foreground">
                              {reg.district}, {reg.state}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setActiveTab("registrations")}>
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      No pending actions
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resolution Rate</span>
                      <span className="font-semibold">
                        {stats?.totalIssues
                          ? Math.round(
                              ((stats.issuesByStatus?.VERIFIED || 0) / stats.totalIssues) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Municipalities</span>
                      <span className="font-semibold">{stats?.totalMunicipalities || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Open Issues</span>
                      <span className="font-semibold text-yellow-600">
                        {stats?.issuesByStatus?.OPEN || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminOnly>
      <AdminDashboardContent />
    </AdminOnly>
  );
}
