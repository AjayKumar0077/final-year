'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, MapPin, CheckCircle2, Clock4, RefreshCcw, ShieldCheck, LogOut } from 'lucide-react';
import { CaseReport, Donation, Mission, UserProfile, UserRole } from '@/lib/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { SatellitePulseMap } from '@/components/SatellitePulseMap';
import { GEO_CONFIG } from '@/lib/config';

export default function DashboardPage() {
  const pieColors = ['#2563eb', '#f59e0b', '#16a34a', '#ef4444', '#8b5cf6', '#06b6d4'];
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cases, setCases] = useState<CaseReport[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.replace('/login');
          return;
        }

        const [profileRes, donationsRes, casesRes, missionsRes, role] = await Promise.all([
          supabase.from('users').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('case_reports').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('missions').select('*').order('created_at', { ascending: false }).limit(500),
          getUserRoleOrFallback(supabase, session.user),
        ]) as unknown as [
          { data: UserProfile | null },
          { data: Donation[] | null },
          { data: CaseReport[] | null },
          { data: Mission[] | null },
          string,
        ];

        setUser((profileRes.data as UserProfile | null) ?? {
          id: session.user.id,
          email: session.user.email ?? '',
          role: (role ?? 'donor') as UserRole,
          full_name: typeof session.user.user_metadata?.full_name === 'string' ? session.user.user_metadata.full_name : undefined,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        });

        if (donationsRes.data) setDonations(donationsRes.data as unknown as Donation[]);
        if (casesRes.data) setCases(casesRes.data as unknown as CaseReport[]);
        if (missionsRes.data) setMissions(missionsRes.data as unknown as Mission[]);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalTasks = missions.length + cases.length;
  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.status === 'pending' || mission.status === 'in_progress').length,
    [missions],
  );
  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === 'completed').length,
    [missions],
  );
  const openCases = useMemo(
    () => cases.filter((caseReport) => !caseReport.verified).length,
    [cases],
  );

  const missionFeed = useMemo(
    () => missions.slice(0, 20),
    [missions],
  );

  const rolePieData = useMemo(
    () => [
      { name: 'Donors', value: donations.length },
      { name: 'Open cases', value: openCases },
      { name: 'Active missions', value: activeMissions },
      { name: 'Completed missions', value: completedMissions },
    ],
    [activeMissions, completedMissions, donations.length, openCases],
  );

  const taskStatusPieData = useMemo(
    () => [
      { name: 'Pending', value: missions.filter((mission) => mission.status === 'pending').length },
      { name: 'In progress', value: missions.filter((mission) => mission.status === 'in_progress').length },
      { name: 'Completed', value: missions.filter((mission) => mission.status === 'completed').length },
      { name: 'Cancelled', value: missions.filter((mission) => mission.status === 'cancelled').length },
    ],
    [missions],
  );

  const validGeoCases = useMemo(
    () =>
      cases.filter((caseReport) => {
        const hasLatitude = typeof caseReport.latitude === 'number';
        const hasLongitude = typeof caseReport.longitude === 'number';
        const isZeroPoint = caseReport.latitude === 0 && caseReport.longitude === 0;
        return hasLatitude && hasLongitude && !isZeroPoint;
      }),
    [cases],
  );

  const zoneMapStats = useMemo(() => {
    const geocodedCases = validGeoCases;

    return [
      {
        name: 'North zone',
        count: geocodedCases.filter((caseReport) => (caseReport.latitude ?? 0) >= 23).length,
        tone: 'bg-blue-500',
      },
      {
        name: 'Central zone',
        count: geocodedCases.filter((caseReport) => (caseReport.latitude ?? 0) < 23 && (caseReport.latitude ?? 0) >= 18).length,
        tone: 'bg-amber-500',
      },
      {
        name: 'South zone',
        count: geocodedCases.filter((caseReport) => (caseReport.latitude ?? 0) < 18).length,
        tone: 'bg-emerald-500',
      },
      {
        name: 'Mission zone',
        count: activeMissions + completedMissions,
        tone: 'bg-violet-500',
      },
    ];
  }, [activeMissions, completedMissions, validGeoCases]);

  const zoneMapCenter = useMemo(() => {
    const geocoded = validGeoCases[0];
    return {
      latitude: geocoded?.latitude ?? GEO_CONFIG.DEFAULT_LOCATION.latitude,
      longitude: geocoded?.longitude ?? GEO_CONFIG.DEFAULT_LOCATION.longitude,
    };
  }, [validGeoCases]);

  const zoneMapMarkers = useMemo(
    () =>
      [
        ...validGeoCases
        .slice(0, 8)
        .map((caseReport, index) => ({
          id: caseReport.id,
          latitude: caseReport.latitude as number,
          longitude: caseReport.longitude as number,
          label: caseReport.title || `Case ${index + 1}`,
          description: caseReport.verified ? 'Verified report' : 'Pending verification',
          color: caseReport.verified ? '#16a34a' : '#f59e0b',
        })),
        ...GEO_CONFIG.DEMO_DONATION_ZONES.map((zone) => ({
          id: zone.id,
          latitude: zone.latitude,
          longitude: zone.longitude,
          label: zone.label,
          description: zone.description,
          color: zone.color,
        })),
      ],
    [validGeoCases],
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin home
            </div>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">Admin dashboard home for missions and tasks.</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              Track all missions, tasks, and case activity from one place so the team can assign work and monitor progress without jumping between pages.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:w-[28rem]">
            <div className="grid gap-3 text-sm">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
                <p className="text-muted-foreground">All tasks</p>
                <p className="mt-1 text-2xl font-bold text-primary">{totalTasks}</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.replace('/login')}
              variant="outline"
              className="gap-2 w-full"
            >
              <LogOut className="h-4 w-4" />
              Switch user
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Missions</p>
              <p className="mt-3 text-4xl font-bold text-primary">{missions.length}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Open tasks</p>
              <p className="mt-3 text-4xl font-bold text-secondary">{activeMissions + openCases}</p>
            </div>
            <Clock4 className="h-8 w-8 text-secondary" />
          </div>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Completed missions</p>
              <p className="mt-3 text-4xl font-bold text-accent">{completedMissions}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-muted/40 to-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Donations</p>
              <p className="mt-3 text-4xl font-bold text-foreground">{donations.length}</p>
            </div>
            <MapPin className="h-8 w-8 text-foreground" />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">All missions and tasks</h2>
              <p className="text-sm text-muted-foreground">This is the main admin view for every mission in the system.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {missionFeed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No missions found yet.
              </div>
            ) : (
              missionFeed.map((mission) => (
                <div key={mission.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{mission.title}</p>
                        <Badge variant="outline" className="rounded-full capitalize">
                          {mission.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{mission.description || 'No description provided.'}</p>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p><span className="font-semibold text-foreground">Pickup:</span> {mission.pickup_location}</p>
                        <p><span className="font-semibold text-foreground">Delivery:</span> {mission.delivery_location}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <p>Priority</p>
                      <p className="mt-1 font-semibold text-foreground uppercase">{mission.priority}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <h2 className="text-xl font-bold text-foreground">Task summary</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Open cases</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{openCases}</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Active missions</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{activeMissions}</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Total tasks</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{totalTasks}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Progress breakdown</h2>
              <p className="text-sm text-muted-foreground">Pie charts for system activity and task state.</p>
            </div>
          </div>

          <div className="mt-6 space-y-8">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview mix</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={rolePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                    {rolePieData.map((entry, index) => (
                      <Cell key={`overview-cell-${entry.name}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mission status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={taskStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                    {taskStatusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${entry.name}`} fill={pieColors[(index + 2) % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0 shadow-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Zone map</h2>
              <p className="text-sm text-muted-foreground">Satellite live view centered on current case activity.</p>
              <p className="text-xs text-muted-foreground mt-1">Demo donor locations are shown around Dindigul when live case data is sparse.</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
              <MapPin className="mr-2 h-3.5 w-3.5" />
              Activity zones
            </Badge>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-inner">
              <SatellitePulseMap
                center={zoneMapCenter}
                markers={zoneMapMarkers}
                heightClassName="h-[24rem]"
                zoom={6}
                centerLabel="Zone center"
              />
            </div>

            <div className="space-y-3">
              {zoneMapStats.map((zone) => (
                <div key={zone.name} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${zone.tone}`} />
                      <div>
                        <p className="font-semibold text-foreground">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">Tracked across reports and missions</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{zone.count}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                This zone map is centered on the latest geocoded case and gives a quick view of where work is accumulating.
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}