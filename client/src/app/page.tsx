"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { issuesApi } from "@/lib/api";
import {
  MapPin,
  Camera,
  Send,
  Shield,
  Trophy,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
} from "lucide-react";

interface Stats {
  totalIssues: number;
  resolvedIssues: number;
  totalMunicipalities: number;
  avgResponseTime: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, profileLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  // Redirect municipality/admin users to their dashboards
  useEffect(() => {
    if (!authLoading && !profileLoading && user && userProfile) {
      console.log("Home page - User role:", userProfile.role);
      if (userProfile.role === "PLATFORM_MAINTAINER" || userProfile.role === "admin") {
        console.log("Redirecting admin to dashboard...");
        router.replace("/admin/dashboard");
        return;
      }
      if (userProfile.role === "MUNICIPALITY_USER") {
        console.log("Redirecting municipality to issues...");
        router.replace("/municipality/issues");
        return;
      }
    }
  }, [authLoading, profileLoading, user, userProfile, router]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await issuesApi.getStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  // Show loading while checking auth for redirects
  const shouldRedirect =
    user &&
    userProfile &&
    (userProfile.role === "PLATFORM_MAINTAINER" ||
      userProfile.role === "admin" ||
      userProfile.role === "MUNICIPALITY_USER");
  const isCheckingAuth =
    authLoading || profileLoading || (user && !userProfile);

  if (isCheckingAuth || shouldRedirect) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="px-4 py-1">
                🇮🇳 For Indian Residents
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Report Civic Issues.
                <br />
                <span className="text-primary">
                  Hold Municipalities Accountable.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Report potholes, garbage, drainage problems and more. Stay
                anonymous. Track resolution. Make your city better.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(!user || userProfile?.role === "USER") && (
                  <Button size="lg" asChild>
                    <Link href="/report">
                      <Send className="mr-2 h-5 w-5" />
                      Report an Issue
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild>
                  <Link href="/map">
                    <MapPin className="mr-2 h-5 w-5" />
                    View Issue Map
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b bg-muted/30">
          <div className="container px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <AlertTriangle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats?.totalIssues ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Issues Reported
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats?.resolvedIssues ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Issues Resolved
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats?.totalMunicipalities ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Municipalities
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats?.avgResponseTime ?? 0} hrs
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Response Time
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple, transparent process to report issues and track their
                resolution.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>1. Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Take a photo, add location, and describe the issue. Stay
                    completely anonymous if you prefer.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>2. Verify</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our AI verifies the authenticity of reports and forwards
                    them to the concerned municipality.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>3. Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Monitor progress, see municipality responses, and view the
                    public accountability leaderboard.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
