// Re-export everything from client and admin
export * from './client';
export * from './admin';
export { COLLECTIONS } from './client';

// Common constants
export const FIREBASE_REGIONS = {
  ASIA_SOUTH1: 'asia-south1',  // Mumbai
  ASIA_EAST1: 'asia-east1',    // Taiwan
  US_CENTRAL1: 'us-central1'   // Iowa
} as const;

export const DEFAULT_REGION = FIREBASE_REGIONS.ASIA_SOUTH1;
