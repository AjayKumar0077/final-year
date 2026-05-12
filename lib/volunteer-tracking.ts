/**
 * Volunteer Tracking System
 * Manages real-time location tracking, journey history, and mission progress for volunteers
 */

import { calculateHaversineDistance } from '@/lib/geo-distance';

export interface VolunteerLocationPoint {
  volunteerId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  missionId?: string;
  status: 'idle' | 'in_transit' | 'at_location' | 'completed';
}

export interface VolunteerJourneySegment {
  id: string;
  volunteerId: string;
  missionId: string;
  startLocation: { latitude: number; longitude: number; timestamp: number };
  endLocation?: { latitude: number; longitude: number; timestamp: number };
  waypoints: VolunteerLocationPoint[];
  distanceTravelledKm: number;
  durationMinutes: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: number;
}

export interface VolunteerTrackingMetrics {
  volunteerId: string;
  totalDistanceKm: number;
  totalMissionsCompleted: number;
  totalMissionsInProgress: number;
  averageSpeedKmh: number;
  lastUpdated: number;
}

const TRACKING_STORAGE_KEY = 'volunteer_tracking_points';
const JOURNEY_STORAGE_KEY = 'volunteer_journey_segments';
const METRICS_STORAGE_KEY = 'volunteer_tracking_metrics';

const GEOFENCE_RADIUS_M = 100; // 100 meters
const SPEED_THRESHOLD_KMH = 3; // Movement faster than this is "in_transit"
const IDLE_TIMEOUT_MS = 300000; // 5 minutes
const LOCATION_HISTORY_MAX_POINTS = 1000;

/**
 * Record a volunteer's location point
 */
export function recordVolunteerLocation(point: VolunteerLocationPoint): void {
  if (typeof window === 'undefined') return;

  try {
    const points = readLocationPoints();
    const volunteerId = point.volunteerId;
    
    if (!points[volunteerId]) {
      points[volunteerId] = [];
    }

    points[volunteerId].push(point);

    // Keep only the last N points per volunteer to manage storage
    if (points[volunteerId].length > LOCATION_HISTORY_MAX_POINTS) {
      points[volunteerId] = points[volunteerId].slice(-LOCATION_HISTORY_MAX_POINTS);
    }

    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(points));
    window.dispatchEvent(new CustomEvent('volunteer-location-updated', { detail: { volunteerId } }));
  } catch (error) {
    console.error('Error recording volunteer location:', error);
  }
}

/**
 * Get recent location points for a volunteer
 */
export function getVolunteerLocationHistory(
  volunteerId: string,
  limitPoints: number = 50
): VolunteerLocationPoint[] {
  if (typeof window === 'undefined') return [];

  try {
    const points = readLocationPoints();
    return (points[volunteerId] || []).slice(-limitPoints);
  } catch (error) {
    console.error('Error retrieving volunteer location history:', error);
    return [];
  }
}

/**
 * Get the current location of a volunteer
 */
export function getVolunteerCurrentLocation(volunteerId: string): VolunteerLocationPoint | null {
  const history = getVolunteerLocationHistory(volunteerId, 1);
  return history.length > 0 ? history[0] : null;
}

/**
 * Calculate if a volunteer is within a geofence of a location
 */
export function isVolunteerInGeofence(
  volunteerId: string,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = GEOFENCE_RADIUS_M
): boolean {
  const currentLocation = getVolunteerCurrentLocation(volunteerId);
  if (!currentLocation) return false;

  const distanceKm = calculateHaversineDistance(
    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
    { latitude: targetLat, longitude: targetLon }
  );

  return distanceKm * 1000 <= radiusMeters; // Convert km to meters
}

/**
 * Determine volunteer's movement status based on recent locations
 */
export function getVolunteerMovementStatus(
  volunteerId: string,
  windowMinutes: number = 5
): 'idle' | 'in_transit' | 'moving_slowly' {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const recentPoints = getVolunteerLocationHistory(volunteerId, 20).filter(
    p => now - p.timestamp <= windowMs
  );

  if (recentPoints.length < 2) return 'idle';

  // Calculate average speed in last window
  let totalDistanceKm = 0;
  for (let i = 1; i < recentPoints.length; i++) {
    const prev = recentPoints[i - 1];
    const curr = recentPoints[i];
    totalDistanceKm += calculateHaversineDistance(
      { latitude: prev.latitude, longitude: prev.longitude },
      { latitude: curr.latitude, longitude: curr.longitude }
    );
  }

  const durationHours = windowMs / (1000 * 60 * 60);
  const speedKmh = totalDistanceKm / durationHours;

  if (speedKmh > SPEED_THRESHOLD_KMH) {
    return 'in_transit';
  } else if (speedKmh > 0.1) {
    return 'moving_slowly';
  }

  return 'idle';
}

/**
 * Start a new journey segment for a volunteer on a mission
 */
export function startJourneySegment(
  volunteerId: string,
  missionId: string,
  startLocation: { latitude: number; longitude: number; timestamp: number }
): string {
  if (typeof window === 'undefined') return '';

  try {
    const journeyId = `journey_${volunteerId}_${missionId}_${Date.now()}`;
    const segment: VolunteerJourneySegment = {
      id: journeyId,
      volunteerId,
      missionId,
      startLocation,
      waypoints: [],
      distanceTravelledKm: 0,
      durationMinutes: 0,
      status: 'in_progress',
      createdAt: Date.now(),
    };

    const journeys = readJourneys();
    if (!journeys[volunteerId]) {
      journeys[volunteerId] = [];
    }

    journeys[volunteerId].push(segment);
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));

    return journeyId;
  } catch (error) {
    console.error('Error starting journey segment:', error);
    return '';
  }
}

