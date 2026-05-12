// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, LocateFixed } from 'lucide-react';
import { SatellitePulseMap } from '@/components/SatellitePulseMap';
import { writeStoredLocation } from '@/lib/location-store';
import { isLocationInIndia } from '@/lib/geo-validation';
import { GEO_CONFIG } from '@/lib/config';
import type { UserRole } from '@/lib/types';

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type RoleLocationPanelProps = {
  title: string;
  userId?: string | null;
  userName?: string | null;
  userRole: UserRole;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null;
};

export function RoleLocationPanel({
  title,
  userId,
  userName,
  userRole,
  currentLocation,
}: RoleLocationPanelProps) {
  const [pinnedLatitude, setPinnedLatitude] = useState<number | null>(null);
  const [pinnedLongitude, setPinnedLongitude] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (pinnedLatitude !== null && pinnedLongitude !== null) {
      return;
    }

    if (currentLocation) {
      setPinnedLatitude(currentLocation.latitude);
      setPinnedLongitude(currentLocation.longitude);
    }
  }, [currentLocation, pinnedLatitude, pinnedLongitude]);

  const mapCenter = useMemo(() => {
    if (pinnedLatitude !== null && pinnedLongitude !== null) {
      return {
        latitude: pinnedLatitude,
        longitude: pinnedLongitude,
      };
    }

    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
    }

    return {
      latitude: GEO_CONFIG.DEFAULT_LOCATION.latitude,
      longitude: GEO_CONFIG.DEFAULT_LOCATION.longitude,
    };
  }, [currentLocation, pinnedLatitude, pinnedLongitude]);

  const pinPoint =
    pinnedLatitude !== null && pinnedLongitude !== null
      ? { latitude: pinnedLatitude, longitude: pinnedLongitude }
      : null;

  const handleSaveLocation = () => {
    if (!userId) {
      setStatusMessage('Unable to save location: no active user session.');
      return;
    }

    if (pinnedLatitude === null || pinnedLongitude === null) {
      setStatusMessage('Please set a pin first.');
      return;
    }

    if (!isLocationInIndia(pinnedLatitude, pinnedLongitude)) {
      setStatusMessage('Pinned location must be inside India.');
      return;
    }

    writeStoredLocation({
      userId,
      userName: userName || 'User',
      userRole,
      latitude: pinnedLatitude,
      longitude: pinnedLongitude,
      timestamp: Date.now(),
    });

    setStatusMessage(`Saved location: ${pinnedLatitude.toFixed(5)}, ${pinnedLongitude.toFixed(5)}`);
  };

  return (
    <Card className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Click the map to drop a pin and save your role location.</p>
        </div>
        <span className="text-xs bg-white/90 border border-blue-200 text-blue-800 px-3 py-1 rounded-full font-semibold capitalize">
          {userRole}
        </span>
      </div>

      <SatellitePulseMap
        center={mapCenter}
        markers={currentLocation ? [{
          id: 'live-location',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          label: 'Live device location',
          description: 'Auto-captured by geolocation service',
          color: '#16a34a',
        }] : []}
        pinnedPoint={pinPoint}
        enablePinSelection
        onPinSelect={(point: GeoPoint) => {
          setPinnedLatitude(point.latitude);
          setPinnedLongitude(point.longitude);
          setStatusMessage('');
        }}
        heightClassName="h-72"
        zoom={13}
        centerLabel="Role location center"
      />

      <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Selected Location:</span>
        </div>
        <div className="font-mono text-gray-600">
          {pinnedLatitude !== null && pinnedLongitude !== null ? (
            `${pinnedLatitude.toFixed(5)}, ${pinnedLongitude.toFixed(5)}`
          ) : (
            'No pin selected'
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" onClick={handleSaveLocation} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <LocateFixed className="w-4 h-4" />
          Save Location
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPinnedLatitude(currentLocation?.latitude ?? null);
            setPinnedLongitude(currentLocation?.longitude ?? null);
            setStatusMessage('');
          }}
        >
          Reset To Live Location
        </Button>
      </div>

      {statusMessage ? (
        <p className="mt-3 text-xs font-medium text-blue-800">{statusMessage}</p>
      ) : null}
    </Card>
  );
}
