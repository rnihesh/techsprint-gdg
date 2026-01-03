"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Trash2,
  Edit,
  Eye,
  ArrowLeft,
  Image,
  ArrowRight,
  Filter,
  List,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AdminStats {
  totalUsers: number;
  totalMunicipalities: number;
  totalIssues: number;
  pendingRegistrations: number;
  issuesByStatus: {
    OPEN: number;
    CLOSED: number;
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
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface Issue {
  id: string;
  type: string;
  description: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrls?: string[];
  createdAt: string;
  reportedBy: string;
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
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [initialParamsProcessed, setInitialParamsProcessed] = useState(false);

  // Pagination for municipalities
  const [muniPage, setMuniPage] = useState(1);
  const [muniTotalPages, setMuniTotalPages] = useState(1);
  const [muniTotal, setMuniTotal] = useState(0);
  const MUNI_PAGE_SIZE = 20;

  // Pagination for users
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const USER_PAGE_SIZE = 20;

  // User filters
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");

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

  // Delete municipality dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    municipality: Municipality | null;
  }>({
    open: false,
    municipality: null,
  });

  // Edit municipality dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    municipality: Municipality | null;
  }>({
    open: false,
    municipality: null,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    state: "",
    district: "",
    north: "",
    south: "",
    east: "",
    west: "",
  });

  // Municipality detail view (with issues)
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [municipalityIssues, setMunicipalityIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // All Issues state
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [allIssuesLoading, setAllIssuesLoading] = useState(false);
  const [allIssuesPage, setAllIssuesPage] = useState(1);
  const [allIssuesTotalPages, setAllIssuesTotalPages] = useState(1);
  const [allIssuesTotal, setAllIssuesTotal] = useState(0);
  const ALL_ISSUES_PAGE_SIZE = 20;
  const [issueSearchQuery, setIssueSearchQuery] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("all");
  const [issueMunicipalityFilter, setIssueMunicipalityFilter] = useState<string>("all");
  
  // All municipalities for filter (separate from paginated list)
  const [allMunicipalitiesForFilter, setAllMunicipalitiesForFilter] = useState<Municipality[]>([]);
  const [muniFilterSearch, setMuniFilterSearch] = useState("");

  // Edit Issue dialog
  const [editIssueDialog, setEditIssueDialog] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
  });
  const [editIssueForm, setEditIssueForm] = useState({
    description: "",
    status: "",
    type: "",
    address: "",
    latitude: "",
    longitude: "",
    imageUrls: [] as string[],
  });

  // Delete Issue dialog
  const [deleteIssueDialog, setDeleteIssueDialog] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
  });

  // View Issue dialog
  const [viewIssueDialog, setViewIssueDialog] = useState<{
    open: boolean;
    issue: Issue | null;
  }>({
    open: false,
    issue: null,
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
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers,
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }

      // Fetch municipalities with pagination
      await fetchMunicipalities(token, 1);
      
      // Fetch ALL municipalities for filter dropdown (up to 500)
      await fetchAllMunicipalitiesForFilter(token);

      // Fetch pending registrations
      const regRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations?status=PENDING`,
        { headers }
      );
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success) setRegistrations(regData.data.items || []);
      }

      // Fetch users with pagination
      await fetchUsers(token, 1);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch municipalities with pagination and search
  const fetchMunicipalities = async (token: string | null, page: number, search?: string) => {
    try {
      const tkn = token || await getToken();
      const searchParam = search !== undefined ? search : searchQuery;
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/municipalities`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", MUNI_PAGE_SIZE.toString());
      if (searchParam) {
        url.searchParams.set("search", searchParam);
      }

      const muniRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
      });
      if (muniRes.ok) {
        const muniData = await muniRes.json();
        if (muniData.success) {
          setMunicipalities(muniData.data.items || []);
          setMuniTotal(muniData.data.total || 0);
          setMuniTotalPages(Math.ceil((muniData.data.total || 0) / MUNI_PAGE_SIZE));
          setMuniPage(page);
        }
      }
    } catch (error) {
      console.error("Error fetching municipalities:", error);
    }
  };

  // Fetch ALL municipalities for filter dropdown (no pagination)
  const fetchAllMunicipalitiesForFilter = async (token: string | null) => {
    try {
      const tkn = token || await getToken();
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/municipalities`);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", "500"); // Get all municipalities

      const muniRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
      });
      if (muniRes.ok) {
        const muniData = await muniRes.json();
        if (muniData.success) {
          setAllMunicipalitiesForFilter(muniData.data.items || []);
        }
      }
    } catch (error) {
      console.error("Error fetching all municipalities for filter:", error);
    }
  };

  // Get filtered municipalities for dropdown
  const filteredMunicipalitiesForDropdown = allMunicipalitiesForFilter.filter((muni) =>
    muniFilterSearch.trim() === "" || 
    muni.name.toLowerCase().includes(muniFilterSearch.toLowerCase()) ||
    muni.state?.toLowerCase().includes(muniFilterSearch.toLowerCase()) ||
    muni.district?.toLowerCase().includes(muniFilterSearch.toLowerCase())
  );

  // Fetch users with pagination and filters
  const fetchUsers = async (token: string | null, page: number, search?: string, role?: string) => {
    try {
      const tkn = token || await getToken();
      const searchParam = search !== undefined ? search : userSearchQuery;
      const roleParam = role !== undefined ? role : userRoleFilter;
      
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", USER_PAGE_SIZE.toString());
      if (searchParam) {
        url.searchParams.set("search", searchParam);
      }
      if (roleParam && roleParam !== "all") {
        url.searchParams.set("role", roleParam);
      }

      const usersRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tkn}`,
          "Content-Type": "application/json",
        },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data.items || []);
          setUserTotal(usersData.data.total || 0);
          setUserTotalPages(Math.ceil((usersData.data.total || 0) / USER_PAGE_SIZE));
          setUserPage(page);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Handle municipality search
  const handleMuniSearch = (query: string) => {
    setSearchQuery(query);
    fetchMunicipalities(null, 1, query);
  };

  // Handle user search and filters
  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    fetchUsers(null, 1, query, userRoleFilter);
  };

  const handleUserRoleFilter = (role: string) => {
    setUserRoleFilter(role);
    fetchUsers(null, 1, userSearchQuery, role);
  };

  // Fetch all issues with filters
  const fetchAllIssues = async (
    page: number = 1,
    search?: string,
    status?: string,
    type?: string,
    municipalityId?: string
  ) => {
    setAllIssuesLoading(true);
    try {
      const token = await getToken();
      const searchParam = search !== undefined ? search : issueSearchQuery;
      const statusParam = status !== undefined ? status : issueStatusFilter;
      const typeParam = type !== undefined ? type : issueTypeFilter;
      const muniParam = municipalityId !== undefined ? municipalityId : issueMunicipalityFilter;
      
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/issues`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", ALL_ISSUES_PAGE_SIZE.toString());
      
      if (searchParam && searchParam.trim()) {
        url.searchParams.set("search", searchParam.trim());
      }
      if (statusParam && statusParam !== "all") {
        url.searchParams.set("status", statusParam);
      }
      if (typeParam && typeParam !== "all") {
        url.searchParams.set("type", typeParam);
      }
      if (muniParam && muniParam !== "all") {
        url.searchParams.set("municipalityId", muniParam);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setAllIssues(data.data?.items || []);
        setAllIssuesTotal(data.data?.total || 0);
        setAllIssuesTotalPages(Math.ceil((data.data?.total || 0) / ALL_ISSUES_PAGE_SIZE));
        setAllIssuesPage(page);
      }
    } catch (error) {
      console.error("Error fetching all issues:", error);
      toast.error("Failed to fetch issues");
    } finally {
      setAllIssuesLoading(false);
    }
  };

  // Handle issue search
  const handleIssueSearch = (query: string) => {
    setIssueSearchQuery(query);
    fetchAllIssues(1, query);
  };

  // Handle issue status filter
  const handleIssueStatusFilter = (status: string) => {
    setIssueStatusFilter(status);
    fetchAllIssues(1, issueSearchQuery, status);
  };

  // Handle issue type filter
  const handleIssueTypeFilter = (type: string) => {
    setIssueTypeFilter(type);
    fetchAllIssues(1, issueSearchQuery, issueStatusFilter, type);
  };

  // Handle issue municipality filter
  const handleIssueMunicipalityFilter = (municipalityId: string) => {
    setIssueMunicipalityFilter(municipalityId);
    fetchAllIssues(1, issueSearchQuery, issueStatusFilter, issueTypeFilter, municipalityId);
  };

  // Open edit issue dialog
  const openEditIssueDialog = (issue: Issue) => {
    setEditIssueForm({
      description: issue.description,
      status: issue.status,
      type: issue.type,
      address: issue.location?.address || "",
      latitude: issue.location?.latitude?.toString() || "",
      longitude: issue.location?.longitude?.toString() || "",
      imageUrls: issue.imageUrls || [],
    });
    setEditIssueDialog({ open: true, issue });
  };

  // Handle edit issue
  const handleEditIssue = async () => {
    if (!editIssueDialog.issue) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${editIssueDialog.issue.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: editIssueForm.description,
            status: editIssueForm.status,
            type: editIssueForm.type,
            location: {
              address: editIssueForm.address,
              latitude: parseFloat(editIssueForm.latitude) || 0,
              longitude: parseFloat(editIssueForm.longitude) || 0,
            },
            imageUrls: editIssueForm.imageUrls,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Issue updated successfully");
        setEditIssueDialog({ open: false, issue: null });
        fetchAllIssues(allIssuesPage);
        fetchData();
      } else {
        toast.error(data.error || "Failed to update issue");
      }
    } catch (error) {
      console.error("Error updating issue:", error);
      toast.error("Failed to update issue");
    }
  };

  // Handle delete issue from all issues tab
  const handleDeleteIssueFromAll = async () => {
    if (!deleteIssueDialog.issue) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${deleteIssueDialog.issue.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Issue deleted successfully");
        setDeleteIssueDialog({ open: false, issue: null });
        fetchAllIssues(allIssuesPage);
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete issue");
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error("Failed to delete issue");
    }
  };

  // Issue types constant
  const issueTypes = [
    "POTHOLE",
    "GARBAGE",
    "GRAFFITI",
    "ILLEGAL_PARKING",
    "DEAD_ANIMAL",
    "FALLEN_TREE",
    "DAMAGED_ROAD_SIGN",
    "DAMAGED_ELECTRICAL_POLE",
    "DAMAGED_CONCRETE",
    "OTHER",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL query params for deep linking
  useEffect(() => {
    if (!loading && !initialParamsProcessed) {
      const tab = searchParams.get("tab");
      const municipality = searchParams.get("municipality");
      
      if (tab === "issues") {
        setActiveTab("issues");
        if (municipality) {
          setIssueMunicipalityFilter(municipality);
          fetchAllIssues(1, "", "all", "all", municipality);
        } else {
          fetchAllIssues(1);
        }
      }
      setInitialParamsProcessed(true);
    }
  }, [loading, initialParamsProcessed, searchParams]);

  const handleCreateMunicipality = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/municipalities`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/${registrationId}/approve`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/${rejectDialog.registrationId}/reject`,
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

  const handleUpdateUserRole = async (
    userId: string,
    role: string,
    municipalityId?: string
  ) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`,
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

  // Delete municipality handler
  const handleDeleteMunicipality = async () => {
    if (!deleteDialog.municipality) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/municipalities/${deleteDialog.municipality.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Municipality deleted successfully");
        setDeleteDialog({ open: false, municipality: null });
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete municipality");
      }
    } catch (error) {
      console.error("Error deleting municipality:", error);
      toast.error("Failed to delete municipality");
    }
  };

  // Edit municipality handler
  const handleEditMunicipality = async () => {
    if (!editDialog.municipality) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/municipalities/${editDialog.municipality.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            type: editForm.type,
            state: editForm.state,
            district: editForm.district,
            bounds: {
              north: parseFloat(editForm.north) || 0,
              south: parseFloat(editForm.south) || 0,
              east: parseFloat(editForm.east) || 0,
              west: parseFloat(editForm.west) || 0,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Municipality updated successfully");
        setEditDialog({ open: false, municipality: null });
        fetchData();
      } else {
        toast.error(data.error || "Failed to update municipality");
      }
    } catch (error) {
      console.error("Error updating municipality:", error);
      toast.error("Failed to update municipality");
    }
  };

  // Open edit dialog with municipality data
  const openEditDialog = (municipality: Municipality) => {
    setEditForm({
      name: municipality.name,
      type: municipality.type,
      state: municipality.state,
      district: municipality.district,
      north: municipality.bounds?.north?.toString() || "",
      south: municipality.bounds?.south?.toString() || "",
      east: municipality.bounds?.east?.toString() || "",
      west: municipality.bounds?.west?.toString() || "",
    });
    setEditDialog({ open: true, municipality });
  };

  // Fetch issues for a municipality
  const fetchMunicipalityIssues = async (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setIssuesLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/issues?municipalityId=${municipality.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMunicipalityIssues(data.data?.items || []);
      } else {
        toast.error("Failed to fetch issues");
        setMunicipalityIssues([]);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to fetch issues");
      setMunicipalityIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  // Delete issue handler
  const handleDeleteIssue = async (issueId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${issueId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Issue deleted successfully");
        if (selectedMunicipality) {
          fetchMunicipalityIssues(selectedMunicipality);
        }
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete issue");
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error("Failed to delete issue");
    }
  };

  // Update issue status handler
  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/issues/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Issue status updated");
        if (selectedMunicipality) {
          fetchMunicipalityIssues(selectedMunicipality);
        }
        fetchData();
      } else {
        toast.error(data.error || "Failed to update issue status");
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
      toast.error("Failed to update issue status");
    }
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
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
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage municipalities, users, and platform settings
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Municipalities
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {stats?.totalMunicipalities || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Issues
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {stats?.totalIssues || 0}
              </div>
            </CardContent>
          </Card>

          <Card
            className={stats?.pendingRegistrations ? "border-yellow-500" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Pending Registrations
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {stats?.pendingRegistrations || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issue Status Breakdown */}
        {stats?.issuesByStatus && (
          <Card className="mb-6 md:mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">Issue Status Breakdown</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setActiveTab("issues");
                  fetchAllIssues(1);
                }}
                className="text-primary"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
                  onClick={() => {
                    setActiveTab("issues");
                    setIssueStatusFilter("OPEN");
                    fetchAllIssues(1, "", "OPEN");
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-xs md:text-sm">
                    Open: {stats.issuesByStatus.OPEN}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </div>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
                  onClick={() => {
                    setActiveTab("issues");
                    setIssueStatusFilter("CLOSED");
                    fetchAllIssues(1, "", "CLOSED");
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-xs md:text-sm">
                    Closed: {stats.issuesByStatus.CLOSED || 0}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full flex-wrap h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="municipalities" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Municipalities</span>
              <span className="sm:hidden">Munis</span>
              {muniTotal > 0 && (
                <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
                  {muniTotal}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="registrations" className="text-xs md:text-sm">
              <span className="hidden sm:inline">Registrations</span>
              <span className="sm:hidden">Regs</span>
              {registrations.length > 0 && (
                <Badge variant="destructive" className="ml-1 md:ml-2 text-xs">
                  {registrations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              Users
              {userTotal > 0 && (
                <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
                  {userTotal}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="issues" 
              className="text-xs md:text-sm"
              onClick={() => {
                if (allIssues.length === 0) {
                  fetchAllIssues(1);
                }
              }}
            >
              <span className="hidden sm:inline">All Issues</span>
              <span className="sm:hidden">Issues</span>
              {allIssuesTotal > 0 && (
                <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
                  {allIssuesTotal}
                </Badge>
              )}
            </TabsTrigger>
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
                    onChange={(e) => handleMuniSearch(e.target.value)}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Showing {municipalities.length} of {muniTotal}
                </span>
              </div>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
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
                          setCreateForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
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
                            <SelectItem value="MUNICIPAL_CORPORATION">
                              Municipal Corporation
                            </SelectItem>
                            <SelectItem value="MUNICIPALITY">
                              Municipality
                            </SelectItem>
                            <SelectItem value="NAGAR_PANCHAYAT">
                              Nagar Panchayat
                            </SelectItem>
                            <SelectItem value="GRAM_PANCHAYAT">
                              Gram Panchayat
                            </SelectItem>
                            <SelectItem value="CANTONMENT_BOARD">
                              Cantonment Board
                            </SelectItem>
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
                          setCreateForm((prev) => ({
                            ...prev,
                            district: e.target.value,
                          }))
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
                            setCreateForm((prev) => ({
                              ...prev,
                              north: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="South (lat)"
                          value={createForm.south}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              south: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="East (lng)"
                          value={createForm.east}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              east: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="West (lng)"
                          value={createForm.west}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              west: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Define the rectangular boundary for this municipality's
                        jurisdiction
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
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
              {municipalities.map((municipality) => (
                  <Card key={municipality.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => fetchMunicipalityIssues(municipality)}
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {municipality.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {municipality.district}, {municipality.state}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Score
                            </p>
                            <p className="text-xl font-bold text-primary">
                              {municipality.score}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Issues
                            </p>
                            <p className="text-lg font-semibold">
                              {municipality.resolvedIssues}/
                              {municipality.totalIssues}
                            </p>
                          </div>
                          <Badge>{municipality.type.replace(/_/g, " ")}</Badge>
                          <div className="flex items-center gap-2 ml-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => fetchMunicipalityIssues(municipality)}
                              title="View Issues"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(municipality)}
                              title="Edit Municipality"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteDialog({ open: true, municipality })}
                              title="Delete Municipality"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {municipalities.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">
                      No Municipalities Yet
                    </h3>
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

            {/* Pagination Controls */}
            {muniTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {muniPage} of {muniTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMunicipalities(null, muniPage - 1)}
                    disabled={muniPage <= 1}
                  >
                    Previous
                  </Button>
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, muniTotalPages) }, (_, i) => {
                      let pageNum;
                      if (muniTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (muniPage <= 3) {
                        pageNum = i + 1;
                      } else if (muniPage >= muniTotalPages - 2) {
                        pageNum = muniTotalPages - 4 + i;
                      } else {
                        pageNum = muniPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={muniPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => fetchMunicipalities(null, pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMunicipalities(null, muniPage + 1)}
                    disabled={muniPage >= muniTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
                            <h4 className="font-semibold">
                              {reg.municipalityName}
                            </h4>
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
                      setRejectDialog({
                        open: false,
                        registrationId: "",
                        reason: "",
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectRegistration}
                  >
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      View and manage platform users ({userTotal} total)
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 w-full sm:w-64"
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={userRoleFilter}
                      onValueChange={handleUserRoleFilter}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="citizen">Citizens</SelectItem>
                        <SelectItem value="municipality">Municipality</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-3">Joined</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors items-center"
                    >
                      {/* User Info */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {(user.displayName || user.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {user.displayName || "No Name"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="md:col-span-3 flex items-center gap-2">
                        <Badge
                          variant={
                            user.role === "admin" || user.role === "PLATFORM_MAINTAINER"
                              ? "destructive"
                              : user.role === "municipality" || user.role === "MUNICIPALITY_ADMIN"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.role === "PLATFORM_MAINTAINER" ? "Admin" : 
                           user.role === "MUNICIPALITY_ADMIN" ? "Municipality" :
                           user.role}
                        </Badge>
                        {user.municipalityId && (
                          <span className="text-xs text-muted-foreground">
                            (Assigned)
                          </span>
                        )}
                      </div>

                      {/* Joined Date */}
                      <div className="md:col-span-3 text-sm text-muted-foreground">
                        <span className="md:hidden font-medium">Joined: </span>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex justify-end">
                        <Select
                          value={user.role}
                          onValueChange={(value) => {
                            if (value === "municipality") {
                              toast.info(
                                "To assign as municipality admin, use the registration flow"
                              );
                            } else {
                              handleUpdateUserRole(user.id, value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Change role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="citizen">Citizen</SelectItem>
                            <SelectItem value="municipality">
                              Municipality
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Users Found</h3>
                      <p className="text-muted-foreground">
                        {userSearchQuery || userRoleFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Users will appear here once they register"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {userTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(userPage - 1) * USER_PAGE_SIZE + 1} -{" "}
                      {Math.min(userPage * USER_PAGE_SIZE, userTotal)} of{" "}
                      {userTotal} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userPage === 1}
                        onClick={() => fetchUsers(null, userPage - 1)}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, userTotalPages) }, (_, i) => {
                          let pageNum;
                          if (userTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (userPage <= 3) {
                            pageNum = i + 1;
                          } else if (userPage >= userTotalPages - 2) {
                            pageNum = userTotalPages - 4 + i;
                          } else {
                            pageNum = userPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={userPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => fetchUsers(null, pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userPage === userTotalPages}
                        onClick={() => fetchUsers(null, userPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        All Issues
                      </CardTitle>
                      <CardDescription>
                        View and manage all issues across all municipalities ({allIssuesTotal} total)
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchAllIssues(allIssuesPage)}
                      disabled={allIssuesLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${allIssuesLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search issues..."
                        className="pl-10"
                        value={issueSearchQuery}
                        onChange={(e) => handleIssueSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={issueStatusFilter}
                      onValueChange={handleIssueStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={issueTypeFilter}
                      onValueChange={handleIssueTypeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {issueTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={issueMunicipalityFilter}
                      onValueChange={(value) => {
                        handleIssueMunicipalityFilter(value);
                        setMuniFilterSearch(""); // Reset search when selecting
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by municipality" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-hidden">
                        <div className="p-2 border-b bg-background">
                          <Input
                            placeholder="Search municipalities..."
                            value={muniFilterSearch}
                            onChange={(e) => {
                              e.stopPropagation();
                              setMuniFilterSearch(e.target.value);
                            }}
                            className="h-8"
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              // Prevent select from capturing key events
                              if (e.key !== 'Escape') {
                                e.stopPropagation();
                              }
                            }}
                            onFocus={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-[220px] overflow-y-auto">
                          <SelectItem value="all">All Municipalities</SelectItem>
                          {filteredMunicipalitiesForDropdown.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                              No municipalities found
                            </div>
                          ) : (
                            filteredMunicipalitiesForDropdown.map((muni) => (
                              <SelectItem key={muni.id} value={muni.id}>
                                {muni.name}
                              </SelectItem>
                            ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {allIssuesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : allIssues.length > 0 ? (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                      <div className="col-span-3">Type</div>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {allIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors items-center"
                      >
                        {/* Type */}
                        <div className="lg:col-span-3">
                          <Badge variant="outline" className="capitalize">
                            {issue.type?.replace(/_/g, " ") || "Unknown"}
                          </Badge>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-3">
                          <p className="text-sm line-clamp-2">{issue.description}</p>
                          {issue.location?.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {issue.location.address}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="lg:col-span-2">
                          <Badge
                            variant={
                              issue.status === "OPEN"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {issue.status === "OPEN" ? (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {issue.status}
                          </Badge>
                        </div>

                        {/* Date */}
                        <div className="lg:col-span-2 text-sm text-muted-foreground">
                          <span className="lg:hidden font-medium">Reported: </span>
                          {issue.createdAt
                            ? new Date(issue.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Unknown"}
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-2 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewIssueDialog({ open: true, issue })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditIssueDialog(issue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteIssueDialog({ open: true, issue })}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Issues Found</h3>
                    <p className="text-muted-foreground">
                      {issueSearchQuery || issueStatusFilter !== "all" || issueTypeFilter !== "all" || issueMunicipalityFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "No issues have been reported yet"}
                    </p>
                  </div>
                )}

                {/* Pagination Controls */}
                {allIssuesTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(allIssuesPage - 1) * ALL_ISSUES_PAGE_SIZE + 1} -{" "}
                      {Math.min(allIssuesPage * ALL_ISSUES_PAGE_SIZE, allIssuesTotal)} of{" "}
                      {allIssuesTotal} issues
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={allIssuesPage === 1}
                        onClick={() => fetchAllIssues(allIssuesPage - 1)}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, allIssuesTotalPages) }, (_, i) => {
                          let pageNum;
                          if (allIssuesTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (allIssuesPage <= 3) {
                            pageNum = i + 1;
                          } else if (allIssuesPage >= allIssuesTotalPages - 2) {
                            pageNum = allIssuesTotalPages - 4 + i;
                          } else {
                            pageNum = allIssuesPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={allIssuesPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => fetchAllIssues(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={allIssuesPage === allIssuesTotalPages}
                        onClick={() => fetchAllIssues(allIssuesPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
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
                            <p className="font-medium">
                              {reg.municipalityName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reg.district}, {reg.state}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab("registrations")}
                          >
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
                      <span className="text-muted-foreground">
                        Resolution Rate
                      </span>
                      <span className="font-semibold">
                        {stats?.totalIssues
                          ? Math.round(
                              ((stats.issuesByStatus?.CLOSED || 0) /
                                stats.totalIssues) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Active Municipalities
                      </span>
                      <span className="font-semibold">
                        {stats?.totalMunicipalities || 0}
                      </span>
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

        {/* Delete Municipality Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, municipality: deleteDialog.municipality })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Municipality
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteDialog.municipality?.name}</strong>? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, municipality: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteMunicipality}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Municipality Dialog */}
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, municipality: editDialog.municipality })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Municipality</DialogTitle>
              <DialogDescription>
                Update municipality information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Municipality Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
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
                    value={editForm.state}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, state: value }))}
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
                  value={editForm.district}
                  onChange={(e) => setEditForm(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Jurisdiction Bounds (Coordinates)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="North (lat)"
                    value={editForm.north}
                    onChange={(e) => setEditForm(prev => ({ ...prev, north: e.target.value }))}
                  />
                  <Input
                    placeholder="South (lat)"
                    value={editForm.south}
                    onChange={(e) => setEditForm(prev => ({ ...prev, south: e.target.value }))}
                  />
                  <Input
                    placeholder="East (lng)"
                    value={editForm.east}
                    onChange={(e) => setEditForm(prev => ({ ...prev, east: e.target.value }))}
                  />
                  <Input
                    placeholder="West (lng)"
                    value={editForm.west}
                    onChange={(e) => setEditForm(prev => ({ ...prev, west: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog({ open: false, municipality: null })}>
                Cancel
              </Button>
              <Button onClick={handleEditMunicipality}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Municipality Detail / Issues View Dialog */}
        <Dialog 
          open={selectedMunicipality !== null} 
          onOpenChange={(open) => !open && setSelectedMunicipality(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {selectedMunicipality?.name}
              </DialogTitle>
              <DialogDescription>
                <MapPin className="inline h-3 w-3 mr-1" />
                {selectedMunicipality?.district}, {selectedMunicipality?.state}
              </DialogDescription>
            </DialogHeader>

            {/* Municipality Stats */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{selectedMunicipality?.score}</p>
                    <p className="text-sm text-muted-foreground">Score</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedMunicipality?.totalIssues || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Issues</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedMunicipality?.resolvedIssues || 0}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resolution Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Resolution Rate</span>
                <span className="font-medium">
                  {selectedMunicipality?.totalIssues 
                    ? Math.round((selectedMunicipality.resolvedIssues / selectedMunicipality.totalIssues) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={selectedMunicipality?.totalIssues 
                  ? (selectedMunicipality.resolvedIssues / selectedMunicipality.totalIssues) * 100 
                  : 0} 
                className="h-2" 
              />
            </div>

            {/* Issues List */}
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Issues ({municipalityIssues.length})
              </h4>

              {issuesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : municipalityIssues.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No issues reported for this municipality</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {municipalityIssues.map((issue) => (
                    <Card key={issue.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          {issue.imageUrls && issue.imageUrls.length > 0 ? (
                            <img 
                              src={issue.imageUrls[0]} 
                              alt="Issue" 
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{issue.type.replace(/_/g, " ")}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(issue.createdAt).toLocaleDateString()}
                              {issue.location?.address && ` • ${issue.location.address}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={issue.status}
                            onValueChange={(value) => handleUpdateIssueStatus(issue.id, value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteIssue(issue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => openEditDialog(selectedMunicipality!)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Municipality
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setSelectedMunicipality(null);
                  setDeleteDialog({ open: true, municipality: selectedMunicipality });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Municipality
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Issue Dialog */}
        <Dialog 
          open={viewIssueDialog.open} 
          onOpenChange={(open) => setViewIssueDialog({ open, issue: viewIssueDialog.issue })}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Issue Details
              </DialogTitle>
            </DialogHeader>
            {viewIssueDialog.issue && (
              <div className="space-y-4">
                {/* Issue Image */}
                {viewIssueDialog.issue.imageUrls && viewIssueDialog.issue.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {viewIssueDialog.issue.imageUrls.map((url, i) => (
                      <img 
                        key={i}
                        src={url} 
                        alt={`Issue image ${i + 1}`} 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Issue Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium">{viewIssueDialog.issue.type?.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge
                      variant={
                        viewIssueDialog.issue.status === "OPEN"
                          ? "destructive"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {viewIssueDialog.issue.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reported On</Label>
                    <p className="font-medium">
                      {viewIssueDialog.issue.createdAt
                        ? new Date(viewIssueDialog.issue.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reported By</Label>
                    <p className="font-medium">{viewIssueDialog.issue.reportedBy || "Anonymous"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{viewIssueDialog.issue.description}</p>
                </div>

                {viewIssueDialog.issue.location && (
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {viewIssueDialog.issue.location.address || 
                        `${viewIssueDialog.issue.location.latitude}, ${viewIssueDialog.issue.location.longitude}`}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewIssueDialog({ open: false, issue: null })}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewIssueDialog({ open: false, issue: null });
                  if (viewIssueDialog.issue) {
                    openEditIssueDialog(viewIssueDialog.issue);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Issue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Issue Dialog */}
        <Dialog 
          open={editIssueDialog.open} 
          onOpenChange={(open) => setEditIssueDialog({ open, issue: editIssueDialog.issue })}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Issue
              </DialogTitle>
              <DialogDescription>
                Update issue details including status, type, description, location, and images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Status and Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editIssueForm.status}
                    onValueChange={(value) => setEditIssueForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editIssueForm.type}
                    onValueChange={(value) => setEditIssueForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editIssueForm.description}
                  onChange={(e) => setEditIssueForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Location Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Location</Label>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <Input
                    value={editIssueForm.address}
                    onChange={(e) => setEditIssueForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={editIssueForm.latitude}
                      onChange={(e) => setEditIssueForm(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="e.g., 28.6139"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={editIssueForm.longitude}
                      onChange={(e) => setEditIssueForm(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="e.g., 77.2090"
                    />
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Images</Label>
                {editIssueForm.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {editIssueForm.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Issue image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditIssueForm(prev => ({
                              ...prev,
                              imageUrls: prev.imageUrls.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No images attached</p>
                )}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Add Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newImageUrl"
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById("newImageUrl") as HTMLInputElement;
                        if (input?.value?.trim()) {
                          setEditIssueForm(prev => ({
                            ...prev,
                            imageUrls: [...prev.imageUrls, input.value.trim()]
                          }));
                          input.value = "";
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditIssueDialog({ open: false, issue: null })}>
                Cancel
              </Button>
              <Button onClick={handleEditIssue}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Issue Dialog */}
        <Dialog 
          open={deleteIssueDialog.open} 
          onOpenChange={(open) => setDeleteIssueDialog({ open, issue: deleteIssueDialog.issue })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Issue
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this issue? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteIssueDialog.issue && (
              <div className="py-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><strong>Type:</strong> {deleteIssueDialog.issue.type?.replace(/_/g, " ")}</p>
                  <p><strong>Status:</strong> {deleteIssueDialog.issue.status}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {deleteIssueDialog.issue.description}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteIssueDialog({ open: false, issue: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteIssueFromAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Issue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
