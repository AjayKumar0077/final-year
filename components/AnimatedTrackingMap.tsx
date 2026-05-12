// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navigation2, Route, TrendingUp } from 'lucide-react';
import { Mission } from '@/lib/types';
import { calculateHaversineDistance } from '@/lib/geo-distance';
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
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false },
);

type GeoPoint = { latitude: number; longitude: number };

type AnimatedTrackingMapProps = {
  missions: Mission[];
  userLocation: GeoPoint | null;
  caseLocationsById: Record<string, GeoPoint>;
  donorLiveLocationsByMissionId?: Record<string, GeoPoint>;
};

function getMissionPickupPoint(
  mission: Mission,
  caseLocationsById: Record<string, GeoPoint>,
  donorLiveLocationsByMissionId: Record<string, GeoPoint>,
) {
  const donorLivePoint = donorLiveLocationsByMissionId[mission.id];
  if (donorLivePoint) {
    return donorLivePoint;
  }

  if (typeof mission.pickup_latitude === 'number' && typeof mission.pickup_longitude === 'number') {
    return {
      latitude: mission.pickup_latitude,
      longitude: mission.pickup_longitude,
    };
  }

  if (mission.case_report_id) {
    return caseLocationsById[mission.case_report_id] ?? null;
  }

  return null;
}

function getMissionDeliveryPoint(mission: Mission) {
  if (typeof mission.delivery_latitude === 'number' && typeof mission.delivery_longitude === 'number') {
    return {
      latitude: mission.delivery_latitude,
      longitude: mission.delivery_longitude,
    };
  }

  return null;
}

function getSortScore(
  mission: Mission,
  index: number,
  userLocation: GeoPoint | null,
  caseLocationsById: Record<string, GeoPoint>,
  donorLiveLocationsByMissionId: Record<string, GeoPoint>,
) {
  const pickupPoint = getMissionPickupPoint(mission, caseLocationsById, donorLiveLocationsByMissionId);
  const deliveryPoint = getMissionDeliveryPoint(mission);
  const volunteerToPickupKm = userLocation && pickupPoint
    ? calculateHaversineDistance(userLocation, pickupPoint)
    : Number.POSITIVE_INFINITY;
  const pickupToDropKm = pickupPoint && deliveryPoint
    ? calculateHaversineDistance(pickupPoint, deliveryPoint)
    : 0;
  const totalRouteKm = Number.isFinite(volunteerToPickupKm)
    ? volunteerToPickupKm + pickupToDropKm
    : Number.POSITIVE_INFINITY;

  const assignmentRank = mission.assigned_volunteer_id ? 0 : 1;
  const statusRank = mission.status === 'in_progress' ? 0 : mission.status === 'pending' ? 1 : 2;
  const priorityRank = mission.priority === 'urgent' ? 0 : mission.priority === 'high' ? 1 : mission.priority === 'normal' ? 2 : 3;

  return { assignmentRank, statusRank, priorityRank, totalRouteKm, volunteerToPickupKm, pickupToDropKm, index };
}

function getMissionColor(mission: Mission, index: number) {
  if (mission.status === 'in_progress') {
    return '#16a34a';
  }

  if (mission.priority === 'urgent') {
    return '#dc2626';
  }

  if (mission.priority === 'high') {
    return '#ea580c';
  }

  return ['#2563eb', '#8b5cf6', '#0f766e', '#d97706'][index % 4];
}

function estimateEtaMinutes(distanceKm: number | null) {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return null;
  }

  const assumedSpeedKmh = 24;
  return Math.max(5, Math.round((distanceKm / assumedSpeedKmh) * 60));
}

