/**
 * Audit Trail Component
 * 
 * Comprehensive admin action history with:
 * - Detailed action logs
 * - User filtering
 * - Date/time filtering
 * - Action type filtering
 * - Export capabilities
 * 
 * @component
 */

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  Download,
  Filter,
  ChevronDown,
  User,
  Users,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  targetType: 'user' | 'content' | 'system' | 'donation' | 'mission';
  timestamp: number;
  details: string;
  status: 'success' | 'failed';
  ipAddress: string;
}

export function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Sample audit logs
  const logs: AuditLog[] = [
    {
      id: '1',
      admin: 'Admin User',
      action: 'user_approved',
      target: 'Rajesh Kumar',
      targetType: 'user',
      timestamp: Date.now() - 300000,
      details: 'KYC verification approved for volunteer account',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      admin: 'Admin User',
      action: 'user_suspended',
      target: 'Suspicious Account',
      targetType: 'user',
      timestamp: Date.now() - 600000,
      details: 'Account suspended due to fraudulent activity',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: '3',
      admin: 'Admin User',
      action: 'content_deleted',
      target: 'Inappropriate Post #456',
      targetType: 'content',
      timestamp: Date.now() - 900000,
      details: 'Removed content violating community guidelines',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: '4',
      admin: 'Admin User',
      action: 'donation_modified',
      target: 'Donation #789',
      targetType: 'donation',
      timestamp: Date.now() - 1200000,
      details: 'Updated donation allocation to NGO partner',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: '5',
      admin: 'Admin User',
      action: 'user_exported',
      target: 'Users Export',
      targetType: 'system',
      timestamp: Date.now() - 1500000,
      details: 'Exported user data report (1,250 records)',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: '6',
      admin: 'Admin User',
      action: 'user_deleted',
      target: 'Inactive Account #342',
      targetType: 'user',
      timestamp: Date.now() - 1800000,
      details: 'Deleted inactive user account after 6 months',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [searchQuery, filterAction, filterStatus]);

  const getActionIcon = (action: string) => {
    if (action.includes('approved')) return <Eye className="w-4 h-4 text-green-600" />;
    if (action.includes('suspended') || action.includes('deleted')) return <Lock className="w-4 h-4 text-red-600" />;
    if (action.includes('modified') || action.includes('edited')) return <Edit className="w-4 h-4 text-blue-600" />;
    if (action.includes('exported')) return <Download className="w-4 h-4 text-purple-600" />;
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const getTargetColor = (targetType: string) => {
    switch (targetType) {
      case 'user':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'content':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'donation':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'mission':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <p className="text-sm text-slate-600 font-medium">Total Actions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-600 font-medium">Successful</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{logs.filter(l => l.status === 'success').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-600 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{logs.filter(l => l.status === 'failed').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Today</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{logs.filter(l => l.timestamp > Date.now() - 86400000).length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex flex-wrap gap-3 items-center">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search admin, user, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search audit logs"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by action type"
          >
            <option value="all">All Actions</option>
            <option value="user_approved">User Approved</option>
            <option value="user_suspended">User Suspended</option>
            <option value="user_deleted">User Deleted</option>
            <option value="content_deleted">Content Deleted</option>
            <option value="donation_modified">Donation Modified</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Audit Trail ({filteredLogs.length})</h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Timestamp</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Admin</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Action</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Target</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="font-medium text-slate-900">{log.admin}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-xs font-medium text-slate-900">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`capitalize text-xs ${getTargetColor(log.targetType)}`}>
                      {log.target}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`text-xs ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                      className="h-6 text-xs"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showDetails === log.id ? 'rotate-180' : ''}`} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Expandable */}
        {showDetails && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            {filteredLogs
              .filter(l => l.id === showDetails)
              .map(log => (
                <div key={log.id} className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">Details</p>
                      <p className="text-sm text-slate-900">{log.details}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">IP Address</p>
                      <p className="text-sm font-mono text-slate-900">{log.ipAddress}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
