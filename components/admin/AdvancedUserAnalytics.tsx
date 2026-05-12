/**
 * Advanced User Analytics Component
 * 
 * Deep user behavior analysis with:
 * - User segmentation
 * - Engagement metrics
 * - Retention analysis
 * - User journey tracking
 * - Cohort analysis
 * 
 * @component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Filter,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdvancedUserAnalytics() {
  const [selectedSegment, setSelectedSegment] = useState('all');

  // User engagement data
  const engagementData = [
    { week: 'Week 1', activeUsers: 450, newUsers: 120, engagementRate: 78 },
    { week: 'Week 2', activeUsers: 520, newUsers: 145, engagementRate: 82 },
    { week: 'Week 3', activeUsers: 480, newUsers: 98, engagementRate: 75 },
    { week: 'Week 4', activeUsers: 620, newUsers: 180, engagementRate: 88 },
  ];

  // User segments
  const segments = [
    { name: 'Highly Active', count: 245, percentage: 20, color: '#10b981' },
    { name: 'Regular', count: 490, percentage: 39, color: '#3b82f6' },
    { name: 'Occasional', count: 368, percentage: 29, color: '#f59e0b' },
    { name: 'Inactive', count: 147, percentage: 12, color: '#ef4444' },
  ];

  // Retention cohorts
  const retentionData = [
    { cohort: 'Jan 2026', retention: [95, 78, 65, 52, 45, 38, 32, 28] },
    { cohort: 'Feb 2026', retention: [92, 76, 63, 50, 42, 35, 30, 25] },
    { cohort: 'Mar 2026', retention: [88, 72, 58, 45, 38, 31, 27, 22] },
  ];

  // User actions by role
  const roleActions = [
    { role: 'Volunteer', donations: 125, missions: 340, verifications: 89, total: 554 },
    { role: 'NGO', donations: 234, missions: 156, verifications: 45, total: 435 },
    { role: 'Donor', donations: 890, missions: 23, verifications: 12, total: 925 },
    { role: 'Reporter', donations: 45, missions: 234, verifications: 156, total: 435 },
  ];

  // Feature adoption
  const featureAdoption = [
    { feature: 'Real-time Tracking', adoption: 72, trend: 'up' },
    { feature: 'KYC Verification', adoption: 85, trend: 'up' },
    { feature: 'Mission Assignments', adoption: 68, trend: 'up' },
    { feature: 'Analytics Dashboard', adoption: 52, trend: 'up' },
    { feature: 'Mobile App', adoption: 45, trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">1,250</p>
          <p className="text-xs text-blue-600 mt-2">↑ 12% from last month</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-medium">Active Users</p>
          <p className="text-2xl font-bold text-green-900 mt-1">892</p>
          <p className="text-xs text-green-600 mt-2">71% engagement rate</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Avg Session Time</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">24m 30s</p>
          <p className="text-xs text-purple-600 mt-2">↑ 5% increase</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Retention Rate</p>
          <p className="text-2xl font-bold text-orange-900 mt-1">68%</p>
          <p className="text-xs text-orange-600 mt-2">30-day cohort</p>
        </Card>
      </div>

      {/* Engagement Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Weekly Engagement Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="activeUsers" fill="#3b82f6" name="Active Users" />
            <Bar dataKey="newUsers" fill="#10b981" name="New Users" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* User Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            User Segmentation
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {segments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Segment Details */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Segment Breakdown
          </h3>
          <div className="space-y-3">
            {segments.map((segment, idx) => (
              <div
                key={idx}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setSelectedSegment(segment.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <p className="font-semibold text-slate-900">{segment.name}</p>
                  </div>
                  <Badge variant="outline">{segment.percentage}%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">{segment.count} users</p>
                  <div className="flex-1 ml-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        backgroundColor: segment.color,
                        width: `${segment.percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Role-based Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Actions by User Role</h3>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Role</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Donations</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Missions</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Verifications</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {roleActions.map((role, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{role.role}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      {role.donations}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      {role.missions}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                      {role.verifications}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{role.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Adoption */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Feature Adoption Rate
        </h3>
        <div className="space-y-4">
          {featureAdoption.map((feature, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{feature.feature}</p>
                  <Badge
                    className={`text-xs ${
                      feature.trend === 'up'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {feature.trend === 'up' ? '↑' : '↓'}
                  </Badge>
                </div>
                <p className="font-bold text-slate-900">{feature.adoption}%</p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, index) => {
                  const filled = index < Math.ceil(feature.adoption / 10);
                  return (
                    <div
                      key={`${feature.feature}-${index}`}
                      className={`h-2 flex-1 rounded-full ${filled ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-200'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Retention Cohorts */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          30-Day Retention Cohorts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2 px-3 font-semibold text-slate-900">Cohort</th>
                {Array.from({ length: 8 }, (_, i) => (
                  <th key={i} className="text-center py-2 px-2 font-semibold text-slate-900">
                    Day {(i + 1) * 7}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retentionData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900">{row.cohort}</td>
                  {row.retention.map((value, jdx) => (
                    <td key={jdx} className="text-center py-2 px-2">
                      <div
                        className={`rounded px-2 py-1 font-semibold text-white ${
                          value >= 75
                            ? 'bg-green-600'
                            : value >= 50
                              ? 'bg-yellow-600'
                              : value >= 25
                                ? 'bg-orange-600'
                                : 'bg-red-600'
                        }`}
                      >
                        {value}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
