'use client';

import { useEffect, useState } from 'react';
import { readStoredLocation, readStoredLocations, subscribeToLocationChanges, type StoredLocation } from '@/lib/location-store';
import { useSessionUserId } from '@/hooks/use-session';

export function useCurrentUserLocation() {
  const userId = useSessionUserId();
  const [location, setLocation] = useState<StoredLocation | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const refreshLocation = () => {
      setLocation(readStoredLocation(userId));
    };

    refreshLocation();
    const unsubscribe = subscribeToLocationChanges(refreshLocation);

    return unsubscribe;
  }, [userId]);

  return userId ? location : null;
}

export function useStoredLocations() {
  const [locations, setLocations] = useState<StoredLocation[]>([]);

  useEffect(() => {
    const refreshLocations = () => {
      setLocations(readStoredLocations());
    };

    refreshLocations();
    const unsubscribe = subscribeToLocationChanges(refreshLocations);

    return unsubscribe;
  }, []);

  return locations;
}
