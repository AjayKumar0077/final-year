import type { Mission } from '@/lib/types';

export type MissionTrackingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export function getMissionTrackingStatus(mission: Mission): MissionTrackingStatus {
  if (mission.status === 'completed') return 'completed';
  if (mission.status === 'cancelled') return 'cancelled';
  if (mission.status === 'in_progress') return 'in_progress';
  if (mission.status === 'pending' && mission.assigned_volunteer_id) return 'assigned';
  return 'pending';
}

export function formatMissionTrackingStatus(status: MissionTrackingStatus): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'assigned') return 'Assigned';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}