/**
 * Add a waypoint to an active journey
 */
export function addJourneyWaypoint(
  journeyId: string,
  volunteerId: string,
  point: VolunteerLocationPoint
): void {
  if (typeof window === 'undefined') return;

  try {
    const journeys = readJourneys();
    const volunteerJourneys = journeys[volunteerId] || [];
    const journey = volunteerJourneys.find(j => j.id === journeyId);

    if (!journey) {
      console.warn(`Journey ${journeyId} not found`);
      return;
    }

    // Calculate distance from last waypoint
    if (journey.waypoints.length > 0) {
      const lastPoint = journey.waypoints[journey.waypoints.length - 1];
      const segmentDistanceKm = calculateHaversineDistance(
        { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
        { latitude: point.latitude, longitude: point.longitude }
      );
      journey.distanceTravelledKm += segmentDistanceKm;
    }

    journey.waypoints.push(point);
    journey.durationMinutes = (point.timestamp - journey.startLocation.timestamp) / (1000 * 60);

    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
    window.dispatchEvent(new CustomEvent('journey-updated', { detail: { journeyId } }));
  } catch (error) {
    console.error('Error adding journey waypoint:', error);
  }
}

/**
 * Complete a journey segment
 */
export function completeJourneySegment(
  journeyId: string,
  volunteerId: string,
  endLocation: { latitude: number; longitude: number; timestamp: number }
): VolunteerJourneySegment | null {
  if (typeof window === 'undefined') return null;

  try {
    const journeys = readJourneys();
    const volunteerJourneys = journeys[volunteerId] || [];
    const journey = volunteerJourneys.find(j => j.id === journeyId);

    if (!journey) {
      console.warn(`Journey ${journeyId} not found`);
      return null;
    }

    journey.endLocation = endLocation;
    journey.status = 'completed';
    journey.durationMinutes = (endLocation.timestamp - journey.startLocation.timestamp) / (1000 * 60);

    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
    window.dispatchEvent(new CustomEvent('journey-completed', { detail: { journeyId } }));

    updateMetrics(volunteerId);
    return journey;
  } catch (error) {
    console.error('Error completing journey segment:', error);
    return null;
  }
}

/**
 * Get all journey segments for a volunteer
 */
export function getVolunteerJourneys(volunteerId: string): VolunteerJourneySegment[] {
  if (typeof window === 'undefined') return [];

  try {
    const journeys = readJourneys();
    return journeys[volunteerId] || [];
  } catch (error) {
    console.error('Error retrieving volunteer journeys:', error);
    return [];
  }
}

/**
 * Get active journey for a volunteer
 */
export function getActiveJourney(volunteerId: string): VolunteerJourneySegment | null {
  const journeys = getVolunteerJourneys(volunteerId);
  return journeys.find(j => j.status === 'in_progress') || null;
}

/**
 * Calculate tracking metrics for a volunteer
 */
export function getVolunteerMetrics(volunteerId: string): VolunteerTrackingMetrics | null {
  if (typeof window === 'undefined') return null;

  try {
    const metrics = readMetrics();
    return metrics[volunteerId] || null;
  } catch (error) {
    console.error('Error retrieving volunteer metrics:', error);
    return null;
  }
}

/**
 * Update volunteer metrics based on journey history
 */
function updateMetrics(volunteerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const journeys = getVolunteerJourneys(volunteerId);
    const completedJourneys = journeys.filter(j => j.status === 'completed');

    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;

    completedJourneys.forEach(journey => {
      totalDistanceKm += journey.distanceTravelledKm;
      totalDurationMinutes += journey.durationMinutes;
    });

    const averageSpeedKmh = totalDurationMinutes > 0
      ? (totalDistanceKm / (totalDurationMinutes / 60))
      : 0;

    const inProgressCount = journeys.filter(j => j.status === 'in_progress').length;

    const metrics: VolunteerTrackingMetrics = {
      volunteerId,
      totalDistanceKm,
      totalMissionsCompleted: completedJourneys.length,
      totalMissionsInProgress: inProgressCount,
      averageSpeedKmh,
      lastUpdated: Date.now(),
    };

    const allMetrics = readMetrics();
    allMetrics[volunteerId] = metrics;
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(allMetrics));
  } catch (error) {
    console.error('Error updating volunteer metrics:', error);
  }
}

/**
 * Clear old tracking data (older than specified days)
 */
export function clearOldTrackingData(olderThanDays: number = 30): void {
  if (typeof window === 'undefined') return;

  try {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    
    const points = readLocationPoints();
    Object.keys(points).forEach(volunteerId => {
      points[volunteerId] = points[volunteerId].filter(p => p.timestamp > cutoffTime);
    });
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(points));

    const journeys = readJourneys();
    Object.keys(journeys).forEach(volunteerId => {
      journeys[volunteerId] = journeys[volunteerId].filter(j => j.createdAt > cutoffTime);
    });
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
  } catch (error) {
    console.error('Error clearing old tracking data:', error);
  }
}

// Private helpers

function readLocationPoints(): Record<string, VolunteerLocationPoint[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading location points:', error);
    return {};
  }
}

function readJourneys(): Record<string, VolunteerJourneySegment[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(JOURNEY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading journeys:', error);
    return {};
  }
}

function readMetrics(): Record<string, VolunteerTrackingMetrics> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading metrics:', error);
    return {};
  }
}
