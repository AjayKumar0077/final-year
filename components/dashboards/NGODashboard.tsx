// @ts-nocheck
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Loader2,
  MapPin,
  RefreshCcw,
  UserCheck,
  Users,
} from 'lucide-react';
import { CaseReport, Mission, UserProfile, Donation } from '@/lib/types';
import { resolveMissionAssignmentOrderImage, writeMissionAssignmentOrder } from '@/lib/mission-order-store';
import { getUrgencyLevelFromScore } from '@/lib/urgency-detector';
import { useCurrentUserLocation } from '@/hooks/use-location-store';
import { readStoredLocations } from '@/lib/location-store';
import { calculateHaversineDistance } from '@/lib/geo-distance';
import { writeAuditEvent } from '@/lib/audit-log';
import { LiveLocationMap } from '@/components/LiveLocationMap';
import { RoleLocationPanel } from '@/components/RoleLocationPanel';

export function NGODashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<CaseReport[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(null);
  const [selectedVolunteerByMission, setSelectedVolunteerByMission] = useState<Record<string, string>>({});
  const userLocation = useCurrentUserLocation();
  const donationById = useMemo(
    () =>
      donations.reduce<Record<string, Donation>>((accumulator, donation) => {
        accumulator[donation.id] = donation;
        return accumulator;
      }, {}),
    [donations],
  );

  const getMissionPickupLocation = (mission: Mission) => {
    if (typeof mission.pickup_latitude === 'number' && typeof mission.pickup_longitude === 'number') {
      return {
        latitude: mission.pickup_latitude,
        longitude: mission.pickup_longitude,
      };
    }

    return null;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const [userRes, casesRes, missionsRes, donationsRes, volunteersRes] = await Promise.all([
          getUserProfileOrFallback(supabase, session.user),
          supabase
            .from('case_reports')
            .select('*')
            .order('urgency_score', { ascending: false }),
          supabase
            .from('missions')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('users')
            .select('*')
            .eq('role', 'volunteer')
            .order('created_at', { ascending: false }),
        ]) as unknown as [
          UserProfile,
          { data: CaseReport[] | null },
          { data: Mission[] | null },
          { data: Donation[] | null },
          { data: UserProfile[] | null },
        ];

        setUser(userRes);

        if (casesRes.data) {
          setCases(casesRes.data);
        }

        if (missionsRes.data) {
          setMissions(missionsRes.data);
          setSelectedVolunteerByMission((prev) => {
            const next = { ...prev };
            missionsRes.data?.forEach((mission) => {
              if (mission.assigned_volunteer_id && !next[mission.id]) {
                next[mission.id] = mission.assigned_volunteer_id;
              }
            });
            return next;
          });
        }

        if (donationsRes.data) {
          setDonations(donationsRes.data);
        }

        if (volunteersRes.data) {
          setVolunteers(volunteersRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const supabase = createClient();
    // @ts-ignore
    const channel = (supabase
      .channel('ngo-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'case_reports' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fetchDashboardData)
      .subscribe()) as any;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (missions.length === 0 || volunteers.length === 0 || cases.length === 0) {
      return;
    }

    const caseLocationById = cases.reduce<Record<string, { latitude: number; longitude: number }>>(
      (acc, caseReport) => {
        if (typeof caseReport.latitude === 'number' && typeof caseReport.longitude === 'number') {
          acc[caseReport.id] = {
            latitude: caseReport.latitude,
            longitude: caseReport.longitude,
          };
        }
        return acc;
      },
      {}
    );

    const volunteerLocationById = readStoredLocations().reduce<
      Record<string, { latitude: number; longitude: number }>
    >((acc, location) => {
      acc[location.userId] = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      return acc;
    }, {});

    setSelectedVolunteerByMission((prev) => {
      const next = { ...prev };

      missions.forEach((mission) => {
        if (mission.assigned_volunteer_id) {
          next[mission.id] = mission.assigned_volunteer_id;
          return;
        }

        if (next[mission.id] || !mission.case_report_id) {
          return;
        }

        const missionLocation = getMissionPickupLocation(mission) || (mission.case_report_id ? caseLocationById[mission.case_report_id] : null);
        if (!missionLocation) {
          return;
        }

        let nearestVolunteerId: string | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        volunteers.forEach((volunteer) => {
          const volunteerLocation = volunteerLocationById[volunteer.id];
          if (!volunteerLocation) {
            return;
          }

          const distance = calculateHaversineDistance(missionLocation, volunteerLocation);
          if (distance < minDistance) {
            minDistance = distance;
            nearestVolunteerId = volunteer.id;
          }
        });

        if (nearestVolunteerId) {
          next[mission.id] = nearestVolunteerId;
        }
      });

      return next;
    });
  }, [cases, missions, volunteers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleAssignVolunteer = async (missionId: string) => {
    const volunteerId = selectedVolunteerByMission[missionId];
    if (!volunteerId) return;

    setAssigningMissionId(missionId);
    try {
      const supabase = createClient();
      const mission = missions.find((item) => item.id === missionId);
      if (!mission) {
        throw new Error('Mission not found.');
      }

      const volunteerName = volunteerNameById[volunteerId] || 'Volunteer';
      const ngoName = user?.full_name || user?.organization || 'NGO';
      const sourceDonation = mission.source_entity_type === 'donation' && mission.source_entity_id
        ? donationById[mission.source_entity_id]
        : null;
      const { imageDataUrl, imageName } = resolveMissionAssignmentOrderImage(
        sourceDonation?.packaging_image_data_url,
        sourceDonation?.packaging_image_name,
      );
      const { error } = await supabase
        .from('missions')
        .update({
          assigned_volunteer_id: volunteerId,
          status: 'pending',
        })
        .eq('id', missionId);

      if (error) throw error;

      writeMissionAssignmentOrder({
        id: `${missionId}-${volunteerId}-${Date.now()}`,
        missionId,
        mission,
        imageDataUrl,
        imageName,
        volunteerId,
        volunteerName,
        ngoId: user?.id || 'ngo',
        ngoName,
        status: 'sent',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      writeAuditEvent({
        actorId: user?.id || 'ngo',
        actorName: ngoName,
        actorRole: 'ngo',
        action: 'assign_mission_to_volunteer',
        page: '/ngo',
        entityType: 'mission',
        entityId: missionId,
        status: 'success',
        detail: `volunteer=${volunteerName}; priority=${mission.priority}`,
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error assigning volunteer:', error);
    } finally {
      setAssigningMissionId(null);
    }
  };

  const urgentCases = useMemo(
    () => cases.filter((c) => c.status === 'unverified').length,
    [cases],
  );
  const completedMissions = useMemo(
    () => missions.filter((m) => m.status === 'completed').length,
    [missions],
  );
  const activeMissions = useMemo(
    () => missions.filter((m) => m.status === 'in_progress').length,
    [missions],
  );
  const pendingMissions = useMemo(
    () => missions.filter((m) => m.status === 'pending' && !m.assigned_volunteer_id),
    [missions],
  );
  const inProgressMissions = useMemo(
    () => missions.filter((m) => m.status === 'in_progress'),
    [missions],
  );
  const doneMissions = useMemo(
    () => missions.filter((m) => m.status === 'completed'),
    [missions],
  );
  const totalMeals = useMemo(
    () => donations.reduce((sum, d) => sum + (d.quantity || 1), 0),
    [donations],
  );
  const volunteerNameById = useMemo(
    () =>
      volunteers.reduce<Record<string, string>>((acc, v) => {
        acc[v.id] = v.full_name || v.email;
        return acc;
      }, {}),
    [volunteers],
  );
  const volunteerWorkload = useMemo(() => {
    return volunteers.map((volunteer) => {
      const assigned = missions.filter((mission) => mission.assigned_volunteer_id === volunteer.id);
      const active = assigned.filter((mission) => mission.status === 'in_progress').length;
      const completed = assigned.filter((mission) => mission.status === 'completed').length;

      return {
        volunteer,
        active,
        completed,
        totalAssigned: assigned.length,
      };
    });
  }, [missions, volunteers]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-green-600/20 to-green-600/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">NGO Operations Hub</h1>
          </div>
          <p className="text-muted-foreground ml-11">Track field tasks and assign volunteers in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-green-200 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-4 py-2 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
          >
            Switch Account
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6 bg-gradient-to-br from-red-50 to-white border border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Priority Cases</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{urgentCases}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Missions</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{activeMissions}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completed</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{completedMissions}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white border border-yellow-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Meals Available</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">{totalMeals}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Volunteers Online</p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">{volunteers.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      <RoleLocationPanel
        title="NGO Operations Location Pin"
        userId={user?.id}
        userName={user?.full_name || user?.organization || user?.email || 'NGO'}
        userRole="ngo"
        currentLocation={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: userLocation.timestamp,
        } : null}
      />

      <LiveLocationMap />

      {/* Assignment + Workload */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assign Tasks to Volunteers</h2>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
              {pendingMissions.length} Unassigned
            </span>
          </div>

          {pendingMissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
              No pending missions to assign.
            </div>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {pendingMissions.slice(0, 10).map((mission) => (
                <div key={`assign-${mission.id}`} className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{mission.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                        <p><span className="font-medium">Pickup:</span> {mission.pickup_location}</p>
                        <p><span className="font-medium">Delivery:</span> {mission.delivery_location}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                        mission.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : mission.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {mission.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      value={selectedVolunteerByMission[mission.id] ?? ''}
                      onChange={(e) =>
                        setSelectedVolunteerByMission((prev) => ({
                          ...prev,
                          [mission.id]: e.target.value,
                        }))
                      }
                      className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm"
                      aria-label={`Select volunteer for ${mission.title}`}
                    >
                      <option value="">Select volunteer</option>
                      {volunteers.map((volunteer) => (
                        <option key={`vol-option-${volunteer.id}`} value={volunteer.id}>
                          {volunteer.full_name || volunteer.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => handleAssignVolunteer(mission.id)}
                      disabled={!selectedVolunteerByMission[mission.id] || assigningMissionId === mission.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {assigningMissionId === mission.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        'Assign Task'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Volunteer Workload</h2>
            <Users className="h-5 w-5 text-gray-500" />
          </div>

          {volunteerWorkload.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
              No volunteers found.
            </div>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {volunteerWorkload.map(({ volunteer, active, completed, totalAssigned }) => (
                <div key={`work-${volunteer.id}`} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{volunteer.full_name || volunteer.email}</p>
                      <p className="text-xs text-gray-500">{volunteer.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        active >= 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {active >= 3 ? 'Busy' : 'Available'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <p className="text-blue-700 font-bold text-base">{active}</p>
                      <p className="text-blue-600">Active</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-green-700 font-bold text-base">{completed}</p>
                      <p className="text-green-600">Completed</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-2">
                      <p className="text-slate-700 font-bold text-base">{totalAssigned}</p>
                      <p className="text-slate-600">Total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Mission Pipeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mission Tracking Pipeline</h2>
          <ClipboardList className="h-5 w-5 text-gray-500" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-4">
            <p className="text-sm font-semibold text-yellow-800">Pending ({pendingMissions.length})</p>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {pendingMissions.slice(0, 8).map((mission) => (
                <div key={`pipe-pending-${mission.id}`} className="rounded-lg bg-white p-3 border border-yellow-100">
                  <p className="text-sm font-semibold text-gray-900">{mission.title}</p>
                  <p className="text-xs text-gray-600 mt-1">Waiting for volunteer assignment</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-blue-800">In Progress ({inProgressMissions.length})</p>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {inProgressMissions.slice(0, 8).map((mission) => (
                <div key={`pipe-active-${mission.id}`} className="rounded-lg bg-white p-3 border border-blue-100">
                  <p className="text-sm font-semibold text-gray-900">{mission.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Assigned to: {volunteerNameById[mission.assigned_volunteer_id || ''] || 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50/60 p-4">
            <p className="text-sm font-semibold text-green-800">Completed ({doneMissions.length})</p>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
              {doneMissions.slice(0, 8).map((mission) => (
                <div key={`pipe-done-${mission.id}`} className="rounded-lg bg-white p-3 border border-green-100">
                  <p className="text-sm font-semibold text-gray-900">{mission.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Closed by: {volunteerNameById[mission.assigned_volunteer_id || ''] || 'Volunteer'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Priority Cases */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Cases (by Urgency)</h2>
        {cases.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No cases reported yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 5).map((caseReport) => (
              <Card key={caseReport.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{caseReport.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{caseReport.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {caseReport.location}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold">Reporter:</span>{' '}
                        {caseReport.reporter_name || 'Unknown'}
                      </p>
                      <p>
                        <span className="font-semibold">Contact:</span>{' '}
                        {caseReport.reporter_phone || 'Not provided'}
                      </p>
                      <p>
                        <span className="font-semibold">People affected:</span>{' '}
                        {caseReport.people_count || 'N/A'}
                      </p>
                      <p>
                        <span className="font-semibold">Geo:</span>{' '}
                        {typeof caseReport.latitude === 'number' && typeof caseReport.longitude === 'number'
                          ? `${caseReport.latitude.toFixed(4)}, ${caseReport.longitude.toFixed(4)}`
                          : 'Not captured'}
                      </p>
                    </div>
                    {caseReport.reporter_note && (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                        <span className="font-semibold">Field note:</span> {caseReport.reporter_note}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Score: {caseReport.urgency_score.toFixed(1)}
                    </div>
                    <div
                      className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        getUrgencyLevelFromScore(caseReport.urgency_score) === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : getUrgencyLevelFromScore(caseReport.urgency_score) === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : getUrgencyLevelFromScore(caseReport.urgency_score) === 'medium'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getUrgencyLevelFromScore(caseReport.urgency_score).toUpperCase()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Donations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h2>
        {donations.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No donations yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {donations.slice(0, 5).map((donation) => (
              <Card key={donation.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{donation.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{donation.quantity}</p>
                  <p className="text-xs text-gray-600">meals</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
