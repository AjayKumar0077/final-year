'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionUserId } from '@/hooks/use-session';
import { useCurrentUserLocation } from '@/hooks/use-location-store';
import {
  recordVolunteerLocation,
  getVolunteerCurrentLocation,
  getVolunteerMovementStatus,
  startJourneySegment,
  addJourneyWaypoint,
  completeJourneySegment,
  getActiveJourney,
  getVolunteerJourneys,
  getVolunteerMetrics,
  getVolunteerLocationHistory,
  type VolunteerLocationPoint,
  type VolunteerJourneySegment,
  type VolunteerTrackingMetrics,
} from '@/lib/volunteer-tracking';

/**
 * Hook to track volunteer's location and journey for a mission
 */
export function useVolunteerTracking(missionId?: string) {
  const volunteerId = useSessionUserId();
  const userLocation = useCurrentUserLocation();
  const [currentLocation, setCurrentLocation] = useState<VolunteerLocationPoint | null>(null);
  const [movementStatus, setMovementStatus] = useState<'idle' | 'in_transit' | 'moving_slowly'>('idle');
  const [activeJourney, setActiveJourney] = useState<VolunteerJourneySegment | null>(null);
  const [journeyHistory, setJourneyHistory] = useState<VolunteerJourneySegment[]>([]);
  const [metrics, setMetrics] = useState<VolunteerTrackingMetrics | null>(null);
  const journeyRef = useRef<string | null>(null);

  // Record location whenever user location updates
  useEffect(() => {
    if (!volunteerId || !userLocation) return;

    const locationPoint: VolunteerLocationPoint = {
      volunteerId,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      timestamp: userLocation.timestamp,
      accuracy: userLocation.accuracy,
      missionId: missionId,
      status: 'idle', // Will be updated based on movement
    };

    recordVolunteerLocation(locationPoint);
    setCurrentLocation(locationPoint);
  }, [volunteerId, userLocation, missionId]);

  // Update movement status periodically
  useEffect(() => {
    if (!volunteerId) return;

    const interval = setInterval(() => {
      const status = getVolunteerMovementStatus(volunteerId);
      setMovementStatus(status);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [volunteerId]);

  // Start journey when mission is assigned
  const startMission = useCallback(() => {
    if (!volunteerId || !missionId || !currentLocation) return;

    const journeyId = startJourneySegment(volunteerId, missionId, {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: currentLocation.timestamp,
    });

    journeyRef.current = journeyId;
    setActiveJourney(getActiveJourney(volunteerId));
  }, [volunteerId, missionId, currentLocation]);

  // Add waypoint to active journey
  useEffect(() => {
    if (!volunteerId || !journeyRef.current || !currentLocation) return;

    addJourneyWaypoint(journeyRef.current, volunteerId, currentLocation);
  }, [volunteerId, currentLocation]);

  // Refresh journey list
  useEffect(() => {
    if (!volunteerId) return;

    const handleUpdate = () => {
      setJourneyHistory(getVolunteerJourneys(volunteerId));
      setActiveJourney(getActiveJourney(volunteerId));
    };

    window.addEventListener('journey-updated', handleUpdate);
    window.addEventListener('journey-completed', handleUpdate);

    return () => {
      window.removeEventListener('journey-updated', handleUpdate);
      window.removeEventListener('journey-completed', handleUpdate);
    };
  }, [volunteerId]);

  // Update metrics
  useEffect(() => {
    if (!volunteerId) return;

    const handleMetricsUpdate = () => {
      const updatedMetrics = getVolunteerMetrics(volunteerId);
      if (updatedMetrics) {
        setMetrics(updatedMetrics);
      }
    };

    handleMetricsUpdate();
    const interval = setInterval(handleMetricsUpdate, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [volunteerId]);

  // Complete journey
  const endMission = useCallback(async () => {
    if (!volunteerId || !journeyRef.current || !currentLocation) return;

    completeJourneySegment(journeyRef.current, volunteerId, {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: currentLocation.timestamp,
    });

    journeyRef.current = null;
    setActiveJourney(null);
  }, [volunteerId, currentLocation]);

  return {
    currentLocation,
    movementStatus,
    activeJourney,
    journeyHistory,
    metrics,
    startMission,
    endMission,
    isTracking: !!journeyRef.current,
  };
}

/**
 * Hook to get location history for visualization
 */
export function useVolunteerLocationHistory(volunteerId?: string, limitPoints: number = 50) {
  const [locationHistory, setLocationHistory] = useState<VolunteerLocationPoint[]>([]);

  useEffect(() => {
    if (!volunteerId) return;

    const updateHistory = () => {
      const history = getVolunteerLocationHistory(volunteerId, limitPoints);
      setLocationHistory(history);
    };

    updateHistory();

    const handleLocationUpdate = () => updateHistory();
    window.addEventListener('volunteer-location-updated', handleLocationUpdate);

    return () => {
      window.removeEventListener('volunteer-location-updated', handleLocationUpdate);
    };
  }, [volunteerId, limitPoints]);

  return locationHistory;
}

/**
 * Hook to get current location of a specific volunteer
 */
export function useVolunteerCurrentLocation(volunteerId?: string) {
  const [location, setLocation] = useState<VolunteerLocationPoint | null>(null);

  useEffect(() => {
    if (!volunteerId) return;

    const updateLocation = () => {
      const current = getVolunteerCurrentLocation(volunteerId);
      setLocation(current);
    };

    updateLocation();

    const handleLocationUpdate = () => updateLocation();
    window.addEventListener('volunteer-location-updated', handleLocationUpdate);

    return () => {
      window.removeEventListener('volunteer-location-updated', handleLocationUpdate);
    };
  }, [volunteerId]);

  return location;
}
