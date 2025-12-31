"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  MapPin,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Navbar, Footer } from "@/components/layout";
import { issueApi } from "@/lib/api";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function ReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = useCallback(() => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setIsGettingLocation(false);

        // Try to get address (reverse geocode) - this would use Google Maps API
        // For now, we'll just show coordinates
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please enable location access."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Only JPEG, PNG, and WebP images are allowed");
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please upload an image of the issue");
      return;
    }

    if (!description || description.trim().length < 10) {
      toast.error("Please provide a description (at least 10 characters)");
      return;
    }

    if (!location) {
      toast.error("Location is required. Please enable location access.");
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(10);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("description", description.trim());
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());

      setSubmitProgress(30);

      const response = await issueApi.submit(formData);

      setSubmitProgress(100);

      toast.success("Issue reported successfully!", {
        description: `Issue type: ${response.data.issueType}`,
      });

      // Redirect to the issue page or map
      setTimeout(() => {
        router.push(`/issues/${response.data.issueId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
          "Failed to submit issue. Please try again."
      );
      setSubmitProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Report a Civic Issue</h1>
            <p className="text-muted-foreground">
              Help improve your community by reporting issues. Your submission
              is anonymous.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>
                Upload a photo and describe the issue you&apos;ve encountered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photo of Issue *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      imagePreview
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <Image
                          src={imagePreview}
                          alt="Issue preview"
                          width={400}
                          height={300}
                          className="mx-auto rounded-lg max-h-64 object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG or WebP (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail. What is the problem? How long has it been there?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/1000 characters
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label>Location *</Label>
                  {locationError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>{locationError}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getLocation}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : location ? (
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>
                          Location captured: {location.latitude.toFixed(6)},{" "}
                          {location.longitude.toFixed(6)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={getLocation}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={getLocation}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Get Current Location
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Submit Progress */}
                {isSubmitting && (
                  <div className="space-y-2">
                    <Progress value={submitProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {submitProgress < 30
                        ? "Preparing submission..."
                        : submitProgress < 70
                        ? "Uploading image..."
                        : submitProgress < 100
                        ? "Classifying issue..."
                        : "Complete!"}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !image || !description || !location}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Issue Report
                    </>
                  )}
                </Button>

                {/* Privacy Note */}
                <p className="text-xs text-center text-muted-foreground">
                  Your submission is anonymous. We don&apos;t collect any
                  personal information. The issue will be automatically assigned
                  to the relevant municipality.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
