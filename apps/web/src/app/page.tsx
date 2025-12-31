"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  { value: "pothole", label: "Pothole", icon: Construction },
  { value: "garbage", label: "Garbage", icon: Trash2 },
  { value: "drainage", label: "Drainage", icon: Droplets },
  { value: "streetlight", label: "Streetlight", icon: Lightbulb },
  { value: "road_damage", label: "Road Damage", icon: Construction },
  { value: "water_supply", label: "Water Supply", icon: Droplets },
  { value: "encroachment", label: "Encroachment", icon: Building },
  { value: "sanitation", label: "Sanitation", icon: Trash2 },
  { value: "parks", label: "Parks & Gardens", icon: TreePine },
  { value: "other", label: "Other", icon: HelpCircle },
];

const severityOptions = [
  { value: "low", label: "Low - Minor inconvenience" },
  { value: "medium", label: "Medium - Causes problems" },
  { value: "high", label: "High - Urgent attention needed" },
  { value: "critical", label: "Critical - Safety hazard" },
];

const stats = [
  { label: "Issues Reported", value: "12,450+", icon: AlertTriangle },
  { label: "Issues Resolved", value: "8,230+", icon: CheckCircle },
  { label: "Municipalities", value: "150+", icon: Building },
  { label: "Avg Response Time", value: "48 hrs", icon: Clock },
];

export default function HomePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issueType: "",
    severity: "",
    location: "",
    images: [] as File[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Issue reported successfully!", {
        description: "Your complaint has been registered anonymously.",
      });
      setFormData({
        title: "",
        description: "",
        issueType: "",
        severity: "",
        location: "",
        images: [],
      });
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="px-4 py-1">
                🇮🇳 For Indian Citizens
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Report Civic Issues.
                <br />
                <span className="text-primary">Hold Municipalities Accountable.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Report potholes, garbage, drainage problems and more. Stay anonymous.
                Track resolution. Make your city better.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="#report-form">
                    <Send className="mr-2 h-5 w-5" />
                    Report an Issue
                  </a>
                </Button>
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
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="flex justify-center mb-2">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple, transparent process to report issues and track their resolution.
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
                    Take a photo, add location, and describe the issue. Stay completely
                    anonymous if you prefer.
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
                    Our AI verifies the authenticity of reports and forwards them to the
                    concerned municipality.
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
                    Monitor progress, see municipality responses, and view the public
                    accountability leaderboard.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Report Form Section */}
        <section id="report-form" className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Report a Civic Issue</CardTitle>
                  <CardDescription>
                    Your report will be submitted anonymously. All fields marked with * are
                    required.
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
                          setFormData((prev) => ({ ...prev, issueType: value }))
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

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Brief title for the issue"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
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
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        required
                      />
                    </div>

                    {/* Severity */}
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity *</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, severity: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity level" />
                        </SelectTrigger>
                        <SelectContent>
                          {severityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="location"
                          placeholder="Address or coordinates"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, location: e.target.value }))
                          }
                          required
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={handleGetLocation}>
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
                            setFormData((prev) => ({ ...prev, images: files }));
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => document.getElementById("images")?.click()}
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
                          Reports are submitted anonymously. No personal information is
                          collected or shared.
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
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

        {/* CTA Section */}
        <section className="py-16">
          <div className="container px-4">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-12 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Are you a Municipality Official?
                </h2>
                <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                  Register your municipality to respond to citizen complaints, track
                  performance, and improve your public accountability score.
                </p>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/auth/register">Register Municipality</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
