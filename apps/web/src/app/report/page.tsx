"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { uploadImages } from "@/lib/cloudinary";
import { MapPicker } from "@/components/map";
import {
  MapPin,
  Camera,
  Send,
  Shield,
  Trash2,
  Droplets,
  Lightbulb,
  Construction,
  TreePine,
  Building,
  HelpCircle,
  Loader2,
  X,
  Image as ImageIcon,
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

export default function ReportIssuePage() {
  const router = useRouter();
  const { user, userProfile, getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    issueType: "",
    location: "",
    images: [] as File[],
  });

  // Redirect non-users (municipality and admin should use their dashboards)
  if (userProfile && userProfile.role !== "user") {
    router.replace(
      userProfile.role === "admin"
        ? "/admin/dashboard"
        : "/municipality/dashboard"
    );
    return null;
  }

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const { urls, errors } = await uploadImages(files);

      if (urls.length > 0) {
        setUploadedImages((prev) => [...prev, ...urls]);
        toast.success(`${urls.length} image(s) uploaded successfully`);
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issueType) {
      toast.error("Please select an issue type");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    if (!locationCoords) {
      toast.error("Please provide a location");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/issues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            description: formData.description,
            type: formData.issueType,
            location: {
              latitude: locationCoords.lat,
              longitude: locationCoords.lng,
            },
            imageUrls: uploadedImages,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Issue reported successfully!", {
          description: "Your complaint has been registered.",
        });
        // Reset form
        setFormData({
          description: "",
          issueType: "",
          location: "",
          images: [],
        });
        setLocationCoords(null);
        setUploadedImages([]);
        // Redirect to map to see the issue
        router.push("/map");
      } else {
        toast.error("Failed to submit issue", {
          description: data.error || "Please try again later.",
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Report a Civic Issue</CardTitle>
              <CardDescription>
                Your report will be submitted anonymously. All fields marked
                with * are required.
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
                  <div className="flex gap-2 mb-3">
                    <Input
                      id="location"
                      placeholder="Select location on map or enter coordinates"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }));
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
                      title="Auto-detect my location"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Map Picker */}
                  <MapPicker
                    selectedLocation={locationCoords}
                    onLocationSelect={(location) => {
                      setLocationCoords(location);
                      setFormData((prev) => ({
                        ...prev,
                        location: `${location.lat.toFixed(
                          6
                        )}, ${location.lng.toFixed(6)}`,
                      }));
                    }}
                    height="250px"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photos (optional but recommended)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Uploading images...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Upload photos of the issue for faster verification
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="images"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            handleImageUpload(files);
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
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload Photos
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
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
                      Reports are submitted anonymously. No personal information
                      is collected or shared with municipalities.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
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
      </main>

      <Footer />
    </div>
  );
}
