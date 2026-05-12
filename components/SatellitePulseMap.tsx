// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
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
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false },
);
const MapClickHandler = dynamic(
  () => import('./MapClickHandler').then((mod) => mod.MapClickHandler),
  { ssr: false },
);

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  color?: string;
};

type SatellitePulseMapProps = {
  center: GeoPoint;
  markers?: MapMarker[];
  heightClassName?: string;
  zoom?: number;
  centerLabel?: string;
  showCenterPulse?: boolean;
  enablePinSelection?: boolean;
  pinnedPoint?: GeoPoint | null;
  onPinSelect?: (point: GeoPoint) => void;
};

export function SatellitePulseMap({
  center,
  markers = [],
  heightClassName = 'h-80',
  zoom = 12,
  centerLabel = 'Current location',
  showCenterPulse = true,
  enablePinSelection = false,
  pinnedPoint = null,
  onPinSelect,
}: SatellitePulseMapProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    const pulseTimer = window.setInterval(() => {
      setPulsePhase((current) => (current + 1) % 3);
    }, 650);

    const dashTimer = window.setInterval(() => {
      setDashOffset((current) => (current + 2) % 120);
    }, 80);

    return () => {
      window.clearInterval(pulseTimer);
      window.clearInterval(dashTimer);
    };
  }, []);

  const primaryRoute = useMemo(() => {
    if (markers.length === 0) {
      return [] as [number, number][];
    }

    const lead = markers[0];
    return [
      [center.latitude, center.longitude],
      [lead.latitude, lead.longitude],
    ] as [number, number][];
  }, [center.latitude, center.longitude, markers]);

  const uniqueMarkers = useMemo(() => {
    const seen = new Set<string>();
    return markers.filter((marker) => {
      const key = `${marker.latitude.toFixed(5)}:${marker.longitude.toFixed(5)}:${marker.label}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [markers]);

  const safeCenter = center ?? GEO_CONFIG.DEFAULT_LOCATION;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-blue-200 bg-slate-100 ${heightClassName}`}>
      <MapContainer
        center={[safeCenter.latitude, safeCenter.longitude]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        {enablePinSelection && onPinSelect && (
          <MapClickHandler onPinSelect={onPinSelect} />
        )}
        <TileLayer
          attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {primaryRoute.length === 2 && (
          <Polyline
            positions={primaryRoute}
            pathOptions={{
              color: '#22c55e',
              weight: 4,
              opacity: 0.95,
              dashArray: '12 14',
              dashOffset: `${dashOffset}`,
            }}
          />
        )}

        {uniqueMarkers.map((marker, index) => {
          const color = marker.color ?? ['#f59e0b', '#16a34a', '#8b5cf6', '#0ea5e9'][index % 4];

          return (
            <CircleMarker
              key={marker.id}
              center={[marker.latitude, marker.longitude]}
              radius={index === 0 ? 10 + pulsePhase : 8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: index === 0 ? 3 : 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{marker.label}</p>
                  {marker.description ? (
                    <p className="text-gray-600">{marker.description}</p>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {pinnedPoint ? (
          <CircleMarker
            center={[pinnedPoint.latitude, pinnedPoint.longitude]}
            radius={11}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Pinned location</p>
                <p className="text-gray-600">
                  {pinnedPoint.latitude.toFixed(5)}, {pinnedPoint.longitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ) : null}

        {showCenterPulse ? (
          <>
            <CircleMarker
              center={[center.latitude, center.longitude]}
              radius={17 + pulsePhase * 4}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.13,
                weight: 2,
              }}
            />
            <CircleMarker
              center={[center.latitude, center.longitude]}
              radius={9 + pulsePhase}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.9,
                weight: 3,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{centerLabel}</p>
                  <p className="text-gray-600">
                    {safeCenter.latitude.toFixed(5)}, {safeCenter.longitude.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          </>
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-white/40 bg-white/85 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow">
        {enablePinSelection ? 'Click map to pin location' : 'Satellite + animated tracking'}
      </div>
    </div>
  );
}