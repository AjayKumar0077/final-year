/**
 * Performance Monitoring Component
 * 
 * Real-time system performance metrics:
 * - CPU and memory usage
 * - Database performance
 * - API response times
 * - User session metrics
 * - Performance trends
 * 
 * @component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Server,
  Database,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export function PerformanceMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sample performance data
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 52, latency: 120 },
    { time: '04:00', cpu: 38, memory: 48, latency: 110 },
    { time: '08:00', cpu: 72, memory: 68, latency: 200 },
    { time: '12:00', cpu: 85, memory: 82, latency: 350 },
    { time: '16:00', cpu: 68, memory: 65, latency: 240 },
    { time: '20:00', cpu: 52, memory: 58, latency: 160 },
    { time: '24:00', cpu: 42, memory: 50, latency: 130 },
  ];

  const databaseMetrics = [
    { metric: 'Connections', value: 145, limit: 200, status: 'good' },
    { metric: 'Query Time', value: 45, unit: 'ms', status: 'good' },
    { metric: 'Cache Hit Rate', value: 87, unit: '%', status: 'excellent' },
    { metric: 'Replication Lag', value: 2, unit: 'ms', status: 'good' },
  ];

  const apiMetrics = [
    { endpoint: '/api/donations', avgTime: 125, calls: 1250, errors: 3 },
    { endpoint: '/api/missions', avgTime: 98, calls: 980, errors: 0 },
    { endpoint: '/api/users', avgTime: 156, calls: 2340, errors: 5 },
    { endpoint: '/api/kyc', avgTime: 234, calls: 450, errors: 2 },
    { endpoint: '/api/analytics', avgTime: 892, calls: 120, errors: 1 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <Badge className={`text-xs ${getStatusColor('good')}`}>Good</Badge>
          </div>
          <p className="text-sm text-slate-600 font-medium">CPU Usage</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">68%</p>
          <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: '68%' }}></div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <Server className="w-6 h-6 text-purple-600" />
            <Badge className={`text-xs ${getStatusColor('good')}`}>Good</Badge>
          </div>
          <p className="text-sm text-slate-600 font-medium">Memory Usage</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">65%</p>
          <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600" style={{ width: '65%' }}></div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <Badge className={`text-xs ${getStatusColor('excellent')}`}>Excellent</Badge>
          </div>
          <p className="text-sm text-slate-600 font-medium">Response Time</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">162ms</p>
          <p className="text-xs text-slate-600 mt-2">↓ 12% from last hour</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-6 h-6 text-orange-600" />
            <Badge className={`text-xs ${getStatusColor('good')}`}>Good</Badge>
          </div>
          <p className="text-sm text-slate-600 font-medium">Error Rate</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">0.32%</p>
          <p className="text-xs text-slate-600 mt-2">11 errors in 1h</p>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Performance Trends (24h)</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
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
            <Area
              type="monotone"
              dataKey="cpu"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="CPU %"
            />
            <Area
              type="monotone"
              dataKey="memory"
              stackId="1"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.3}
              name="Memory %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Database Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-600" />
          Database Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {databaseMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-slate-600 font-medium mb-2">{metric.metric}</p>
              <p className="text-2xl font-bold text-slate-900">
                {metric.value}
                <span className="text-lg ml-1">
                  {metric.unit || (metric.metric === 'Connections' ? `/${metric.limit}` : '')}
                </span>
              </p>
              <Badge className={`text-xs mt-2 ${getStatusColor(metric.status)}`}>
                {metric.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* API Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">API Endpoint Performance</h3>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Endpoint</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Avg Response</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Total Calls</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Errors</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Error Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {apiMetrics.map((api, idx) => {
                const errorRate = ((api.errors / api.calls) * 100).toFixed(2);
                const errorStatus =
                  Number(errorRate) > 1 ? 'critical' : Number(errorRate) > 0.5 ? 'warning' : 'good';
                return (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900 font-mono text-xs">
                      {api.endpoint}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          api.avgTime > 500
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : api.avgTime > 200
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {api.avgTime}ms
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{api.calls}</td>
                    <td className="py-3 px-4">
                      {api.errors > 0 ? (
                        <Badge variant="destructive">{api.errors}</Badge>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={getStatusColor(errorStatus)}
                      >
                        {errorRate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          errorStatus === 'good'
                            ? 'bg-green-600'
                            : errorStatus === 'warning'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                        }`}
                      ></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Latency Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">API Latency Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 5 }}
              name="Latency (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
