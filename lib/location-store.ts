import type { UserRole } from '@/lib/types';

export interface StoredLocation {
  userId: string;
  userName: string;
  userRole: UserRole;
  latitude: number;
  longitude: number;
  timestamp: number;
}

const STORAGE_KEY = 'user_locations';
const LOCATION_CHANGE_EVENT = 'user_locations_updated';

type StoredLocationMap = Record<string, StoredLocation>;

function isStoredLocation(value: unknown): value is StoredLocation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredLocation>;
  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.userName === 'string' &&
    typeof candidate.userRole === 'string' &&
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number' &&
    typeof candidate.timestamp === 'number'
  );
}

function readLocationMap(): StoredLocationMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return Object.entries(parsed).reduce<StoredLocationMap>((accumulator, [userId, value]) => {
      if (isStoredLocation(value)) {
        accumulator[userId] = value;
      }
      return accumulator;
    }, {});
  } catch (error) {
    console.error('Error reading stored locations:', error);
    return {};
  }
}

export function readStoredLocations(): StoredLocation[] {
  return Object.values(readLocationMap()).sort((left, right) => right.timestamp - left.timestamp);
}

export function readStoredLocation(userId: string | null | undefined): StoredLocation | null {
  if (!userId) {
    return null;
  }

  return readLocationMap()[userId] ?? null;
}

export function writeStoredLocation(location: StoredLocation) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storedLocations = readLocationMap();
    storedLocations[location.userId] = location;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLocations));
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
  } catch (error) {
    console.error('Error storing location:', error);
  }
}

export function subscribeToLocationChanges(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };

  window.addEventListener(LOCATION_CHANGE_EVENT, listener);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(LOCATION_CHANGE_EVENT, listener);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
