/**
 * Enhanced Admin Features Dashboard
 * 
 * Comprehensive admin control panel integrating:
 * - System Alerts
 * - Advanced Analytics
 * - Performance Monitoring
 * - Content Moderation
 * - Bulk Operations
 * - Audit Trail
 * 
 * @component
 * @route /admin/features
 */

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  BarChart3,
  Server,
  Flag,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
import { SystemAlerts } from '@/components/admin/SystemAlerts';
import { AdvancedUserAnalytics } from '@/components/admin/AdvancedUserAnalytics';
import { PerformanceMonitoring } from '@/components/admin/PerformanceMonitoring';
import { ContentModeration } from '@/components/admin/ContentModeration';
import { BulkOperations } from '@/components/admin/BulkOperations';
import { AuditTrail } from '@/components/admin/AuditTrail';

type TabType = 'alerts' | 'analytics' | 'performance' | 'moderation' | 'bulk' | 'audit';

export default function AdminFeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');

  const tabs = [
    {
      id: 'alerts',
      label: 'System Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Real-time system monitoring and alerts',
    },
    {
      id: 'analytics',
      label: 'User Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Advanced user behavior and engagement analysis',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Server className="w-4 h-4" />,
      description: 'System performance and database metrics',
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: <Flag className="w-4 h-4" />,
      description: 'Content review and user account moderation',
    },
    {
      id: 'bulk',
      label: 'Bulk Operations',
      icon: <Users className="w-4 h-4" />,
      description: 'Batch operations on multiple users',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: <FileText className="w-4 h-4" />,
      description: 'Detailed admin action history',
    },
  ];

  return (
    <DashboardLayout userRole="admin" userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Admin Features</h1>
          <p className="text-slate-600 mt-2">Advanced monitoring, analytics, and control features</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className="h-auto flex-col items-start justify-start p-3 text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                {tab.icon}
                <span className="font-semibold text-xs">{tab.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{tab.description}</span>
            </Button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'alerts' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <SystemAlerts />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <AdvancedUserAnalytics />
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <PerformanceMonitoring />
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <ContentModeration />
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <BulkOperations />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <AuditTrail />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
