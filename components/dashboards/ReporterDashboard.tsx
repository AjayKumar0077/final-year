// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { CaseReport } from '@/lib/types';
import { useCurrentUserLocation } from '@/hooks/use-location-store';
import { useSessionUserId } from '@/hooks/use-session';
import { classifyAssistanceText } from '@/lib/text-classifier';
import { detectUrgency, getUrgencyLevelFromScore } from '@/lib/urgency-detector';
import { writeAuditEvent } from '@/lib/audit-log';
import { RoleLocationPanel } from '@/components/RoleLocationPanel';

export function ReporterDashboard() {
  const [cases, setCases] = useState<CaseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [reporterNote, setReporterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('User');
  const userLocation = useCurrentUserLocation();
  const sessionUserId = useSessionUserId();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Fetch user profile
        const { data: userRes } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userRes) {
          setUserName(userRes.full_name);
             const typed = userRes as any;
             setUserName(typed.full_name || '');
             setReporterPhone(typed.phone || '');
        }

        const { data: caseRes } = await supabase
          .from('case_reports')
          .select('*')
          .eq('reporter_id', session.user.id)
          .order('created_at', { ascending: false });

        if (caseRes) {
          setCases(caseRes);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const combinedText = `${title} ${description} ${reporterNote}`.trim();
      const classification = classifyAssistanceText(combinedText);
      const urgency = detectUrgency({
        title,
        description,
        reporterNote,
        peopleCount,
        category: classification.category,
      });

      const { error } = await supabase.from('case_reports').insert({
        reporter_id: session.user.id,
        reporter_name: userName,
        reporter_phone: reporterPhone || undefined,
        people_count: peopleCount,
        reporter_note: reporterNote || undefined,
        title,
        description,
        location,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        geo_captured_at: userLocation ? new Date(userLocation.timestamp).toISOString() : undefined,
        status: 'unverified',
        urgency_score: urgency.score,
        broadcast_to_roles: ['ngo', 'volunteer', 'admin'],
      });

      if (error) throw error;

      writeAuditEvent({
        actorId: session.user.id,
        actorName: userName || session.user.email || 'Reporter',
        actorRole: 'reporter',
        action: 'create_case_report',
        page: '/reporter',
        entityType: 'case_report',
        entityId: `${Date.now()}`,
        status: 'success',
        detail: `urgency=${urgency.level}; category=${classification.category}`,
      });

      console.info('Case report analysis', {
        category: classification.category,
        confidence: classification.confidence,
        urgency_score: urgency.score,
        urgency_level: urgency.level,
      });

      // Reset form and refresh data
      setTitle('');
      setDescription('');
      setLocation('');
      setPeopleCount(1);
      setReporterNote('');
      setShowReportForm(false);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating case report:', error);
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-red-600/20 to-red-600/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Report Cases</h1>
          </div>
          <p className="text-muted-foreground ml-11">Help us identify where food assistance is needed most</p>
        </div>
        <Button
          onClick={() => setShowReportForm(!showReportForm)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Report a Case
        </Button>
      </div>

      {/* Report Form */}
      {showReportForm && (
        <Card className="p-6 border-2 border-green-200 bg-green-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report a New Case</h2>
          <form onSubmit={handleReportCase} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Homeless encampment under bridge"
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the situation and the number of people..."
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Street address or area name"
                disabled={submitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporter Contact Number
                </label>
                <Input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="e.g., +91 98xxxxxx12"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated People Needing Meals
                </label>
                <Input
                  type="number"
                  min={1}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, Number(e.target.value) || 1))}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Field Notes for NGO
              </label>
              <textarea
                value={reporterNote}
                onChange={(e) => setReporterNote(e.target.value)}
                placeholder="e.g., children and elderly present, best approach from west side"
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold">Geo-capture status</p>
              <p>
                {userLocation
                  ? `Latitude ${userLocation.latitude.toFixed(5)}, Longitude ${userLocation.longitude.toFixed(5)} will be attached to this report.`
                  : 'Location permission not available. Report will be sent without geo coordinates.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowReportForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cases Reported</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{cases.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white border border-yellow-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Verification</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">
                {cases.filter((c) => !c.verified).length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      <RoleLocationPanel
        title="Reporter Location Pin"
        userId={sessionUserId}
        userName={userName || 'Reporter'}
        userRole="reporter"
        currentLocation={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: userLocation.timestamp,
        } : null}
      />

      {/* Cases List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Reports</h2>
        {cases.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No cases reported yet. Help identify areas that need assistance.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {cases.map((caseReport) => (
              <Card
                key={caseReport.id}
                className={`p-4 border-l-4 ${
                  caseReport.verified ? 'border-l-green-500' : 'border-l-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{caseReport.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{caseReport.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {caseReport.location}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      {caseReport.reporter_phone && <p>Contact: {caseReport.reporter_phone}</p>}
                      {caseReport.people_count && <p>People affected: {caseReport.people_count}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                        getUrgencyLevelFromScore(caseReport.urgency_score) === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : getUrgencyLevelFromScore(caseReport.urgency_score) === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : getUrgencyLevelFromScore(caseReport.urgency_score) === 'medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getUrgencyLevelFromScore(caseReport.urgency_score).toUpperCase()}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        caseReport.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {caseReport.verified ? 'Verified' : 'Pending'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Score: {caseReport.urgency_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(caseReport.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
