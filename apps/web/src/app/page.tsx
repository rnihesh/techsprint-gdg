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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Trash2,
  Droplets,
  Lightbulb,
  Construction,
  TreePine,
  Building,
  HelpCircle,
} from "lucide-react";

const issueTypes = [
  { value: "POTHOLE", label: "Pothole", icon: Construction },
  { value: "GARBAGE", label: "Garbage", icon: Trash2 },
  { value: "DRAINAGE", label: "Drainage", icon: Droplets },
  { value: "STREETLIGHT", label: "Streetlight", icon: Lightbulb },
  { value: "ROAD_DAMAGE", label: "Road Damage", icon: Construction },
  { value: "WATER_SUPPLY", label: "Water Supply", icon: Droplets },
  { value: "SEWAGE", label: "Sewage", icon: Droplets },
  { value: "ENCROACHMENT", label: "Encroachment", icon: Building },
  { value: "SANITATION", label: "Sanitation", icon: Trash2 },
  { value: "PARKS", label: "Parks & Gardens", icon: TreePine },
  { value: "OTHER", label: "Other", icon: HelpCircle },
];

interface Stats {
  totalIssues: number;
  resolvedIssues: number;
  totalMunicipalities: number;
  avgResponseTime: number;
}

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    issueType: "",
    location: "",
    images: [] as File[],
  });

  // Redirect municipality/admin users to their dashboards
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (userProfile.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }
      if (userProfile.role === "municipality") {
        router.replace("/municipality/dashboard");
        return;
      }
    }
  }, [authLoading, user, userProfile, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationCoords) {
      toast.error("Please provide a location");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await issuesApi.create({
        description: formData.description,
        type: formData.issueType || undefined,
        location: {
          latitude: locationCoords.lat,
          longitude: locationCoords.lng,
        },
      });

      if (result.success) {
        toast.success("Issue reported successfully!", {
          description: "Your complaint has been registered anonymously.",
        });
        setFormData({
          description: "",
          issueType: "",
          location: "",
          images: [],
        });
        setLocationCoords(null);
      } else {
        toast.error("Failed to submit issue", {
          description: result.error || "Please try again later.",
        });
      }
    } catch {
      toast.error("Failed to submit issue", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationCoords({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
          toast.success("Location detected!");
        },
        () => {
          toast.error("Could not get location", {
            description: "Please enter your address manually.",
          });
        }
      );
    }
  };

  // Show loading while checking auth for redirects
  const shouldRedirect =
    user &&
    userProfile &&
    (userProfile.role === "admin" || userProfile.role === "municipality");
  const isCheckingAuth = authLoading || (user && !userProfile);

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
                {(!user || userProfile?.role === "user") && (
                  <Button size="lg" asChild>
                    <a href="#report-form">
                      <Send className="mr-2 h-5 w-5" />
                      Report an Issue
                    </a>
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

        {/* Report Form Section - Only visible to users and non-logged-in visitors */}
        {(!user || userProfile?.role === "user") && (
          <section id="report-form" className="py-16 bg-muted/30">
            <div className="container px-4">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Report a Civic Issue
                    </CardTitle>
                    <CardDescription>
                      Your report will be submitted anonymously. All fields
                      marked with * are required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Issue Type */}
                      <div className="space-y-2">
                        <Label htmlFor="issueType">Issue Type *</Label>
                        <Select
                          value={formData.issueType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              issueType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            {issueTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the issue in detail..."
                          rows={4}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="location"
                            placeholder="Click the pin to detect location"
                            value={formData.location}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }));
                              // Try to parse coordinates if manually entered
                              const coords = e.target.value
                                .split(",")
                                .map((s) => parseFloat(s.trim()));
                              if (
                                coords.length === 2 &&
                                !isNaN(coords[0]) &&
                                !isNaN(coords[1])
                              ) {
                                setLocationCoords({
                                  lat: coords[0],
                                  lng: coords[1],
                                });
                              }
                            }}
                            required
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGetLocation}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click the pin button to auto-detect your location
                        </p>
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <Label>Photos (optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drag and drop photos here, or click to browse
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="images"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setFormData((prev) => ({
                                ...prev,
                                images: files,
                              }));
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() =>
                              document.getElementById("images")?.click()
                            }
                          >
                            Upload Photos
                          </Button>
                        </div>
                        {formData.images.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formData.images.length} file(s) selected
                          </p>
                        )}
                      </div>

                      {/* Anonymous Notice */}
                      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Your identity is protected
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Reports are submitted anonymously. No personal
                            information is collected or shared.
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>Submitting...</>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Submit Report
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section - Only for users and non-logged-in visitors */}
        {(!user || userProfile?.role === "user") && (
          <section className="py-16">
            <div className="container px-4">
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="py-12 text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Are you a Municipality Official?
                  </h2>
                  <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                    Register your municipality to respond to complaints, track
                    performance, and improve your public accountability score.
                  </p>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/auth/register?type=municipality">
                      Register Municipality
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
