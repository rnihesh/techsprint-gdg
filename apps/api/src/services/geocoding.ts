import axios from "axios";
import { config } from "../config/index.js";

interface GeocodeResult {
  formatted: string;
  district: string;
  state: string;
  pincode?: string;
  ward?: string;
  country: string;
}

interface ReverseGeocodeResponse {
  results: Array<{
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> => {
  try {
    const response = await axios.get<ReverseGeocodeResponse>(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: config.googleMapsApiKey,
          language: "en",
        },
      }
    );

    if (!response.data.results || response.data.results.length === 0) {
      return null;
    }

    const result = response.data.results[0];
    const components = result.address_components;

    const getComponent = (types: string[]): string | undefined => {
      const component = components.find((c) =>
        types.some((t) => c.types.includes(t))
      );
      return component?.long_name;
    };

    const district =
      getComponent(["administrative_area_level_3"]) ||
      getComponent(["administrative_area_level_2"]) ||
      getComponent(["locality"]) ||
      "Unknown";

    const state = getComponent(["administrative_area_level_1"]) || "Unknown";

    const country = getComponent(["country"]) || "Unknown";

    // Only allow Indian locations
    if (country !== "India") {
      return null;
    }

    return {
      formatted: result.formatted_address,
      district,
      state,
      pincode: getComponent(["postal_code"]),
      ward: getComponent(["sublocality_level_1"]),
      country,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// IP-based geolocation fallback
export const getLocationFromIP = async (
  ip: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    // Using a free IP geolocation service
    const response = await axios.get(`http://ip-api.com/json/${ip}`);

    if (response.data.status === "success") {
      return {
        latitude: response.data.lat,
        longitude: response.data.lon,
      };
    }

    return null;
  } catch (error) {
    console.error("IP geolocation error:", error);
    return null;
  }
};