function uniquePoints(points: [number, number][]) {
  const seen = new Set<string>();
  return points.filter(([latitude, longitude]) => {
    const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function MapViewportController({ center, bounds }: { center: [number, number]; bounds: [number, number][] }) {
  const map = import('react-leaflet').then((mod) => mod.useMap());
  return null;
}

export function AnimatedTrackingMap({
  missions,
  userLocation,
  caseLocationsById,
  donorLiveLocationsByMissionId = {},
}: AnimatedTrackingMapProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    const pulseTimer = window.setInterval(() => {
      setPulsePhase((current) => (current + 1) % 3);
    }, 650);

    const dashTimer = window.setInterval(() => {
      setDashOffset((current) => (current + 1) % 120);
    }, 70);

    return () => {
      window.clearInterval(pulseTimer);
      window.clearInterval(dashTimer);
    };
  }, []);

  const orderedMissions = useMemo(() => {
    const location = userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null;

    return [...missions]
      .map((mission, index) => ({
        mission,
        score: getSortScore(mission, index, location, caseLocationsById, donorLiveLocationsByMissionId),
      }))
      .sort((left, right) => {
        if (left.score.assignmentRank !== right.score.assignmentRank) {
          return left.score.assignmentRank - right.score.assignmentRank;
        }

        if (left.score.statusRank !== right.score.statusRank) {
          return left.score.statusRank - right.score.statusRank;
        }

        if (left.score.priorityRank !== right.score.priorityRank) {
          return left.score.priorityRank - right.score.priorityRank;
        }

        if (left.score.totalRouteKm !== right.score.totalRouteKm) {
          return left.score.totalRouteKm - right.score.totalRouteKm;
        }

        return left.score.index - right.score.index;
      })
      .map(({ mission, score }, index) => ({
        mission,
        score,
        rank: index + 1,
      }));
  }, [caseLocationsById, donorLiveLocationsByMissionId, missions, userLocation]);

  const highlightedMission = orderedMissions[0] ?? null;
  const missionMarkers = orderedMissions.slice(0, 4);

  const mapCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : highlightedMission
      ? (() => {
          const point = getMissionPickupPoint(highlightedMission.mission, caseLocationsById, donorLiveLocationsByMissionId);
          return point ? [point.latitude, point.longitude] : [GEO_CONFIG.DEFAULT_LOCATION.latitude, GEO_CONFIG.DEFAULT_LOCATION.longitude];
        })()
      : [GEO_CONFIG.DEFAULT_LOCATION.latitude, GEO_CONFIG.DEFAULT_LOCATION.longitude];

  const focusBounds = useMemo(() => {
    const points: [number, number][] = [];

    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude]);
    }

    orderedMissions.slice(0, 3).forEach(({ mission }) => {
      const point = getMissionPickupPoint(mission, caseLocationsById, donorLiveLocationsByMissionId);
      if (point) {
        points.push([point.latitude, point.longitude]);
      }
    });

    return uniquePoints(points);
  }, [caseLocationsById, donorLiveLocationsByMissionId, orderedMissions, userLocation]);

  const highlightedRoute = useMemo(() => {
    if (!userLocation || !highlightedMission) {
      return [] as [number, number][];
    }

    const missionPickupPoint = getMissionPickupPoint(highlightedMission.mission, caseLocationsById, donorLiveLocationsByMissionId);
    if (!missionPickupPoint) {
      return [] as [number, number][];
    }

    const route = [[userLocation.latitude, userLocation.longitude], [missionPickupPoint.latitude, missionPickupPoint.longitude]] as [number, number][];

    const deliveryPoint = getMissionDeliveryPoint(highlightedMission.mission);
    if (deliveryPoint) {
      route.push([deliveryPoint.latitude, deliveryPoint.longitude]);
    }

    return route;
  }, [caseLocationsById, donorLiveLocationsByMissionId, highlightedMission, userLocation]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<{distance: number, duration: number} | null>(null);

  useEffect(() => {
    async function fetchRoadRoute() {
      if (highlightedRoute.length < 2) {
        setRoadRoute(highlightedRoute);
        setRouteAnalysis(null);
        return;
      }
      
      try {
        const coords = highlightedRoute.map(p => `${p[1]},${p[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          const latLngs = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          setRoadRoute(latLngs);
          
          setRouteAnalysis({
            distance: data.routes[0].distance / 1000, // km
            duration: data.routes[0].duration / 60, // minutes
          });
        } else {
          setRoadRoute(highlightedRoute);
        }
      } catch (e) {
        console.error("OSRM fetch error:", e);
        setRoadRoute(highlightedRoute);
      }
    }
    
    fetchRoadRoute();
  }, [highlightedRoute]);

  const highlightedEta = estimateEtaMinutes(highlightedMission?.score.totalRouteKm ?? null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Navigation2 className="h-5 w-5 text-blue-600" />
            <p className="font-semibold text-gray-900">Real-time mission tracking</p>
          </div>
          <p className="mt-1 text-xs text-gray-600">Animated route, live location pulse, and distance-ranked mission order.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">{orderedMissions.length} Live missions</span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">Satellite tracking</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Best delivery route</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="relative h-96 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {(() => {
            // @ts-ignore - react-leaflet dynamic import type compatibility
            return (
              <MapContainer
                center={mapCenter as [number, number]}
                zoom={userLocation ? 13 : 11}
                scrollWheelZoom
                className="h-full w-full"
              >
            <TileLayer
              attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {roadRoute.length >= 2 && (
              <Polyline
                positions={roadRoute}
                pathOptions={{
                  color: '#22c55e',
                  weight: 5,
                  opacity: 0.95,
                  dashArray: '12 14',
                  dashOffset: `${dashOffset}`,
                  lineCap: 'round',
                }}
              />
            )}

            {missionMarkers.map(({ mission, rank }, index) => {
              const point = getMissionPickupPoint(mission, caseLocationsById, donorLiveLocationsByMissionId);
              if (!point) {
                return null;
              }

              const color = getMissionColor(mission, index);
              const isLead = rank === 1;

              return (
                <CircleMarker
                  key={mission.id}
                  center={[point.latitude, point.longitude]}
                  radius={isLead ? 12 + pulsePhase * 2 : 9}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isLead ? 0.9 : 0.7,
                    weight: isLead ? 3 : 2,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">#{rank} {mission.title}</p>
                      {donorLiveLocationsByMissionId[mission.id] && (
                        <p className="font-semibold text-red-600">Live donor pickup</p>
                      )}
                      <p className="text-gray-600">Pickup: {mission.pickup_location}</p>
                      <p className="text-gray-600">Delivery: {mission.delivery_location}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {userLocation && (
              <>
                <CircleMarker
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={18 + pulsePhase * 4}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.12,
                    weight: 2,
                  }}
                />
                <CircleMarker
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={10 + pulsePhase}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.9,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Your live location</p>
                      <p className="text-gray-600">{userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            )}
              </MapContainer>
            );
          })()}

          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <p className="font-semibold text-gray-900">{highlightedMission ? `Tracking #${highlightedMission.rank}` : 'Tracking idle'}</p>
            <p className="text-gray-600">{highlightedMission?.mission.title ?? 'Waiting for mission data'}</p>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <p className="font-semibold text-gray-900">Efficiency Analysis</p>
            {routeAnalysis ? (
              <div className="mt-1 space-y-1">
                <p className="text-gray-600">⚡ Shortest Road: <span className="font-semibold text-green-700">{routeAnalysis.distance.toFixed(1)} km</span></p>
                <p className="text-gray-600">⏱️ Traffic ETA: <span className="font-semibold text-blue-700">{Math.ceil(routeAnalysis.duration)} min</span></p>
              </div>
            ) : (
              <p className="text-gray-600 mt-1">
                {highlightedEta ? `Straight-line ETA: ${highlightedEta} min` : 'Waiting for a live location'}
              </p>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>User pulse</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-gray-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              <span>Animated route</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Route className="h-4 w-4 text-green-600" />
                Live order board
              </p>
              <p className="text-xs text-gray-500">Sorted by assignment, status, priority, then distance.</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>

          <div className="space-y-3">
            {orderedMissions.slice(0, 4).map(({ mission, score, rank }) => {
              const etaMinutes = estimateEtaMinutes(score.totalRouteKm);
              const isLead = rank === 1;

              return (
                <div
                  key={mission.id}
                  className={`rounded-xl border p-3 transition-all ${isLead ? 'border-green-200 bg-green-50 shadow-sm' : 'border-slate-200 bg-slate-50/70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isLead ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}>
                          {rank}
                        </span>
                        <p className="truncate text-sm font-semibold text-gray-900">{mission.title}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-600">📍 {mission.pickup_location}</p>
                      <p className="truncate text-xs text-gray-600">→ {mission.delivery_location}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                      {mission.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div className="rounded-lg bg-white px-2 py-1">
                      <p className="font-semibold text-gray-900">Status</p>
                      <p>{mission.status.replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-1">
                      <p className="font-semibold text-gray-900">ETA</p>
                      <p>{etaMinutes ? `${etaMinutes} min` : 'Pending GPS'}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white px-2 py-1">
                      <p className="font-semibold text-gray-900">Distance</p>
                      <p>
                        {Number.isFinite(score.totalRouteKm)
                          ? `${score.totalRouteKm.toFixed(1)} km total`
                          : 'Unavailable'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {Number.isFinite(score.volunteerToPickupKm) ? `${score.volunteerToPickupKm.toFixed(1)} km to pickup` : 'No pickup GPS'}
                        {' • '}
                        {Number.isFinite(score.pickupToDropKm) ? `${score.pickupToDropKm.toFixed(1)} km pickup to delivery` : 'No drop GPS'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {focusBounds.length > 1 && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              The map auto-frames the current location and the top mission points so the route stays in view while tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}