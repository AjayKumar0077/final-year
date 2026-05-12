'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUserLocation } from '@/hooks/use-location-store';
import { useSessionUserId } from '@/hooks/use-session';
import { LOCATION_RETRY_EVENT } from '@/components/GeoLocationTracker';

type PermissionStateLike = 'granted' | 'prompt' | 'denied' | 'unsupported';

export function LocationAccessPrompt() {
  const location = useCurrentUserLocation();
  const userId = useSessionUserId();
  const hasSession = Boolean(userId);
  const [permissionState, setPermissionState] = useState<PermissionStateLike>('prompt');
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const dismissed = Boolean(userId && dismissedUserId === userId);

  const refreshPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      return;
    }

    setCheckingPermission(true);

    if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function') {
      setPermissionState('unsupported');
      setCheckingPermission(false);
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionState(result.state as PermissionStateLike);
      result.onchange = () => {
        setPermissionState(result.state as PermissionStateLike);
      };
    } catch {
      setPermissionState('prompt');
    } finally {
      setCheckingPermission(false);
    }
  }, []);

  useEffect(() => {
    refreshPermission().catch(() => {
      setPermissionState('prompt');
      setCheckingPermission(false);
    });

    const handleFocus = () => {
      refreshPermission().catch(() => {
        setCheckingPermission(false);
      });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshPermission]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    if (permissionState === 'granted') {
      window.dispatchEvent(new Event(LOCATION_RETRY_EVENT));
    }
  }, [hasSession, permissionState]);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionState('granted');
        window.dispatchEvent(new Event(LOCATION_RETRY_EVENT));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (!hasSession || dismissed) {
    return null;
  }

  if (location && permissionState !== 'denied') {
    return null;
  }

  if (permissionState === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-amber-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-semibold text-slate-900">Enable location access</p>
      <p className="mt-1 text-xs text-slate-600">
        FoodBridge needs location access to auto-capture live position for your active role.
      </p>

      <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
        {checkingPermission ? 'Checking permission...' : `Status: ${permissionState}`}
      </div>

      {permissionState === 'denied' && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-700">
          <p className="font-semibold">Location is blocked in browser settings.</p>
          <p className="mt-1">Quick fix: Click the lock icon near the URL, allow Location for localhost, then press &quot;I enabled location&quot;.</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
        >
          Retry Location Access
        </button>
        <button
          type="button"
          onClick={() => {
            refreshPermission().catch(() => {
              setCheckingPermission(false);
            });
            window.dispatchEvent(new Event(LOCATION_RETRY_EVENT));
          }}
          className="inline-flex items-center justify-center rounded-md border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
          I enabled location
        </button>
        <button
          type="button"
          onClick={() => setDismissedUserId(userId ?? null)}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
