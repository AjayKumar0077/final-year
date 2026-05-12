'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Award,
  Calendar,
  Activity,
} from 'lucide-react';

type DashboardTab = 'overview' | 'volunteers' | 'kyc' | 'missions' | 'redistribution';

interface AnalyticsMetrics {
  totalVolunteers: number;
  activeVolunteers: number;
  totalDistanceCovered: number;
  averageSpeed: number;
  missionsCompleted: number;
  missionAcceptanceRate: number;
  kycVerified: number;
  kycPending: number;
  kycRejected: number;
  mealsDistributed: number;
  peopleServed: number;
  ngosCovered: number;
  systemEfficiency: number;
  costSavings: number;
}

/**
 * Comprehensive analytics dashboard with multiple views
 */
export function AnalyticsDashboard({
  metrics = {
    totalVolunteers: 145,
    activeVolunteers: 42,
    totalDistanceCovered: 2850,
    averageSpeed: 22.5,
    missionsCompleted: 342,
    missionAcceptanceRate: 94,
    kycVerified: 1250,
    kycPending: 45,
    kycRejected: 12,
    mealsDistributed: 24560,
    peopleServed: 12280,
    ngosCovered: 28,
    systemEfficiency: 87,
    costSavings: 285600,
  },
}: {
  metrics?: AnalyticsMetrics;
}) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Real-time metrics and insights from FOODBRIDGE operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'volunteers', label: 'Volunteers', icon: MapPin },
            { id: 'kyc', label: 'KYC Verification', icon: CheckCircle2 },
            { id: 'missions', label: 'Missions', icon: Zap },
            { id: 'redistribution', label: 'Redistribution', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && <OverviewTab metrics={metrics} />}

        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && <VolunteersTab metrics={metrics} />}

        {/* KYC Tab */}
        {activeTab === 'kyc' && <KycTab metrics={metrics} />}

        {/* Missions Tab */}
        {activeTab === 'missions' && <MissionsTab metrics={metrics} />}

        {/* Redistribution Tab */}
        {activeTab === 'redistribution' && <RedistributionTab metrics={metrics} />}
      </div>
    </div>
  );
}

