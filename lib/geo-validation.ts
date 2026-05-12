// India geographical boundaries
const INDIA_GEO_BOUNDS = {
  minLatitude: 8.4,
  maxLatitude: 35.0,
  minLongitude: 68.2,
  maxLongitude: 97.4,
};

/**
 * Validates if a given location (latitude, longitude) is within India
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns true if the location is within India, false otherwise
 */
export function isLocationInIndia(latitude: number, longitude: number): boolean {
  return (
    latitude >= INDIA_GEO_BOUNDS.minLatitude &&
    latitude <= INDIA_GEO_BOUNDS.maxLatitude &&
    longitude >= INDIA_GEO_BOUNDS.minLongitude &&
    longitude <= INDIA_GEO_BOUNDS.maxLongitude
  );
}

/**
 * Gets the error message when location is outside India
 * @returns Error message string
 */
export function getLocationErrorMessage(): string {
  return 'Food donations are only available within India. Please enable location access from an India-based location.';
}
