'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Navigation2, Zap, Users, Clock, TrendingUp } from 'lucide-react';
import type { VolunteerLocationPoint, VolunteerJourneySegment } from '@/lib/volunteer-tracking';

interface VolunteerMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'idle' | 'in_transit' | 'at_location' | 'completed';
  speed?: number;
  missionId?: string;
}

interface MissionMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * Real-time volunteer tracking visualization
 * Shows live locations, journeys, and status updates
 */
export function VolunteerTrackingVisualization({
  volunteers = [],
  missions = [],
}: {
  volunteers?: VolunteerMarker[];
  missions?: MissionMarker[];
}) {
  const [animatedVolunteers, setAnimatedVolunteers] = useState<VolunteerMarker[]>(volunteers);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);

  useEffect(() => {
    setAnimatedVolunteers(volunteers);
  }, [volunteers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-slate-400';
      case 'in_transit':
        return 'bg-blue-500 animate-pulse';
      case 'at_location':
        return 'bg-green-500';
      case 'completed':
        return 'bg-emerald-600';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'idle':
        return 'Idle';
      case 'in_transit':
        return 'In Transit';
      case 'at_location':
        return 'At Location';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Area (Simplified) */}
      <div className="lg:col-span-2">
        <Card className="h-[500px] bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-pattern" />
          </div>

          {/* Mission Markers */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {missions.map(mission => {
              const x = ((mission.longitude + 180) / 360) * 100;
              const y = ((90 - mission.latitude) / 180) * 100;

              const priorityColor = {
                urgent: 'bg-red-500',
                high: 'bg-orange-500',
                normal: 'bg-blue-500',
                low: 'bg-slate-500',
              }[mission.priority];

              return (
                <div
                  key={mission.id}
                  className="absolute pointer-events-auto"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-4 h-4 rounded-full ${priorityColor} animate-pulse`} />
                </div>
              );
            })}
          </div>

          {/* Volunteer Markers */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {animatedVolunteers.map(volunteer => {
              const x = ((volunteer.longitude + 180) / 360) * 100;
              const y = ((90 - volunteer.latitude) / 180) * 100;
              const isSelected = selectedVolunteer === volunteer.id;

              return (
                <button
                  key={volunteer.id}
                  className={`absolute pointer-events-auto transition-all ${
                    isSelected ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedVolunteer(isSelected ? null : volunteer.id)}
                  aria-label={`Volunteer: ${volunteer.name}. Status: ${volunteer.status}. Speed: ${volunteer.speed.toFixed(1)} km/h`}
                  title={`${volunteer.name} - ${volunteer.status}`}
                >
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full ${getStatusColor(
                        volunteer.status
                      )} shadow-lg cursor-pointer transform transition-transform ${
                        isSelected ? 'scale-125' : 'hover:scale-110'
                      }`}
                    />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full border-2 border-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-30">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-slate-600">In Transit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-600">At Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-slate-600">Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-slate-600">Urgent Mission</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Volunteer List */}
      <div className="lg:col-span-1">
        <Card className="h-[500px] overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Active Volunteers ({animatedVolunteers.length})</h3>
            <div className="space-y-3">
              {animatedVolunteers.map(volunteer => (
                <button
                  key={volunteer.id}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedVolunteer === volunteer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedVolunteer(selectedVolunteer === volunteer.id ? null : volunteer.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-slate-900 text-sm">{volunteer.name}</div>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(volunteer.status)}`}>
                      {getStatusLabel(volunteer.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span>{volunteer.speed || 0} km/h</span>
                    </div>
                    {volunteer.missionId && (
                      <div className="flex justify-between">
                        <span>Mission ID:</span>
                        <span className="font-mono">{volunteer.missionId.slice(0, 8)}...</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Mission assignment visualization showing scoring breakdown
 */
export function MissionAssignmentVisualization({
  missionTitle = 'Food Pickup Mission',
  candidates = [],
  selectedVolunteer,
}: {
  missionTitle?: string;
  candidates?: Array<{
    id: string;
    name: string;
    score: number;
    distance: number;
    availability: number;
    performance: number;
    priority: number;
  }>;
  selectedVolunteer?: string;
}) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-500" />
        {missionTitle}
      </h3>

      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedVolunteer === candidate.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-900">#{index + 1} {candidate.name}</div>
                <div className="text-sm text-slate-600">Overall Score: {candidate.score}/100</div>
              </div>
              {index === 0 && <Badge className="bg-green-500">Best Match</Badge>}
            </div>

            <div className="space-y-2 mb-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Distance</span>
                  <span>{candidate.distance}/25</span>
                </div>
                <Progress value={(candidate.distance / 25) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Availability</span>
                  <span>{candidate.availability}/20</span>
                </div>
                <Progress value={(candidate.availability / 20) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Performance</span>
                  <span>{candidate.performance}/25</span>
                </div>
                <Progress value={(candidate.performance / 25) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Priority Match</span>
                  <span>{candidate.priority}/15</span>
                </div>
                <Progress value={(candidate.priority / 15) * 100} className="h-1.5" />
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Total Score</span>
              <span className="text-lg font-bold text-purple-600">{candidate.score}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Donation redistribution flow visualization
 */
export function DonationRedistributionVisualization({
  donationSource = 'Restaurant XYZ',
  quantity = 280,
  recipients = [],
}: {
  donationSource?: string;
  quantity?: number;
  recipients?: Array<{
    id: string;
    ngo: string;
    meals: number;
    efficiency: number;
    reason: string;
  }>;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{donationSource}</h3>
            <p className="text-sm text-slate-600">{quantity} meals available</p>
          </div>
          <div className="text-4xl font-bold text-orange-600">{quantity}</div>
        </div>
        <Progress value={100} className="h-2" />
      </Card>

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900">Distribution Plan</h4>
        {recipients.map((recipient, index) => (
          <Card
            key={recipient.id}
            className={`p-4 ${index === 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-900">{recipient.ngo}</div>
                <div className="text-xs text-slate-600">{recipient.reason}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{recipient.meals}</div>
                <div className="text-xs text-slate-600">meals</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Progress value={(recipient.meals / quantity) * 100} className="h-2" />
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {Math.round((recipient.meals / quantity) * 100)}%
                </div>
                <div className="text-xs text-slate-600">Efficiency: {recipient.efficiency}%</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-emerald-900 text-sm">Optimization Metrics</div>
            <div className="text-xs text-emerald-800 mt-1">
              Total meals: {quantity} | Recipients: {recipients.length} | Avg efficiency:{' '}
              {recipients.length > 0
                ? Math.round(recipients.reduce((sum, r) => sum + r.efficiency, 0) / recipients.length)
                : 0}
              %
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Real-time metrics dashboard showing live updates
 */
export function RealtimeMetricsDashboard({
  metrics = {
    activeVolunteers: 0,
    missionsInProgress: 0,
    mealsDistributedToday: 0,
    peopleServed: 0,
    avgEfficiency: 0,
  },
}: {
  metrics?: {
    activeVolunteers: number;
    missionsInProgress: number;
    mealsDistributedToday: number;
    peopleServed: number;
    avgEfficiency: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-blue-900">Active Volunteers</div>
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-3xl font-bold text-blue-600">{metrics.activeVolunteers}</div>
        <div className="text-xs text-blue-800 mt-2">Tracking in real-time</div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-purple-900">Missions</div>
          <Zap className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-3xl font-bold text-purple-600">{metrics.missionsInProgress}</div>
        <div className="text-xs text-purple-800 mt-2">In progress</div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-orange-900">Meals Distributed</div>
          <TrendingUp className="w-4 h-4 text-orange-600" />
        </div>
        <div className="text-3xl font-bold text-orange-600">{metrics.mealsDistributedToday}</div>
        <div className="text-xs text-orange-800 mt-2">Today</div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-green-900">People Served</div>
          <Users className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-3xl font-bold text-green-600">{metrics.peopleServed}</div>
        <div className="text-xs text-green-800 mt-2">Total impact</div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-emerald-900">Efficiency</div>
          <Clock className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-3xl font-bold text-emerald-600">{metrics.avgEfficiency}%</div>
        <div className="text-xs text-emerald-800 mt-2">System average</div>
      </Card>
    </div>
  );
}
