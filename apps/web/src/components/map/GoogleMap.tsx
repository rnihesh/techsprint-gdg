"use client";

import { useCallback, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Rectangle,
} from "@react-google-maps/api";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { config } from "@/lib/config";

// Libraries to load - must be consistent across all map components
const libraries: ("places" | "geometry")[] = ["places"];

interface Issue {
  id: string;
  description: string;
  type: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  municipalityId: string;
  imageUrls?: string[];
}

interface MunicipalityBounds {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface GoogleMapComponentProps {
  issues: Issue[];
  municipalities?: MunicipalityBounds[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  showMunicipalityBorders?: boolean;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = config.map.defaultCenter;

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const getMarkerColor = (status: string): string => {
  switch (status) {
    case "OPEN":
      return "#EF4444"; // red
    case "CLOSED":
      return "#22C55E"; // green
    default:
      return "#6B7280"; // gray
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "CLOSED":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    OPEN: "destructive",
    CLOSED: "default",
  };
  const labels: Record<string, string> = {
    OPEN: "Open",
    CLOSED: "Closed",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  );
};

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    POTHOLE: "bg-orange-100 text-orange-800",
    GARBAGE: "bg-green-100 text-green-800",
    DRAINAGE: "bg-blue-100 text-blue-800",
    STREETLIGHT: "bg-yellow-100 text-yellow-800",
    ROAD_DAMAGE: "bg-red-100 text-red-800",
    WATER_SUPPLY: "bg-cyan-100 text-cyan-800",
    OTHER: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        colors[type] || colors.OTHER
      }`}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
};

export function GoogleMapComponent({
  issues,
  municipalities = [],
  center,
  zoom = 12,
  onBoundsChange,
  showMunicipalityBorders = true,
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationChecked, setLocationChecked] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Get user's location on mount (before map renders)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationChecked(true);
        },
        () => {
          // User denied location, use default
          console.log("Geolocation permission denied, using default location");
          setLocationChecked(true);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setLocationChecked(true);
    }
  }, []);

  // Determine the map center: prop > user location > default
  const mapCenter = center || userLocation || defaultCenter;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleBoundsChanged = useCallback(() => {
    if (map && onBoundsChange) {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    }
  }, [map, onBoundsChange]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load map</h3>
          <p className="text-muted-foreground">
            Please check your API key configuration
          </p>
        </div>
      </div>
    );
  }

  // Wait for both: Google Maps to load AND location check to complete
  if (!isLoaded || !locationChecked) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {!locationChecked ? "Getting your location..." : "Loading map..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onBoundsChanged={handleBoundsChanged}
      options={mapOptions}
    >
      {/* Municipality border rectangles */}
      {showMunicipalityBorders &&
        municipalities.map((municipality) => (
          <Rectangle
            key={municipality.id}
            bounds={{
              north: municipality.bounds.north,
              south: municipality.bounds.south,
              east: municipality.bounds.east,
              west: municipality.bounds.west,
            }}
            options={{
              strokeColor:
                hoveredMunicipality === municipality.id ? "#2563EB" : "#6366F1",
              strokeOpacity: hoveredMunicipality === municipality.id ? 1 : 0.6,
              strokeWeight: hoveredMunicipality === municipality.id ? 3 : 2,
              fillColor: "#6366F1",
              fillOpacity:
                hoveredMunicipality === municipality.id ? 0.15 : 0.05,
              clickable: true,
              zIndex: hoveredMunicipality === municipality.id ? 2 : 1,
            }}
            onMouseOver={() => setHoveredMunicipality(municipality.id)}
            onMouseOut={() => setHoveredMunicipality(null)}
          />
        ))}

      {/* Hovered municipality name tooltip */}
      {hoveredMunicipality &&
        municipalities.find((m) => m.id === hoveredMunicipality) && (
          <InfoWindow
            position={{
              lat: municipalities.find((m) => m.id === hoveredMunicipality)!
                .bounds.north,
              lng:
                (municipalities.find((m) => m.id === hoveredMunicipality)!
                  .bounds.east +
                  municipalities.find((m) => m.id === hoveredMunicipality)!
                    .bounds.west) /
                2,
            }}
            options={{ disableAutoPan: true }}
          >
            <div className="px-2 py-1 font-medium text-sm">
              {municipalities.find((m) => m.id === hoveredMunicipality)?.name}
            </div>
          </InfoWindow>
        )}

      {issues.map((issue) => (
        <Marker
          key={issue.id}
          position={{
            lat: issue.location.latitude,
            lng: issue.location.longitude,
          }}
          onClick={() => setSelectedIssue(issue)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getMarkerColor(issue.status),
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      ))}

      {selectedIssue && (
        <InfoWindow
          position={{
            lat: selectedIssue.location.latitude,
            lng: selectedIssue.location.longitude,
          }}
          onCloseClick={() => setSelectedIssue(null)}
        >
          <div className="p-2 max-w-xs">
            {/* Issue Image */}
            {selectedIssue.imageUrls && selectedIssue.imageUrls.length > 0 && (
              <div className="mb-2 -mx-2 -mt-2">
                <img
                  src={selectedIssue.imageUrls[0]}
                  alt="Issue"
                  className="w-full h-32 object-cover rounded-t"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(selectedIssue.status)}
              {getStatusBadge(selectedIssue.status)}
              {getTypeBadge(selectedIssue.type)}
            </div>
            <p className="text-sm font-medium mb-1">
              {selectedIssue.description.slice(0, 100)}
              {selectedIssue.description.length > 100 ? "..." : ""}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>
                {selectedIssue.location.address ||
                  `${selectedIssue.location.latitude.toFixed(
                    4
                  )}, ${selectedIssue.location.longitude.toFixed(4)}`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Reported: {selectedIssue.createdAt}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default GoogleMapComponent;
