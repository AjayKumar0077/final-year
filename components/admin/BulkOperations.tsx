/**
 * Bulk Operations Component
 * 
 * Manage multiple users at once with:
 * - Bulk user selection
 * - Batch actions (approve, reject, suspend, etc.)
 * - Progress tracking
 * - Undo capabilities
 * 
 * @component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Check,
  X,
  Lock,
  Unlock,
  Trash2,
  Mail,
  Download,
  Upload,
  CheckSquare,
  Square,
  RotateCcw,
  Loader2,
} from 'lucide-react';

interface BulkUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
}

export function BulkOperations() {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Sample data
  const users: BulkUser[] = [
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'volunteer', status: 'active' },
    { id: '2', name: 'Priya Singh', email: 'priya@example.com', role: 'ngo', status: 'active' },
    { id: '3', name: 'Amit Patel', email: 'amit@example.com', role: 'donor', status: 'pending' },
    { id: '4', name: 'Neha Sharma', email: 'neha@example.com', role: 'reporter', status: 'inactive' },
    { id: '5', name: 'Vikram Singh', email: 'vikram@example.com', role: 'volunteer', status: 'active' },
  ];

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const performBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;

    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setLastAction(action);
    
    // In production, this would send to backend
    console.log(`Performed ${action} on ${selectedUsers.size} users`);
  };

  const undoLastAction = () => {
    setLastAction(null);
    // In production, this would undo the action on backend
    console.log('Undo performed');
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge className="bg-blue-100 text-blue-800">{selectedUsers.size} selected</Badge>
          {lastAction && (
            <Badge className="bg-green-100 text-green-800">Last action: {lastAction}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Approve')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Reject')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Suspend')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Suspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Unsuspend')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
            Unsuspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Email')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex flex-col items-center justify-center text-xs"
            onClick={() => performBulkAction('Export')}
            disabled={selectedUsers.size === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Button>
          {lastAction && (
            <Button
              size="sm"
              variant="destructive"
              className="h-10 flex flex-col items-center justify-center text-xs"
              onClick={undoLastAction}
            >
              <RotateCcw className="w-4 h-4" />
              Undo
            </Button>
          )}
        </div>
      </Card>

      {/* User List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Select Users for Bulk Actions</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSelectAll}
            className="gap-2"
          >
            {selectedUsers.size === users.length ? (
              <>
                <CheckSquare className="w-4 h-4" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Select All
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => toggleUserSelection(user.id)}
            >
              <input
                type="checkbox"
                checked={selectedUsers.has(user.id)}
                onChange={() => toggleUserSelection(user.id)}
                className="w-4 h-4 cursor-pointer"
                aria-label={`Select ${user.name}`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-600 truncate">{user.email}</p>
              </div>
              <Badge className="capitalize text-xs">{user.role}</Badge>
              <Badge
                className={`text-xs ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-slate-100 text-slate-800'
                }`}
              >
                {user.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
