// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Navigation2 } from 'lucide-react';
import { useCurrentUserLocation, useStoredLocations } from '@/hooks/use-location-store';
import { GEO_CONFIG } from '@/lib/config';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false },
);

interface LocationData {
  userId: string;
  userName: string;
  userRole: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function LiveLocationMap() {
  const storedLocations = useStoredLocations() as LocationData[];
  const userLocation = useCurrentUserLocation();
  const [showMarkers, setShowMarkers] = useState(true);

  const locations = useMemo(() => {
    const seen = new Set<string>();
    const nextLocations: LocationData[] = [];

    storedLocations.forEach((location) => {
      const key = `${location.latitude.toFixed(5)}:${location.longitude.toFixed(5)}:${location.userRole}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      nextLocations.push(location);
    });

    if (userLocation) {
      const currentUserMarker: LocationData = {
        userId: userLocation.userId,
        userName: 'Your live location',
        userRole: userLocation.userRole,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: userLocation.timestamp,
      };

      const duplicateIndex = nextLocations.findIndex((item) => item.userId === currentUserMarker.userId);

      if (duplicateIndex >= 0) {
        nextLocations[duplicateIndex] = currentUserMarker;
      } else {
        nextLocations.unshift(currentUserMarker);
      }
    }

    return nextLocations;
  }, [storedLocations, userLocation]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'volunteer':
        return { bg: '#3b82f6', bgClass: 'bg-blue-500', label: '🚗 Volunteer' };
      case 'donor':
        return { bg: '#10b981', bgClass: 'bg-green-500', label: '🎁 Donor' };
      case 'reporter':
        return { bg: '#f59e0b', bgClass: 'bg-amber-500', label: '📍 Reporter' };
      case 'ngo':
        return { bg: '#8b5cf6', bgClass: 'bg-purple-500', label: '🏢 NGO' };
      default:
        return { bg: '#6b7280', bgClass: 'bg-gray-500', label: '👤 User' };
    }
  };

  const mapCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [GEO_CONFIG.DEFAULT_LOCATION.latitude, GEO_CONFIG.DEFAULT_LOCATION.longitude];

  if (locations.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <p>No live locations captured yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Navigation2 className="w-5 h-5 text-blue-600" />
          Satellite Live Location Map
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
          {locations.length} Active Users
        </span>
      </div>

      {/* Main Map */}
      <div className="relative h-96 border border-slate-200 rounded-lg overflow-hidden mb-4">
        <MapContainer
          center={mapCenter}
          zoom={showMarkers ? 12 : 10}
          scrollWheelZoom
          className="leaflet-map h-full w-full"
        >
          <TileLayer
            attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {showMarkers && locations.map((loc) => {
            const color = getRoleColor(loc.userRole);
            return (
              <CircleMarker
                key={loc.userId}
                center={[loc.latitude, loc.longitude]}
                radius={9}
                pathOptions={{
                  color: color.bg,
                  fillColor: color.bg,
                  fillOpacity: 0.65,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{loc.userName}</p>
                    <p>{color.label}</p>
                    <p>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</p>
                    <p className="text-xs text-gray-500">Updated: {new Date(loc.timestamp).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 bg-white rounded-lg p-2 shadow-md border border-gray-200 z-10 text-xs">
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className="text-gray-700 hover:text-gray-900 font-semibold"
          >
            {showMarkers ? '👁️ Hide' : '👁️ Show'} Markers
          </button>
        </div>

        {/* Your Location Info */}
        {userLocation && (
          <div className="absolute bottom-3 left-3 bg-white rounded-lg p-2 shadow-md border border-gray-200 z-10 text-xs">
            <p className="font-semibold text-gray-700">Your Location</p>
            <p className="text-gray-600 font-mono">
              {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* User List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {locations.map((loc) => {
          const color = getRoleColor(loc.userRole);
          return (
            <div key={loc.userId} className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${color.bgClass}`}></div>
                <p className="font-semibold text-sm text-gray-900 truncate">{loc.userName}</p>
              </div>
              <p className="text-xs text-gray-600 mb-1">{color.label}</p>
              <p className="text-xs font-mono text-gray-500">
                📍 {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(loc.timestamp).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">🚗 Volunteers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">🎁 Donors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">📍 Reporters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">🏢 NGOs</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
