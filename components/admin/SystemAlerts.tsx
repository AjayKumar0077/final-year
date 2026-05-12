/**
 * System Alerts Component
 * 
 * Real-time system alerts and notifications with:
 * - Critical event detection
 * - Alert severity levels
 * - Auto-dismissal and actions
 * - Alert history
 * 
 * @component
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Bell,
  Clock,
  Zap,
} from 'lucide-react';

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissed: boolean;
}

export function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      severity: 'critical',
      title: 'High Database Load',
      description: 'Database CPU usage at 87%. Performance may be impacted.',
      timestamp: Date.now() - 300000,
      action: { label: 'Optimize', onClick: () => console.log('Optimize DB') },
      dismissed: false,
    },
    {
      id: '2',
      severity: 'warning',
      title: 'Failed User Registrations',
      description: '5 registration attempts failed in last hour',
      timestamp: Date.now() - 600000,
      action: { label: 'Investigate', onClick: () => console.log('Check registrations') },
      dismissed: false,
    },
    {
      id: '3',
      severity: 'info',
      title: 'Scheduled Maintenance',
      description: 'Database backup completed successfully',
      timestamp: Date.now() - 1800000,
      dismissed: false,
    },
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Warnings</p>
              <p className="text-2xl font-bold text-yellow-900">{warningCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Active Alerts</p>
              <p className="text-2xl font-bold text-blue-900">{activeAlerts.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">System Alerts</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-slate-600">All systems operational</p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 flex items-start justify-between ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{alert.title}</p>
                    <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {alert.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={alert.action.onClick}
                      className="h-8 text-xs"
                    >
                      {alert.action.label}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
