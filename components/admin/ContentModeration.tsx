/**
 * Content Moderation Component
 * 
 * Manage reported content with:
 * - Flagged content queue
 * - Severity assessment
 * - Approve/Reject actions
 * - User warnings
 * - Content history
 * 
 * @component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Flag,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  MessageCircle,
  User,
  Clock,
  Check,
  X,
} from 'lucide-react';

interface FlaggedContent {
  id: string;
  type: 'post' | 'comment' | 'profile' | 'image' | 'message';
  content: string;
  author: string;
  reportedBy: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  reportCount: number;
}

export function ContentModeration() {
  const [contents, setContents] = useState<FlaggedContent[]>([
    {
      id: '1',
      type: 'post',
      content: 'Misleading donation information about our NGO...',
      author: 'Suspicious User #123',
      reportedBy: '3 users',
      reason: 'Misinformation',
      severity: 'high',
      timestamp: Date.now() - 300000,
      status: 'pending',
      reportCount: 3,
    },
    {
      id: '2',
      type: 'comment',
      content: 'Offensive language in discussion thread...',
      author: 'Anonymous',
      reportedBy: '5 users',
      reason: 'Inappropriate language',
      severity: 'critical',
      timestamp: Date.now() - 600000,
      status: 'pending',
      reportCount: 5,
    },
    {
      id: '3',
      type: 'profile',
      content: 'Profile with fake verification badges',
      author: 'Fake NGO Account',
      reportedBy: '2 users',
      reason: 'Impersonation',
      severity: 'high',
      timestamp: Date.now() - 900000,
      status: 'pending',
      reportCount: 2,
    },
    {
      id: '4',
      type: 'image',
      content: 'Image violates community guidelines',
      author: 'User #456',
      reportedBy: '7 users',
      reason: 'Explicit content',
      severity: 'critical',
      timestamp: Date.now() - 1200000,
      status: 'pending',
      reportCount: 7,
    },
    {
      id: '5',
      type: 'message',
      content: 'Private message with solicitation',
      author: 'Spammer #789',
      reportedBy: '1 user',
      reason: 'Spam',
      severity: 'medium',
      timestamp: Date.now() - 1500000,
      status: 'approved',
      reportCount: 1,
    },
  ]);

  const [selectedContent, setSelectedContent] = useState<string | null>(null);

  const approveContent = (id: string) => {
    setContents(contents.map(c => c.id === id ? { ...c, status: 'approved' as const } : c));
  };

  const rejectContent = (id: string) => {
    setContents(contents.map(c => c.id === id ? { ...c, status: 'rejected' as const } : c));
  };

  const deleteContent = (id: string) => {
    setContents(contents.filter(c => c.id !== id));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="w-4 h-4" />;
      case 'profile':
        return <User className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const pendingCount = contents.filter(c => c.status === 'pending').length;
  const criticalCount = contents.filter(c => c.severity === 'critical' && c.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-700 font-medium">Critical Issues</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{criticalCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-orange-900 mt-1">{pendingCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-sm text-green-700 font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{contents.filter(c => c.status === 'approved').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <p className="text-sm text-slate-700 font-medium">Total Flagged</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{contents.length}</p>
        </Card>
      </div>

      {/* Content Queue */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Content Moderation Queue</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {contents
            .filter(c => c.status === 'pending')
            .sort((a, b) => {
              const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
            })
            .map((content) => (
              <div
                key={content.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${getSeverityColor(content.severity)} ${selectedContent === content.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                onClick={() => setSelectedContent(selectedContent === content.id ? null : content.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(content.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(content.type)}
                        <p className="font-semibold capitalize">{content.type}</p>
                        <Badge className="text-xs">{content.reason}</Badge>
                      </div>
                      <p className="text-sm opacity-90 mt-1">{content.content}</p>
                    </div>
                  </div>
                  <Badge className="text-xs font-bold">{content.reportCount} reports</Badge>
                </div>

                <div className="flex items-center justify-between text-xs opacity-75 mb-3">
                  <div className="flex items-center gap-4">
                    <span>By: {content.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(content.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {selectedContent === content.id && (
                  <div className="flex items-center gap-2 pt-3 border-t border-current border-opacity-20">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        approveContent(content.id);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectContent(content.id);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContent(content.id);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Warn user:', content.author);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Warn User
                    </Button>
                  </div>
                )}
              </div>
            ))}

          {contents.filter(c => c.status === 'pending').length === 0 && (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">All content reviewed</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recently Reviewed */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recently Reviewed</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {contents
            .filter(c => c.status !== 'pending')
            .slice(0, 10)
            .map((content) => (
              <div key={content.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(content.type)}
                  <div>
                    <p className="font-medium text-sm text-slate-900">{content.content}</p>
                    <p className="text-xs text-slate-600">{content.reason}</p>
                  </div>
                </div>
                <Badge
                  className={`text-xs ${
                    content.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {content.status}
                </Badge>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
