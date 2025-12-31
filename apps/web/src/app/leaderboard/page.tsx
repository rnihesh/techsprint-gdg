"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Medal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar, Footer } from "@/components/layout";
import { leaderboardApi, metaApi } from "@/lib/api";

interface Municipality {
  _id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  score: number;
  totalIssuesReceived: number;
  totalIssuesResolved: number;
  rank: number;
  resolutionRate: string;
}

export default function LeaderboardPage() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [topMunicipalities, setTopMunicipalities] = useState<Municipality[]>(
    []
  );
  const [bottomMunicipalities, setBottomMunicipalities] = useState<
    Municipality[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [selectedState, selectedType, page]);

  useEffect(() => {
    fetchStates();
    fetchTopBottom();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await metaApi.getStates();
      setStates(response.data);
    } catch (error) {
      console.error("Failed to fetch states:", error);
    }
  };

  const fetchTopBottom = async () => {
    try {
      const [topRes, bottomRes] = await Promise.all([
        leaderboardApi.getTop(),
        leaderboardApi.getBottom(),
      ]);
      setTopMunicipalities(topRes.data);
      setBottomMunicipalities(bottomRes.data);
    } catch (error) {
      console.error("Failed to fetch top/bottom:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "20",
      };
      if (selectedState) params.state = selectedState;
      if (selectedType) params.type = selectedType;

      const response = await leaderboardApi.getAll(params);
      setMunicipalities(response.data.municipalities);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="font-mono text-sm">#{rank}</span>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      corporation: "Corporation",
      municipality: "Municipality",
      town_panchayat: "Town Panchayat",
      gram_panchayat: "Gram Panchayat",
    };
    return labels[type] || type;
  };

  const filteredMunicipalities = municipalities.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Municipality Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Rankings based on civic issue resolution performance
            </p>
          </div>

          {/* Top Performers and Worst Performers */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Top 3 */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>Best scoring municipalities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topMunicipalities.slice(0, 3).map((m) => (
                    <Link
                      key={m._id}
                      href={`/leaderboard/${m._id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(m.rank)}
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.district}, {m.state}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {m.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.resolutionRate}% resolved
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom 3 */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-5 w-5" />
                  Needs Improvement
                </CardTitle>
                <CardDescription>Lowest scoring municipalities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bottomMunicipalities.slice(0, 3).map((m) => (
                    <Link
                      key={m._id}
                      href={`/leaderboard/${m._id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-red-600">
                          #{m.rank}
                        </span>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.district}, {m.state}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {m.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.resolutionRate}% resolved
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Full Rankings
              </CardTitle>
              <CardDescription>
                All municipalities ranked by performance score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search municipality..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="municipality">Municipality</SelectItem>
                    <SelectItem value="town_panchayat">
                      Town Panchayat
                    </SelectItem>
                    <SelectItem value="gram_panchayat">
                      Gram Panchayat
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Municipality</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Issues</TableHead>
                        <TableHead className="text-right">Resolved</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMunicipalities.map((m) => (
                        <TableRow
                          key={m._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            (window.location.href = `/leaderboard/${m._id}`)
                          }
                        >
                          <TableCell>{getRankBadge(m.rank)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{m.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {m.district}, {m.state}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTypeLabel(m.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {m.score.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {m.totalIssuesReceived}
                          </TableCell>
                          <TableCell className="text-right">
                            {m.totalIssuesResolved}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                parseFloat(m.resolutionRate) >= 70
                                  ? "default"
                                  : parseFloat(m.resolutionRate) >= 40
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {m.resolutionRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