function OverviewTab({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Active Volunteers"
          value={metrics.activeVolunteers}
          color="blue"
          context={`of ${metrics.totalVolunteers} total`}
        />
        <MetricCard
          icon={<MapPin className="w-6 h-6" />}
          label="Total Distance"
          value={`${metrics.totalDistanceCovered} km`}
          color="green"
          context="Covered today"
        />
        <MetricCard
          icon={<Zap className="w-6 h-6" />}
          label="Missions Completed"
          value={metrics.missionsCompleted}
          color="purple"
          context={`${metrics.missionAcceptanceRate}% acceptance rate`}
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="System Efficiency"
          value={`${metrics.systemEfficiency}%`}
          color="orange"
          context="Optimized operations"
        />
      </div>

      {/* Impact Section */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <h3 className="text-lg font-semibold text-emerald-900 mb-4">🌟 Impact Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{metrics.mealsDistributed}</div>
            <div className="text-sm text-emerald-800">Meals Distributed</div>
            <div className="text-xs text-emerald-700 mt-2">Providing nutrition to vulnerable populations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-teal-600 mb-1">{metrics.peopleServed}</div>
            <div className="text-sm text-teal-800">People Served</div>
            <div className="text-xs text-teal-700 mt-2">Direct beneficiaries of redistribution</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-700 mb-1">₹{(metrics.costSavings / 1000).toFixed(0)}K</div>
            <div className="text-sm text-emerald-800">Cost Savings</div>
            <div className="text-xs text-emerald-700 mt-2">Through optimized operations</div>
          </div>
        </div>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Volunteer Activity Distribution
          </h3>
          <div className="space-y-4">
            {[
              { name: 'In Transit', value: 28, color: 'bg-blue-500' },
              { name: 'At Location', value: 8, color: 'bg-green-500' },
              { name: 'Idle', value: 4, color: 'bg-slate-400' },
              { name: 'Break', value: 2, color: 'bg-yellow-500' },
            ].map(activity => (
              <div key={activity.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{activity.name}</span>
                  <span className="font-semibold text-slate-900">{activity.value}</span>
                </div>
                <Progress value={(activity.value / 42) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Success Metrics
          </h3>
          <div className="space-y-4">
            {[
              { metric: 'Mission Acceptance Rate', value: 94, target: 90 },
              { metric: 'KYC Verification Rate', value: 97, target: 95 },
              { metric: 'On-Time Completion', value: 89, target: 85 },
              { metric: 'Customer Satisfaction', value: 92, target: 90 },
            ].map(item => (
              <div key={item.metric}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.metric}</span>
                  <span className={`font-semibold ${item.value >= item.target ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.value}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <Progress value={item.value} className="h-2 flex-1" />
                  <span className="text-xs text-slate-500 w-8 text-right">({item.target}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function VolunteersTab({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Total Volunteers"
          value={metrics.totalVolunteers}
          color="blue"
        />
        <MetricCard
          icon={<Activity className="w-6 h-6" />}
          label="Currently Active"
          value={metrics.activeVolunteers}
          color="green"
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          label="Avg Speed"
          value={`${metrics.averageSpeed} km/h`}
          color="purple"
        />
      </div>

      {/* Performance Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Top Performers</h3>
        <div className="space-y-4">
          {[
            { name: 'Rajesh Kumar', missions: 45, rating: 4.9, distance: 450 },
            { name: 'Priya Singh', missions: 42, rating: 4.8, distance: 420 },
            { name: 'Amit Patel', missions: 38, rating: 4.7, distance: 385 },
            { name: 'Anjali Verma', missions: 35, rating: 4.6, distance: 340 },
            { name: 'Vikram Reddy', missions: 32, rating: 4.5, distance: 310 },
          ].map(volunteer => (
            <div key={volunteer.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{volunteer.name}</div>
                <div className="text-xs text-slate-600">
                  {volunteer.missions} missions • {volunteer.distance} km
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-500 text-white">⭐ {volunteer.rating}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Experience Distribution</h3>
          <div className="space-y-3">
            {[
              { level: 'Senior (100+ missions)', count: 15, percent: 10 },
              { level: 'Intermediate (50-99)', count: 35, percent: 24 },
              { level: 'Regular (20-49)', count: 55, percent: 38 },
              { level: 'New (< 20)', count: 40, percent: 28 },
            ].map(level => (
              <div key={level.level}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{level.level}</span>
                  <span className="font-semibold">{level.count} volunteers</span>
                </div>
                <Progress value={level.percent} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Location Coverage</h3>
          <div className="space-y-3">
            {[
              { zone: 'North Zone', volunteers: 35, coverage: '95%' },
              { zone: 'South Zone', volunteers: 32, coverage: '92%' },
              { zone: 'East Zone', volunteers: 40, coverage: '98%' },
              { zone: 'West Zone', volunteers: 38, coverage: '96%' },
            ].map(zone => (
              <div key={zone.zone} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{zone.zone}</div>
                  <div className="text-xs text-slate-600">{zone.volunteers} volunteers</div>
                </div>
                <Badge variant="outline">{zone.coverage}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KycTab({ metrics }: { metrics: AnalyticsMetrics }) {
  const total = metrics.kycVerified + metrics.kycPending + metrics.kycRejected;
  const verifiedPercent = (metrics.kycVerified / total) * 100;
  const pendingPercent = (metrics.kycPending / total) * 100;
  const rejectedPercent = (metrics.kycRejected / total) * 100;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="Verified"
          value={metrics.kycVerified}
          color="green"
          context="Approved beneficiaries"
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          label="Pending Review"
          value={metrics.kycPending}
          color="orange"
          context="Under review"
        />
        <MetricCard
          icon={<AlertCircle className="w-6 h-6" />}
          label="Rejected"
          value={metrics.kycRejected}
          color="red"
          context="Did not meet criteria"
        />
      </div>

      {/* Verification Flow */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-6">KYC Verification Status Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-900 font-semibold">✓ Approved</span>
              <span className="text-green-600 font-semibold">{metrics.kycVerified} ({verifiedPercent.toFixed(1)}%)</span>
            </div>
            <Progress value={verifiedPercent} className="h-3 bg-green-100" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-orange-900 font-semibold">⏳ Pending</span>
              <span className="text-orange-600 font-semibold">{metrics.kycPending} ({pendingPercent.toFixed(1)}%)</span>
            </div>
            <Progress value={pendingPercent} className="h-3 bg-orange-100" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-red-900 font-semibold">✗ Rejected</span>
              <span className="text-red-600 font-semibold">{metrics.kycRejected} ({rejectedPercent.toFixed(1)}%)</span>
            </div>
            <Progress value={rejectedPercent} className="h-3 bg-red-100" />
          </div>
        </div>
      </Card>

      {/* Processing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Processing Time</h3>
          <div className="space-y-3">
            {[
              { timeframe: '< 1 hour', count: 280, percent: 35 },
              { timeframe: '1-2 hours', count: 320, percent: 40 },
              { timeframe: '2-4 hours', count: 160, percent: 20 },
              { timeframe: '> 4 hours', count: 40, percent: 5 },
            ].map(time => (
              <div key={time.timeframe}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{time.timeframe}</span>
                  <span className="font-semibold">{time.count} applications</span>
                </div>
                <Progress value={time.percent} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Document Verification Rate</h3>
          <div className="space-y-3">
            {[
              { doc: 'Aadhar', rate: 98 },
              { doc: 'Voter ID', rate: 95 },
              { doc: 'PAN', rate: 92 },
              { doc: 'Driving License', rate: 88 },
              { doc: 'Ration Card', rate: 85 },
            ].map(doc => (
              <div key={doc.doc}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{doc.doc}</span>
                  <span className="font-semibold text-slate-900">{doc.rate}%</span>
                </div>
                <Progress value={doc.rate} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MissionsTab({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Zap className="w-6 h-6" />}
          label="Missions Completed"
          value={metrics.missionsCompleted}
          color="purple"
        />
        <MetricCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="Acceptance Rate"
          value={`${metrics.missionAcceptanceRate}%`}
          color="green"
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          label="Avg Assignment Score"
          value="82/100"
          color="blue"
        />
      </div>

      {/* Assignment Quality */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" />
          Assignment Quality Breakdown
        </h3>
        <div className="space-y-4">
          {[
            { range: 'Excellent (90-100)', count: 245, percent: 72 },
            { range: 'Good (75-89)', count: 65, percent: 19 },
            { range: 'Fair (60-74)', count: 25, percent: 7 },
            { range: 'Poor (< 60)', count: 7, percent: 2 },
          ].map(range => (
            <div key={range.range}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{range.range}</span>
                <span className="font-semibold">{range.count} missions</span>
              </div>
              <Progress value={range.percent} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Mission Priority Distribution</h3>
          <div className="space-y-3">
            {[
              { priority: 'Urgent', count: 45, percent: 13 },
              { priority: 'High', count: 120, percent: 35 },
              { priority: 'Normal', count: 160, percent: 47 },
              { priority: 'Low', count: 17, percent: 5 },
            ].map(priority => (
              <div key={priority.priority} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{priority.priority}</div>
                  <div className="text-xs text-slate-600">{priority.count} missions</div>
                </div>
                <Badge variant="outline">{priority.percent}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Completion Time Analysis</h3>
          <div className="space-y-3">
            {[
              { time: '< 30 mins', missions: 120, percent: 35 },
              { time: '30-60 mins', missions: 145, percent: 42 },
              { time: '60-90 mins', missions: 55, percent: 16 },
              { time: '> 90 mins', missions: 22, percent: 7 },
            ].map(analysis => (
              <div key={analysis.time}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{analysis.time}</span>
                  <span className="font-semibold">{analysis.missions}</span>
                </div>
                <Progress value={analysis.percent} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RedistributionTab({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <div className="space-y-6">
      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Meals Distributed"
          value={metrics.mealsDistributed}
          color="orange"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="People Served"
          value={metrics.peopleServed}
          color="green"
        />
        <MetricCard
          icon={<MapPin className="w-6 h-6" />}
          label="NGOs Covered"
          value={metrics.ngosCovered}
          color="blue"
        />
      </div>

      {/* Efficiency Overview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          System Efficiency & Savings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-600 mb-2">Overall Efficiency</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-blue-600">{metrics.systemEfficiency}%</div>
              <div className="text-sm text-blue-600">↑ +5% vs last month</div>
            </div>
            <Progress value={metrics.systemEfficiency} className="h-3 mt-3" />
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-2">Cost Savings</div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-purple-600">₹{(metrics.costSavings / 1000).toFixed(0)}K</div>
              <div className="text-sm text-purple-600">↑ +12% vs last month</div>
            </div>
            <Progress value={75} className="h-3 mt-3" />
          </div>
        </div>
      </Card>

      {/* Distribution Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top NGO Recipients</h3>
          <div className="space-y-3">
            {[
              { ngo: 'Hope Foundation', meals: 3200, percent: 13 },
              { ngo: 'Smile Welfare', meals: 2800, percent: 11 },
              { ngo: 'Annapurna Trust', meals: 2400, percent: 10 },
              { ngo: 'Community Care', meals: 2000, percent: 8 },
              { ngo: 'Others (24 NGOs)', meals: 13960, percent: 58 },
            ].map(ngo => (
              <div key={ngo.ngo} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{ngo.ngo}</div>
                  <div className="text-xs text-slate-600">{ngo.meals} meals</div>
                </div>
                <Badge variant="outline">{ngo.percent}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Distribution Fairness</h3>
          <div className="space-y-4">
            {[
              { metric: 'Demand Coverage', score: 89, color: 'bg-green-100' },
              { metric: 'Capacity Balance', score: 85, color: 'bg-blue-100' },
              { metric: 'Geographic Spread', score: 92, color: 'bg-purple-100' },
              { metric: 'Utilization Rate', score: 88, color: 'bg-orange-100' },
            ].map(item => (
              <div key={item.metric} className={`p-3 rounded-lg ${item.color}`}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-900">{item.metric}</span>
                  <span className="font-bold text-slate-900">{item.score}%</span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Daily Trends */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Weekly Distribution Trend
        </h3>
        <div className="space-y-3">
          {[
            { day: 'Monday', meals: 2800, ngo: 18, people: 1400 },
            { day: 'Tuesday', meals: 3100, ngo: 20, people: 1550 },
            { day: 'Wednesday', meals: 2900, ngo: 19, people: 1450 },
            { day: 'Thursday', meals: 3400, ngo: 22, people: 1700 },
            { day: 'Friday', meals: 3600, ngo: 24, people: 1800 },
            { day: 'Saturday', meals: 4200, ngo: 26, people: 2100 },
            { day: 'Sunday', meals: 3560, ngo: 23, people: 1780 },
          ].map(day => (
            <div key={day.day} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-900">{day.day}</span>
                <div className="text-xs text-slate-600">
                  {day.meals} meals • {day.ngo} NGOs • {day.people} people
                </div>
              </div>
              <Progress value={(day.meals / 4200) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/**
 * Reusable metric card component
 */
function MetricCard({
  icon,
  label,
  value,
  color,
  context,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  context?: string;
}) {
  const bgColors = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-green-50 to-green-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
    red: 'from-red-50 to-red-100',
  };

  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${bgColors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`${iconColors[color]}`}>{icon}</div>
      </div>
      <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${textColors[color]} mb-2`}>{value}</div>
      {context && <div className="text-xs text-slate-600">{context}</div>}
    </Card>
  );
}
