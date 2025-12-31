import { Municipality } from "../models/index.js";
import mongoose from "mongoose";

interface MunicipalityMatch {
  municipalityId: mongoose.Types.ObjectId;
  name: string;
  distance?: number;
}

/**
 * Find municipality by point location
 * First tries to find municipality whose boundary contains the point
 * Falls back to nearest municipality if no boundary match
 */
export const findMunicipalityByLocation = async (
  longitude: number,
  latitude: number
): Promise<MunicipalityMatch | null> => {
  try {
    // First, try to find municipality with boundary containing the point
    const municipalityByBoundary = await Municipality.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
    });

    if (municipalityByBoundary) {
      return {
        municipalityId: municipalityByBoundary._id,
        name: municipalityByBoundary.name,
      };
    }

    // Fallback: find nearest municipality by center point
    const nearestMunicipality = await Municipality.findOne({
      center: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 50000, // 50km max distance
        },
      },
    });

    if (nearestMunicipality) {
      // Calculate approximate distance
      const distance = calculateDistance(
        latitude,
        longitude,
        nearestMunicipality.center.coordinates[1],
        nearestMunicipality.center.coordinates[0]
      );

      return {
        municipalityId: nearestMunicipality._id,
        name: nearestMunicipality.name,
        distance,
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding municipality:", error);
    return null;
  }
};

/**
 * Find municipality by district and state
 */
export const findMunicipalityByAddress = async (
  district: string,
  state: string
): Promise<MunicipalityMatch | null> => {
  try {
    const municipality = await Municipality.findOne({
      district: { $regex: new RegExp(district, "i") },
      state: { $regex: new RegExp(state, "i") },
    });

    if (municipality) {
      return {
        municipalityId: municipality._id,
        name: municipality.name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding municipality by address:", error);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
