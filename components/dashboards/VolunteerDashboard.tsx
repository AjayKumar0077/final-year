// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Heart, Clock, CheckCircle2, Bell, X, Navigation2 } from 'lucide-react';
import { Mission, UserProfile } from '@/lib/types';
import { useCurrentUserLocation, useStoredLocations } from '@/hooks/use-location-store';
import { updateMissionAssignmentOrderStatus } from '@/lib/mission-order-store';
import { useCurrentVolunteerMissionOrders } from '@/hooks/use-mission-orders';
import { calculateHaversineDistance } from '@/lib/geo-distance';
import { writeAuditEvent } from '@/lib/audit-log';
import { formatMissionTrackingStatus, getMissionTrackingStatus } from '@/lib/tracking-status';
import { AnimatedTrackingMap } from '@/components/AnimatedTrackingMap';
import { dedupeMissions } from '@/lib/data-utils';
import { RoleLocationPanel } from '@/components/RoleLocationPanel';

interface Notification {
  id: string;
  mission: Mission;
  timestamp: number;
}

type DonationLite = {
  id: string;
  donor_id: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
};

function getMissionGeoPoint(mission: Mission, caseLocationsById: Record<string, { latitude: number; longitude: number }>) {
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

function getMissionLiveSortScore(
  mission: Mission,
  index: number,
  userLocation: { latitude: number; longitude: number } | null,
  caseLocationsById: Record<string, { latitude: number; longitude: number }>,
) {
  const missionLocation = getMissionGeoPoint(mission, caseLocationsById);
  const distanceKm = userLocation && missionLocation
    ? calculateHaversineDistance(userLocation, missionLocation)
    : Number.POSITIVE_INFINITY;

  const assignmentRank = mission.assigned_volunteer_id ? 0 : 1;
  const statusRank = mission.status === 'in_progress' ? 0 : mission.status === 'pending' ? 1 : 2;
  const priorityRank = mission.priority === 'urgent' ? 0 : mission.priority === 'high' ? 1 : mission.priority === 'normal' ? 2 : 3;

  return {
    distanceKm,
    assignmentRank,
    statusRank,
    priorityRank,
    index,
  };
}

export function VolunteerDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [caseLocationsById, setCaseLocationsById] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [assignedMission, setAssignedMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [donationById, setDonationById] = useState<Record<string, DonationLite>>({});
  const userLocation = useCurrentUserLocation();
  const storedLocations = useStoredLocations();
  const missionOrders = useCurrentVolunteerMissionOrders();
  const missionCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const activeAssignmentOrder = useMemo(
    () => missionOrders.find((order) => order.status === 'sent' || order.status === 'accepted') || null,
    [missionOrders],
  );
  const assignedMissionView = assignedMission ?? activeAssignmentOrder?.mission ?? null;
  const storedLocationByUserId = useMemo(
    () =>
      storedLocations.reduce<Record<string, { latitude: number; longitude: number }>>((accumulator, item) => {
        accumulator[item.userId] = {
          latitude: item.latitude,
          longitude: item.longitude,
        };
        return accumulator;
      }, {}),
    [storedLocations],
  );

  const donorLiveLocationsByMissionId = useMemo(() => {
    return missions.reduce<Record<string, { latitude: number; longitude: number }>>((accumulator, mission) => {
      if (mission.source_entity_type !== 'donation' || !mission.source_entity_id) {
        return accumulator;
      }

      const sourceDonation = donationById[mission.source_entity_id];
      if (!sourceDonation?.donor_id) {
        return accumulator;
      }

      const donorLivePoint = storedLocationByUserId[sourceDonation.donor_id];
      if (donorLivePoint) {
        accumulator[mission.id] = donorLivePoint;
      }

      return accumulator;
    }, {});
  }, [donationById, missions, storedLocationByUserId]);

  const computeRouteMetrics = useCallback((mission: Mission) => {
    const missionSourceDonation =
      mission.source_entity_type === 'donation' && mission.source_entity_id
        ? donationById[mission.source_entity_id]
        : null;
    const donorLivePointFromSource = missionSourceDonation?.donor_id
      ? storedLocationByUserId[missionSourceDonation.donor_id] ?? null
      : null;

    const pickupPoint = (() => {
      const donorLive = donorLiveLocationsByMissionId[mission.id] ?? donorLivePointFromSource;
      if (donorLive) {
        return donorLive;
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
    })();

    const deliveryPoint =
      typeof mission.delivery_latitude === 'number' && typeof mission.delivery_longitude === 'number'
        ? { latitude: mission.delivery_latitude, longitude: mission.delivery_longitude }
        : null;

    const volunteerPoint = userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : null;

    const toPickupKm = volunteerPoint && pickupPoint
      ? calculateHaversineDistance(volunteerPoint, pickupPoint)
      : Number.NaN;
    const pickupToDropKm = pickupPoint && deliveryPoint
      ? calculateHaversineDistance(pickupPoint, deliveryPoint)
      : Number.NaN;
    const totalKm = Number.isFinite(toPickupKm)
      ? toPickupKm + (Number.isFinite(pickupToDropKm) ? pickupToDropKm : 0)
      : Number.NaN;
    const etaMinutes = Number.isFinite(totalKm)
      ? Math.max(5, Math.round((totalKm / 24) * 60))
      : null;

    return {
      donorLive: donorLiveLocationsByMissionId[mission.id] ?? donorLivePointFromSource,
      toPickupKm,
      pickupToDropKm,
      totalKm,
      etaMinutes,
    };
  }, [caseLocationsById, donationById, donorLiveLocationsByMissionId, storedLocationByUserId, userLocation]);
  const nearbyMissions = useMemo(() => {
    const location = userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null;

    return [...missions]
      .map((mission, index) => ({
        mission,
        score: getMissionLiveSortScore(mission, index, location, caseLocationsById),
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

        if (left.score.distanceKm !== right.score.distanceKm) {
          return left.score.distanceKm - right.score.distanceKm;
        }

        return left.score.index - right.score.index;
      })
      .map(({ mission }) => mission);
  }, [caseLocationsById, missions, userLocation]);

  const liveTrackingMissions = useMemo(() => {
    return nearbyMissions.map((mission, index) => {
      const missionLocation = getMissionGeoPoint(mission, caseLocationsById);
      const distanceKm = userLocation && missionLocation
        ? calculateHaversineDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            missionLocation
          )
        : null;

      return {
        mission,
        distanceKm,
        isAssigned: Boolean(mission.assigned_volunteer_id),
        isActive: mission.status === 'in_progress',
        rank: index + 1,
      };
    });
  }, [caseLocationsById, nearbyMissions, userLocation]);

  const startMissionPolling = useCallback(() => {
    // Poll for new missions every 3 seconds for live updates
    pollingInterval.current = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const availableRes = await supabase
            .from('missions')
            .select('*')
            .is('assigned_volunteer_id', null)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (availableRes.data) {
            const latestMissions = availableRes.data as Mission[];
            setMissions((prev) => {
              const previousIds = new Set(prev.map((mission) => mission.id));
              const newMissions = latestMissions.filter(
                (mission) => !previousIds.has(mission.id)
              );

              if (newMissions.length > 0) {
                const newNotifications = newMissions.map((mission) => ({
                  id: mission.id,
                  mission,
                  timestamp: Date.now(),
                }));
                setNotifications((current) => [...newNotifications, ...current].slice(0, 5));
              }

              return dedupeMissions(latestMissions);
            });
          }
        }
      } catch (error) {
        console.error('Error polling missions:', error);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    startMissionPolling();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [startMissionPolling]);

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, missionId: string) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Swipe right to accept (threshold: 100px horizontal, less than 50px vertical)
    if (diffX < -100 && Math.abs(diffY) < 50) {
      handleAcceptMission(missionId);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const [userRes, assignedRes, availableRes, caseReportsRes] = await Promise.all([
          getUserProfileOrFallback(supabase, session.user),
          supabase
            .from('missions')
            .select('*')
            .eq('assigned_volunteer_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('missions')
            .select('*')
            .is('assigned_volunteer_id', null)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('case_reports')
            .select('id, latitude, longitude'),
        ]);

        const allMissionRows = dedupeMissions([
          ...((assignedRes.data as Mission[] | null) ?? []),
          ...((availableRes.data as Mission[] | null) ?? []),
        ]);

        const donationSourceIds = Array.from(
          new Set(
            allMissionRows
              .filter((mission) => mission.source_entity_type === 'donation' && typeof mission.source_entity_id === 'string')
              .map((mission) => mission.source_entity_id as string),
          ),
        );

        if (donationSourceIds.length > 0) {
          const { data: donationRows } = await supabase
            .from('donations')
            .select('id, donor_id, pickup_latitude, pickup_longitude')
            .in('id', donationSourceIds);

          const nextDonationMap = ((donationRows as DonationLite[] | null) ?? []).reduce<Record<string, DonationLite>>(
            (accumulator, donation) => {
              accumulator[donation.id] = donation;
              return accumulator;
            },
            {},
          );
          setDonationById(nextDonationMap);
        } else {
          setDonationById({});
        }

        setUser(userRes);

        setAssignedMission(
          assignedRes.data && assignedRes.data.length > 0 ? assignedRes.data[0] : null,
        );

        if (availableRes.data) {
          setMissions(dedupeMissions(availableRes.data as Mission[]));
        }

        if (caseReportsRes.data) {
          const nextMap = (caseReportsRes.data as Array<{ id: string; latitude: number; longitude: number }>).reduce<
            Record<string, { latitude: number; longitude: number }>
          >((acc, row) => {
            if (typeof row.latitude === 'number' && typeof row.longitude === 'number') {
              acc[row.id] = {
                latitude: row.latitude,
                longitude: row.longitude,
              };
            }
            return acc;
          }, {});
          setCaseLocationsById(nextMap);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMission = async (missionId: string) => {
    setUpdating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const { error } = await supabase
        .from('missions')
        .update({
          assigned_volunteer_id: session.user.id,
          status: 'in_progress',
          volunteer_latitude: userLocation?.latitude,
          volunteer_longitude: userLocation?.longitude,
          last_geo_update_at: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (error) throw error;

      const matchingOrder = missionOrders.find((order) => order.missionId === missionId && order.volunteerId === session.user.id);
      if (matchingOrder) {
        updateMissionAssignmentOrderStatus(matchingOrder.id, 'accepted');
      }

      writeAuditEvent({
        actorId: session.user.id,
        actorName: user?.full_name || session.user.email || 'Volunteer',
        actorRole: 'volunteer',
        action: 'accept_mission',
        page: '/volunteer',
        entityType: 'mission',
        entityId: missionId,
        status: 'success',
        detail: 'Volunteer accepted mission',
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error accepting mission:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    setUpdating(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('missions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          volunteer_latitude: userLocation?.latitude,
          volunteer_longitude: userLocation?.longitude,
          last_geo_update_at: new Date().toISOString(),
        })
        .eq('id', missionId);

      if (error) throw error;

      const matchingOrder = missionOrders.find((order) => order.missionId === missionId);
      if (matchingOrder) {
        updateMissionAssignmentOrderStatus(matchingOrder.id, 'accepted');
      }

      writeAuditEvent({
        actorId: user?.id || 'volunteer',
        actorName: user?.full_name || user?.email || 'Volunteer',
        actorRole: 'volunteer',
        action: 'complete_mission',
        page: '/volunteer',
        entityType: 'mission',
        entityId: missionId,
        status: 'success',
        detail: 'Mission marked completed',
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error completing mission:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-orange-600/20 to-orange-600/10 rounded-lg">
              <Navigation2 className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Welcome, {user?.full_name}!</h1>
          </div>
          <p className="text-muted-foreground ml-11">Accept missions and deliver meals to your neighbors</p>
          {activeAssignmentOrder && (
            <p className="mt-2 ml-11 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              New NGO order from <span className="font-bold">{activeAssignmentOrder.ngoName}</span>
            </p>
          )}
        </div>
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 text-muted-foreground hover:bg-accent rounded-full transition-all duration-200"
          >
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  New Missions
                </p>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No new notifications</div>
              ) : (
                <div className="space-y-2 p-2">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{notif.mission.title}</p>
                          <p className="text-xs text-gray-600 mt-1">📍 {notif.mission.pickup_location}</p>
                          <p className="text-xs text-gray-600">→ {notif.mission.delivery_location}</p>
                          <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${
                            notif.mission.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : notif.mission.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notif.mission.priority.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        onClick={() => {
                          handleAcceptMission(notif.mission.id);
                          dismissNotification(notif.id);
                        }}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-auto"
                      >
                        Accept Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RoleLocationPanel
        title="Volunteer Location Pin"
        userId={user?.id}
        userName={user?.full_name || user?.email || 'Volunteer'}
        userRole="volunteer"
        currentLocation={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: userLocation.timestamp,
        } : null}
      />

      {/* Live Geolocation Map */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Navigation2 className="w-5 h-5 text-blue-600" />
            Live Location & Nearby Missions
          </h2>
          {userLocation && (
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
              📍 Live Tracking On
            </span>
          )}
        </div>

        <AnimatedTrackingMap
          missions={missions}
          userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
          caseLocationsById={caseLocationsById}
          donorLiveLocationsByMissionId={donorLiveLocationsByMissionId}
        />
      </Card>

      {/* NGO Assignment Orders */}
      <Card className="p-6 border border-blue-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">NGO Assignment Orders</h2>
            <p className="text-sm text-gray-600 mt-1">Tasks sent to you by the NGO appear here first.</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
            {missionOrders.length} Orders
          </span>
        </div>

        {missionOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No assignment orders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {missionOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 p-4 bg-blue-50/50">
                {(() => {
                  const route = computeRouteMetrics(order.mission);
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{order.mission.title}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              order.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'dismissed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Sent by {order.ngoName}</p>
                          <p className="text-xs text-gray-600 mt-1">Pickup: {order.mission.pickup_location}</p>
                          <p className="text-xs text-gray-600">Delivery: {order.mission.delivery_location}</p>
                          {route.donorLive && (
                            <p className="text-xs font-semibold text-red-600 mt-1">
                              Live donor: {route.donorLive.latitude.toFixed(5)}, {route.donorLive.longitude.toFixed(5)}
                            </p>
                          )}
                          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-900">
                            <p className="font-semibold">Best route</p>
                            <p>
                              {Number.isFinite(route.toPickupKm) ? `${route.toPickupKm.toFixed(1)} km to pickup` : 'Pickup distance unavailable'}
                              {' • '}
                              {Number.isFinite(route.pickupToDropKm) ? `${route.pickupToDropKm.toFixed(1)} km to delivery` : 'Delivery distance unavailable'}
                            </p>
                            <p>
                              {Number.isFinite(route.totalKm) ? `${route.totalKm.toFixed(1)} km total` : 'Total distance unavailable'}
                              {route.etaMinutes ? ` • ETA ${route.etaMinutes} min` : ''}
                            </p>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order image</p>
                            <div className="mt-1 relative h-28 w-full max-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white">
                              <NextImage
                                src={order.imageDataUrl}
                                alt={order.imageName || 'Order evidence image'}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-1 font-semibold text-gray-700">
                          {order.mission.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => {
                            handleAcceptMission(order.missionId);
                            updateMissionAssignmentOrderStatus(order.id, 'accepted');
                          }}
                          disabled={updating || order.status === 'accepted'}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {order.status === 'accepted' ? 'Accepted' : 'Accept Order'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateMissionAssignmentOrderStatus(order.id, 'dismissed')}
                          className="border-gray-300"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </>
                  );
              })()}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Current Active Mission */}
      {assignedMissionView && (
        <Card className="p-6 border-l-4 border-l-green-600 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Mission {assignedMissionView.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </h2>
              <p className="text-gray-600 mt-1">{assignedMissionView.title}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-semibold text-sm ${
                assignedMissionView.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {assignedMissionView.status === 'completed' ? 'Completed' : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Pickup Location</p>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MapPin className="w-5 h-5 text-green-600" />
                {assignedMissionView.pickup_location}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Delivery Location</p>
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MapPin className="w-5 h-5 text-red-600" />
                {assignedMissionView.delivery_location}
              </div>
            </div>
          </div>

          {assignedMissionView.description && (
            <p className="text-gray-700 mb-4">{assignedMissionView.description}</p>
          )}

          {assignedMissionView.status !== 'completed' && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleCompleteMission(assignedMissionView.id)}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Checklist for current mission */}
      {assignedMissionView && assignedMissionView.status !== 'completed' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pickup" className="w-5 h-5 cursor-pointer" />
              <label htmlFor="pickup" className="text-gray-700 cursor-pointer">
                Pickup food from donor
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="verify" className="w-5 h-5 cursor-pointer" />
              <label htmlFor="verify" className="text-gray-700 cursor-pointer">
                Verify freshness of food
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="transport" className="w-5 h-5 cursor-pointer" />
              <label htmlFor="transport" className="text-gray-700 cursor-pointer">
                Transport to delivery location
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="deliver" className="w-5 h-5 cursor-pointer" />
              <label htmlFor="deliver" className="text-gray-700 cursor-pointer">
                Deliver to recipient
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Mission Locations Map */}
      {missions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mission Locations Map</h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
              Ordered by live tracking
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {liveTrackingMissions.map(({ mission, distanceKm, rank }) => (
              <div key={`mission-map-${mission.id}`} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${rank === 1 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600">Pickup #{rank}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{mission.pickup_location}</p>
                  </div>
                </div>
                
                <div className="text-center py-2 text-xs text-gray-400">
                  <svg className="w-full h-6 text-slate-300" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <line x1="50" y1="0" x2="50" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                  </svg>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600">Delivery</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{mission.delivery_location}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      mission.priority === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : mission.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {mission.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMissionTrackingStatus(getMissionTrackingStatus(mission))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{mission.assigned_volunteer_id ? 'Assigned mission' : 'Open mission'}</span>
                    <span>{distanceKm !== null && Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km away` : 'Distance unavailable'}</span>
                  </div>
                  <Button
                    onClick={() => handleAcceptMission(mission.id)}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white w-full text-xs py-1 h-auto"
                  >
                    {updating ? 'Accepting...' : 'Accept'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Missions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          Available Missions (Swipe Right to Accept)
        </h2>
        {missions.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No available missions at the moment. Check back later!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {nearbyMissions.map((mission, idx) => (
              <div
                key={`available-${mission.id}-${idx}`}
                ref={el => {
                  missionCardRefs.current[mission.id] = el;
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, mission.id)}
                className="relative overflow-hidden cursor-grab active:cursor-grabbing"
              >
                <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{mission.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                        mission.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : mission.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {mission.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Pickup: {mission.pickup_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Heart className="w-4 h-4 flex-shrink-0" />
                      <span>Delivery: {mission.delivery_location}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAcceptMission(mission.id)}
                      disabled={updating}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Accept Mission
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs text-gray-600"
                      disabled
                    >
                      👉 Swipe Right
                    </Button>
                  </div>
                </Card>

                {/* Swipe Indicator */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-green-500/20 via-transparent to-transparent opacity-0 rounded transition-opacity">
                  <div className="absolute inset-y-0 left-0 w-1 bg-green-500"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Status */}
      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <p className="text-blue-900 font-semibold">Your Status: Online</p>
        </div>
      </Card>
    </div>
  );
}
