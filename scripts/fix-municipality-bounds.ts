/**
 * Script to fix municipality bounds for existing municipalities
 * Run with: npx tsx scripts/fix-municipality-bounds.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from API
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') });

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS 
    || path.join(__dirname, '../apps/api/serviceAccountKey.json');
  
  initializeApp({
    credential: cert(serviceAccountPath),
    projectId: 'civiclemma'
  });
}

const db = getFirestore();

interface GeocodeResponse {
  status: string;
  results: Array<{
    geometry: {
      bounds?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
  }>;
}

async function getCityBounds(
  cityName: string,
  district: string,
  state: string
): Promise<{ north: number; south: number; east: number; west: number } | null> {
  const searchQueries = [
    `${cityName}, ${district}, ${state}, India`,
    `${district}, ${state}, India`,
    `${cityName}, ${state}, India`
  ];

  for (const query of searchQueries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json() as GeocodeResponse;

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const geometry = data.results[0].geometry;
        const boundsData = geometry.bounds || geometry.viewport;
        
        if (boundsData) {
          // Add buffer for better coverage
          const latBuffer = 0.045;
          const lngBuffer = 0.05;
          
          return {
            north: boundsData.northeast.lat + latBuffer,
            south: boundsData.southwest.lat - latBuffer,
            east: boundsData.northeast.lng + lngBuffer,
            west: boundsData.southwest.lng - lngBuffer
          };
        }
      }
    } catch (error) {
      console.error(`Error with query "${query}":`, error);
    }
  }

  return null;
}

// Predefined bounds for major Indian cities (fallback)
const cityBounds: Record<string, { north: number; south: number; east: number; west: number }> = {
  'hyderabad': { north: 17.60, south: 17.20, east: 78.70, west: 78.20 },
  'mumbai': { north: 19.30, south: 18.85, east: 73.00, west: 72.75 },
  'delhi': { north: 28.90, south: 28.40, east: 77.40, west: 76.80 },
  'bangalore': { north: 13.15, south: 12.75, east: 77.80, west: 77.40 },
  'chennai': { north: 13.30, south: 12.85, east: 80.35, west: 80.05 },
  'kolkata': { north: 22.70, south: 22.40, east: 88.50, west: 88.20 },
  'pune': { north: 18.65, south: 18.40, east: 73.95, west: 73.70 },
  'ahmedabad': { north: 23.15, south: 22.90, east: 72.70, west: 72.45 },
};

async function fixAllMunicipalityBounds() {
  console.log('Fetching all municipalities...');
  
  const snapshot = await db.collection('municipalities').get();
  
  console.log(`Found ${snapshot.size} municipalities`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentBounds = data.bounds;
    
    // Check if bounds are empty/zero
    const needsFix = !currentBounds || 
      (currentBounds.north === 0 && currentBounds.south === 0 && 
       currentBounds.east === 0 && currentBounds.west === 0);
    
    if (needsFix) {
      console.log(`\nFixing bounds for: ${data.name} (${data.district}, ${data.state})`);
      
      // Try Google Maps API first
      let newBounds = await getCityBounds(data.name, data.district, data.state);
      
      // Fallback to predefined bounds
      if (!newBounds) {
        const cityKey = (data.name || '').toLowerCase().replace(/[^a-z]/g, '');
        const districtKey = (data.district || '').toLowerCase().replace(/[^a-z]/g, '');
        
        if (cityBounds[cityKey]) {
          newBounds = cityBounds[cityKey];
          console.log(`  Using predefined bounds for ${cityKey}`);
        } else if (cityBounds[districtKey]) {
          newBounds = cityBounds[districtKey];
          console.log(`  Using predefined bounds for district ${districtKey}`);
        }
      }
      
      if (newBounds) {
        console.log(`  New bounds: N:${newBounds.north.toFixed(4)} S:${newBounds.south.toFixed(4)} E:${newBounds.east.toFixed(4)} W:${newBounds.west.toFixed(4)}`);
        
        await doc.ref.update({
          bounds: newBounds,
          updatedAt: new Date()
        });
        
        console.log(`  ✓ Updated!`);
      } else {
        console.log(`  ✗ Could not find bounds, skipping`);
      }
    } else {
      console.log(`\n${data.name}: bounds already set (N:${currentBounds.north.toFixed(4)} S:${currentBounds.south.toFixed(4)})`);
    }
  }
  
  console.log('\n✓ Done!');
}

// Run the script
fixAllMunicipalityBounds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
