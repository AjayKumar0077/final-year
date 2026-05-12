'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, CheckCircle2, ClipboardList, Heart, MapPin, Sparkles, TrendingUp, ShieldCheck, Navigation2 } from 'lucide-react';
import { CaseReport, Donation, Mission, UserProfile } from '@/lib/types';
import { LiveLocationMap } from '@/components/LiveLocationMap';
import { SatellitePulseMap } from '@/components/SatellitePulseMap';
import { GEO_CONFIG } from '@/lib/config';
import type { UserRole } from '@/lib/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cases, setCases] = useState<CaseReport[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.replace('/login');
          return;
        }

        const currentRole = await getUserRoleOrFallback(supabase, session.user);

        const [profileRes, donationsRes, casesRes, missionsRes] = (await Promise.all([
          supabase.from('users').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(25),
          supabase.from('case_reports').select('*').order('created_at', { ascending: false }).limit(25),
          supabase.from('missions').select('*').order('created_at', { ascending: false }).limit(25),
        ])) as [
          { data: UserProfile | null },
          { data: Donation[] | null },
          { data: CaseReport[] | null },
          { data: Mission[] | null },
        ];

        const usersRes = (await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })) as { data: UserProfile[] | null };

        setUser((profileRes.data as UserProfile | null) ?? {
          id: session.user.id,
          email: session.user.email ?? '',
          role: currentRole ?? 'admin',
          full_name: typeof session.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : undefined,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        });

        if (donationsRes.data) setDonations(donationsRes.data);
        if (casesRes.data) setCases(casesRes.data);
        if (missionsRes.data) setMissions(missionsRes.data);
        if (usersRes.data) setAllUsers(usersRes.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const totalMeals = useMemo(
    () => donations.reduce((sum, donation) => sum + (donation.quantity || 1), 0),
    [donations],
  );

  const urgentCases = useMemo(
    () => cases.filter((caseReport) => caseReport.status === 'unverified' && caseReport.urgency_score >= 7).length,
    [cases],
  );

  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.status === 'pending' || mission.status === 'in_progress').length,
    [missions],
  );

  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === 'completed').length,
    [missions],
  );

  const donationSegments = useMemo(
    () => Array.from({ length: 10 }, (_, index) => index < Math.min(10, donations.length)),
    [donations.length],
  );

  const caseSegments = useMemo(
    () => Array.from({ length: 10 }, (_, index) => index < Math.min(10, cases.filter((caseReport) => !caseReport.verified).length)),
    [cases],
  );

  const missionSegments = useMemo(
    () => Array.from({ length: 10 }, (_, index) => index < Math.round(missions.length ? (completedMissions / missions.length) * 10 : 0)),
    [completedMissions, missions.length],
  );

  const roleCounts = useMemo(
    () =>
      allUsers.reduce(
        (counts, currentUser) => ({
          ...counts,
          [currentUser.role]: (counts[currentUser.role] || 0) + 1,
        }),
        { donor: 0, reporter: 0, ngo: 0, volunteer: 0 } as Record<string, number>,
      ),
    [allUsers],
  );

  const operationsMapCenter = useMemo(() => {
    const geoCase = cases.find((caseReport) => typeof caseReport.latitude === 'number' && typeof caseReport.longitude === 'number');
    if (geoCase) {
      return {
        latitude: geoCase.latitude as number,
        longitude: geoCase.longitude as number,
      };
    }

    return GEO_CONFIG.DEFAULT_LOCATION;
  }, [cases]);

  const operationsMapMarkers = useMemo(
    () => [
      ...cases
        .filter((caseReport) => typeof caseReport.latitude === 'number' && typeof caseReport.longitude === 'number')
        .slice(0, 6)
        .map((caseReport) => ({
          id: `case-${caseReport.id}`,
          latitude: caseReport.latitude as number,
          longitude: caseReport.longitude as number,
          label: caseReport.title,
          description: caseReport.verified ? 'Verified case report' : 'Pending case report',
          color: caseReport.verified ? '#16a34a' : '#f59e0b',
        })),
      ...missions
        .filter((mission) => typeof mission.pickup_latitude === 'number' && typeof mission.pickup_longitude === 'number')
        .slice(0, 6)
        .map((mission) => ({
          id: `mission-${mission.id}`,
          latitude: mission.pickup_latitude as number,
          longitude: mission.pickup_longitude as number,
          label: mission.title,
          description: mission.status.replace('_', ' '),
          color: mission.status === 'in_progress' ? '#2563eb' : '#8b5cf6',
        })),
    ],
    [cases, missions],
  );

  const statusFeed = useMemo(
    () => [
      {
        label: 'All users',
        value: allUsers.length,
        detail: 'People active in the system',
      },
      {
        label: 'Donors',
        value: roleCounts.donor,
        detail: 'Food providers on record',
      },
      {
        label: 'Reporters',
        value: roleCounts.reporter,
        detail: 'Need reports filed',
      },
      {
        label: 'NGOs',
        value: roleCounts.ngo,
        detail: 'Operations coordinators',
      },
      {
        label: 'Volunteers',
        value: roleCounts.volunteer,
        detail: 'Delivery team members',
      },
    ],
    [allUsers.length, roleCounts],
  );

  const recentOperations = useMemo(
    () => [
      ...donations.slice(0, 4).map((donation) => ({
        id: `donation-${donation.id}`,
        title: donation.description,
        detail: `${donation.quantity} meals donated`,
        created_at: donation.created_at,
        status: 'donation',
      })),
      ...cases.slice(0, 4).map((caseReport) => ({
        id: `case-${caseReport.id}`,
        title: caseReport.title,
        detail: caseReport.verified ? 'Case verified' : 'Case awaiting review',
        created_at: caseReport.created_at,
        status: caseReport.verified ? 'verified' : 'review',
      })),
      ...missions.slice(0, 4).map((mission) => ({
        id: `mission-${mission.id}`,
        title: mission.title,
        detail: mission.status === 'completed' ? 'Mission completed' : `Mission ${mission.status.replace('_', ' ')}`,
        created_at: mission.created_at,
        status: mission.status,
      })),
    ]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 8),
    [cases, donations, missions],
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Operations overview
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">Track every food operation from one home dashboard.</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              Monitor donations, case reports, and delivery missions together so the team can spot bottlenecks, prioritize urgent work, and keep the whole system moving.
            </p>
          </div>
          <div className={`grid gap-3 text-sm ${user?.role === 'admin' ? 'grid-cols-2 sm:w-[28rem]' : 'grid-cols-1 sm:w-[14rem]'}`}>
            {user?.role === 'admin' && (
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
                <p className="text-muted-foreground">Admin Profile</p>
                <p className="mt-1 font-semibold text-foreground">{user?.full_name ?? 'Local Admin'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
              <p className="text-muted-foreground">Live total meals</p>
              <p className="mt-1 text-2xl font-bold text-primary">{totalMeals}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meals tracked</p>
              <p className="mt-3 text-4xl font-bold text-primary">{totalMeals}</p>
            </div>
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Urgent cases</p>
              <p className="mt-3 text-4xl font-bold text-secondary">{urgentCases}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-secondary" />
          </div>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active missions</p>
              <p className="mt-3 text-4xl font-bold text-accent">{activeMissions}</p>
            </div>
            <MapPin className="h-8 w-8 text-accent" />
          </div>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-muted/40 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="mt-3 text-4xl font-bold text-foreground">{completedMissions}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-foreground" />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Operations feed</h2>
              <p className="text-sm text-muted-foreground">Recent donations, case updates, and mission changes.</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
              <TrendingUp className="mr-2 h-3.5 w-3.5" />
              Real-time summary
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {recentOperations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No operations recorded yet.
              </div>
            ) : (
              recentOperations.map((operation) => (
                <div key={operation.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-foreground">{operation.title}</p>
                      <Badge variant="outline" className="rounded-full capitalize">
                        {operation.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{operation.detail}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(operation.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Operations snapshot</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Donation coverage</span>
                  <span className="font-semibold text-foreground">{donations.length} records</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {donationSegments.map((filled, index) => (
                    <div
                      key={`donation-segment-${index}`}
                      className={`h-3 rounded-full ${filled ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Case review load</span>
                  <span className="font-semibold text-foreground">{cases.filter((caseReport) => !caseReport.verified).length} pending</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {caseSegments.map((filled, index) => (
                    <div
                      key={`case-segment-${index}`}
                      className={`h-3 rounded-full ${filled ? 'bg-secondary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mission throughput</span>
                  <span className="font-semibold text-foreground">{completedMissions}/{missions.length || 1} completed</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {missionSegments.map((filled, index) => (
                    <div
                      key={`mission-segment-${index}`}
                      className={`h-3 rounded-full ${filled ? 'bg-accent' : 'bg-muted'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Team summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-muted-foreground">Donations</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{donations.length}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-muted-foreground">Cases</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{cases.length}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-muted-foreground">Missions</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{missions.length}</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-muted-foreground">Active</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{activeMissions}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0 shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Operations map</h2>
              <p className="text-sm text-muted-foreground">Animated satellite view of cases and mission pickup points.</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
              <Navigation2 className="mr-2 h-3.5 w-3.5" />
              Live positions
            </Badge>
          </div>

          <div className="relative space-y-4 p-6">
            <SatellitePulseMap
              center={operationsMapCenter}
              markers={operationsMapMarkers}
              heightClassName="h-[22rem]"
              zoom={6}
              centerLabel="System activity center"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Markers', value: operationsMapMarkers.length },
                { label: 'Donations', value: donations.length },
                { label: 'Cases', value: cases.length },
                { label: 'Missions', value: missions.length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">All users</h2>
                <p className="text-sm text-muted-foreground">System-wide user tracking by role.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-4 space-y-3">
              {statusFeed.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">User roster</h2>
            <div className="mt-4 space-y-3">
              {allUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No users found.
                </div>
              ) : (
                allUsers.slice(0, 6).map((currentUser) => (
                  <div key={currentUser.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <div>
                      <p className="font-semibold text-foreground">{currentUser.full_name ?? currentUser.email}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full capitalize">
                      {currentUser.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Live Location Map */}
      <section className="mt-6">
        <LiveLocationMap />
      </section>
    </div>
  );
}
