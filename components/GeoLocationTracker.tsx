'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { writeStoredLocation } from '@/lib/location-store';
import { calculateHaversineDistance } from '@/lib/geo-distance';
import type { UserRole } from '@/lib/types';

type SessionLike = {
  user: {
    id: string;
    email?: string;
  };
};

type LastSavedPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

const LOCATION_MAX_AGE_MS = 5000;
const LOCATION_TIMEOUT_MS = 12000;
const MIN_SAVE_INTERVAL_MS = 7000;
const MIN_MOVEMENT_KM = 0.02;
const DENIED_LOG_COOLDOWN_MS = 30000;
export const LOCATION_RETRY_EVENT = 'foodbridge-location-retry';

export function GeoLocationTracker() {
  useEffect(() => {
    let cancelled = false;
    let watchId: number | null = null;
    let activeSessionUserId: string | null = null;
    const lastSavedPointByUserId: Record<string, LastSavedPoint> = {};
    const lastDeniedLogByUserId: Record<string, number> = {};
    let triggerCurrentCapture: (() => void) | null = null;

    const clearWatch = () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      watchId = null;
      triggerCurrentCapture = null;
    };

    const shouldPersistLocation = (userId: string, latitude: number, longitude: number) => {
      const now = Date.now();
      const previous = lastSavedPointByUserId[userId];
      if (!previous) {
        return true;
      }

      if (now - previous.timestamp >= MIN_SAVE_INTERVAL_MS) {
        return true;
      }

      const movedKm = calculateHaversineDistance(
        { latitude: previous.latitude, longitude: previous.longitude },
        { latitude, longitude },
      );

      return movedKm >= MIN_MOVEMENT_KM;
    };

    const persistLocation = async (
      supabase: ReturnType<typeof createClient>,
      session: SessionLike,
      userName: string,
      userRole: UserRole,
      latitude: number,
      longitude: number,
    ) => {
      if (cancelled || !shouldPersistLocation(session.user.id, latitude, longitude)) {
        return;
      }

      const now = Date.now();
      lastSavedPointByUserId[session.user.id] = {
        latitude,
        longitude,
        timestamp: now,
      };

      writeStoredLocation({
        userId: session.user.id,
        userName,
        userRole,
        latitude,
        longitude,
        timestamp: now,
      });

      try {
        await supabase
          .from('users')
          .update({
            latitude,
            longitude,
            updated_at: new Date(now).toISOString(),
          })
          .eq('id', session.user.id);
      } catch (error) {
        console.debug('Location sync to users table failed:', error);
      }
    };

    const logPermissionDenied = (userId: string, source: 'capture' | 'watch') => {
      const now = Date.now();
      const previous = lastDeniedLogByUserId[userId] ?? 0;
      if (now - previous < DENIED_LOG_COOLDOWN_MS) {
        return;
      }

      lastDeniedLogByUserId[userId] = now;
      if (source === 'watch') {
        console.warn('Watch position permission denied.');
      } else {
        console.warn('Geolocation permission denied for current session.');
      }
    };

    const startTrackingForSession = async (session: SessionLike | null, forceRestart = false) => {
      if (!('geolocation' in navigator)) {
        return;
      }

      if (!session || cancelled) {
        activeSessionUserId = null;
        clearWatch();
        return;
      }

      if (!forceRestart && activeSessionUserId === session.user.id && watchId !== null) {
        return;
      }

      clearWatch();
      activeSessionUserId = session.user.id;

      const supabase = createClient();
      const profile = await getUserProfileOrFallback(supabase, session.user);
      const userName = profile.full_name || session.user.email || 'User';
      const userRole = profile.role;

      const saveLocation = (latitude: number, longitude: number) => {
        persistLocation(supabase, session, userName, userRole, latitude, longitude).catch((error) => {
          console.error('Error persisting geolocation:', error);
        });
      };

      triggerCurrentCapture = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!cancelled) {
              saveLocation(position.coords.latitude, position.coords.longitude);
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              logPermissionDenied(session.user.id, 'capture');
              return;
            }
            console.log('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: LOCATION_MAX_AGE_MS,
            timeout: LOCATION_TIMEOUT_MS,
          }
        );
      };

      triggerCurrentCapture();

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!cancelled) {
            saveLocation(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            logPermissionDenied(session.user.id, 'watch');
            return;
          }
          console.log('Watch position error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: LOCATION_MAX_AGE_MS,
          timeout: LOCATION_TIMEOUT_MS,
        }
      );
    };

    const supabase = createClient();

    const syncTracking = async (forceRestart = false) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await startTrackingForSession((session as SessionLike | null) ?? null, forceRestart);
    };

    syncTracking().catch((error) => {
      console.error('Error starting geo tracker:', error);
    });

    const auth = supabase.auth as unknown as {
      onAuthStateChange?: (cb: (event: string) => void) => { data: { subscription: { unsubscribe: () => void } } };
    };

    const subscription = auth.onAuthStateChange
      ? auth.onAuthStateChange(() => {
          syncTracking().catch((error) => {
            console.error('Error syncing geo tracker session:', error);
          });
        })
      : null;

    const handleVisibilityOrFocus = () => {
      if (!cancelled) {
        syncTracking(false).catch((error) => {
          console.error('Error refreshing geo tracker on focus/visibility:', error);
        });
      }
    };

    const handleManualRetry = () => {
      if (!cancelled) {
        syncTracking(true).catch((error) => {
          console.error('Error restarting geo tracker after retry:', error);
        });
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener(LOCATION_RETRY_EVENT, handleManualRetry as EventListener);

    return () => {
      cancelled = true;
      subscription?.data.subscription.unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener(LOCATION_RETRY_EVENT, handleManualRetry as EventListener);
      clearWatch();
    };
  }, []);

  return null;
}
