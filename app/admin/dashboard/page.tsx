/**
 * Admin Home Dashboard
 * 
 * Comprehensive admin control center with:
 * - Real-time system metrics and monitoring
 * - Role-based user management
 * - KYC verification oversight
 * - Mission and donation tracking
 * - System health and performance
 * - Quick action controls
 * 
 * @component
 * @route /admin
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Database,
  Server,
  Eye,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  MoreVertical,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface SystemMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

interface RecentUser {
  id: string;
  name: string;
  role: string;
  email: string;
  joinedAt: string;
  status: 'active' | 'inactive' | 'pending';
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
}

/**
 * Admin Dashboard - Main control center
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'monitoring' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);

  // Sample data - replace with real API calls
  const systemMetrics: SystemMetric[] = [
    {
      label: 'Total Users',
      value: 1250,
      change: 12,
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
    },
    {
      label: 'Active Sessions',
      value: 342,
      change: 8,
      icon: <Activity className="w-6 h-6" />,
      color: 'green',
    },
    {
      label: 'KYC Pending',
      value: 45,
      change: -5,
      icon: <FileText className="w-6 h-6" />,
      color: 'yellow',
    },
    {
      label: 'System Health',
      value: '99.8%',
      change: 0.2,
      icon: <Server className="w-6 h-6" />,
      color: 'purple',
    },
  ];

  const recentUsers: RecentUser[] = [
    {
      id: '1',
      name: 'Priya Singh',
      role: 'volunteer',
      email: 'priya@foodbridge.local',
      joinedAt: '2 hours ago',
      status: 'active',
    },
    {
      id: '2',
      name: 'Amit Patel',
      role: 'donor',
      email: 'amit@foodbridge.local',
      joinedAt: '5 hours ago',
      status: 'active',
    },
    {
      id: '3',
      name: 'Hope Foundation',
      role: 'ngo',
      email: 'hope@foodbridge.local',
      joinedAt: '1 day ago',
      status: 'pending',
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      user: 'Rajesh Kumar',
      action: 'Started mission',
      target: 'Restaurant Pickup #456',
      timestamp: '2 minutes ago',
      status: 'success',
    },
    {
      id: '2',
      user: 'NGO Manager',
      action: 'Updated recipient',
      target: 'Shelter #123',
      timestamp: '15 minutes ago',
      status: 'success',
    },
    {
      id: '3',
      user: 'System',
      action: 'Failed verification',
      target: 'KYC Review #789',
      timestamp: '1 hour ago',
      status: 'error',
    },
  ];

  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-800',
      border: 'border-green-200',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-800',
      border: 'border-red-200',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800',
      border: 'border-yellow-200',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      border: 'border-purple-200',
    },
  };

  const getStatusColor = (status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'active':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <DashboardLayout userRole="admin" userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">System overview and control center</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200">
          {(['overview', 'users', 'monitoring', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemMetrics.map((metric, idx) => {
                const colors = colorMap[metric.color];
                return (
                  <Card
                    key={idx}
                    className={`p-6 border ${colors.border} ${colors.bg} hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${colors.icon} p-3 bg-white rounded-lg`}>{metric.icon}</div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${colors.badge}`}>
                        {metric.change >= 0 ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">{Math.abs(metric.change)}%</span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                  </Card>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users - 2/3 width */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Recent Users</h2>
                  <Button variant="outline" className="text-xs">
                    View All
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <Card className="overflow-hidden">
                  <div className="divide-y divide-slate-200">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <Badge className="capitalize text-xs">{user.role}</Badge>
                              <Badge className={`text-xs ${getStatusColor(user.status)}`}>
                                {user.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mb-2">{user.email}</p>
                            <p className="text-xs text-slate-500">{user.joinedAt}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Quick Actions - 1/3 width */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <FileText className="w-4 h-4" />
                    Review KYC (45)
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Zap className="w-4 h-4" />
                    Active Missions
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    View Alerts
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activities</h2>
              <Card>
                <div className="divide-y divide-slate-200">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.status === 'success'
                                ? 'bg-green-100'
                                : activity.status === 'error'
                                  ? 'bg-red-100'
                                  : 'bg-yellow-100'
                            }`}
                          >
                            {activity.status === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : activity.status === 'error' ? (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {activity.user} <span className="text-slate-600 font-normal">{activity.action}</span>
                            </p>
                            <p className="text-sm text-slate-600">{activity.target}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{activity.timestamp}</p>
                          <Badge className={`text-xs mt-1 ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-slate-600">User management interface - Coming soon</p>
              <Button className="mt-4 gap-2">
                <Users className="w-4 h-4" />
                Go to User Management
              </Button>
            </Card>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-slate-600">System monitoring interface - Coming soon</p>
              <Button className="mt-4 gap-2">
                <Server className="w-4 h-4" />
                Go to Monitoring
              </Button>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-slate-600">System settings interface - Coming soon</p>
              <Button className="mt-4 gap-2">
                <Settings className="w-4 h-4" />
                Go to Settings
              </Button>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
