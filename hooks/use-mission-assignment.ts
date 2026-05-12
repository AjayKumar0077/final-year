'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSessionUserId } from '@/hooks/use-session';
import {
  findBestVolunteerForMission,
  batchAssignMissions,
  updateAssignmentMetrics,
  type MissionAssignmentResult,
  type AssignmentMetrics,
} from '@/lib/mission-assignment';
import type { Mission, UserProfile } from '@/lib/types';

/**
 * Hook for mission assignment operations
 */
export function useMissionAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAssignment, setLastAssignment] = useState<MissionAssignmentResult | null>(null);

  /**
   * Assign a single mission to the best available volunteer
   */
  const assignMission = useCallback(
    async (mission: Mission, availableVolunteers: UserProfile[]) => {
      setLoading(true);
      setError(null);

      try {
        const result = await findBestVolunteerForMission(mission, availableVolunteers);
        if (result) {
          setLastAssignment(result);
          return result;
        } else {
          setError('No suitable volunteer found for this mission');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign mission';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Assign multiple missions in a batch
   */
  const assignMissionBatch = useCallback(
    async (missions: Mission[], availableVolunteers: UserProfile[]) => {
      setLoading(true);
      setError(null);

      try {
        const results = await batchAssignMissions(missions, availableVolunteers);
        if (results.length > 0) {
          setLastAssignment(results[0]);
        }
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign missions';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    lastAssignment,
    assignMission,
    assignMissionBatch,
  };
}

/**
 * Hook to track volunteer performance metrics
 */
export function useVolunteerPerformance(volunteerId?: string) {
  const [metrics, setMetrics] = useState<AssignmentMetrics | null>(null);

  /**
   * Record mission completion and update metrics
   */
  const recordCompletion = useCallback(
    (accepted: boolean, completed: boolean, timeMinutes: number, rating: number) => {
      if (!volunteerId) return;

      updateAssignmentMetrics(volunteerId, accepted, completed, timeMinutes, rating);

      // In a real app, would fetch updated metrics here
      // For now, optimistically update local state
      if (metrics) {
        const newMetrics = { ...metrics };
        newMetrics.totalAssignments++;
        if (accepted) {
          newMetrics.completedAssignments++;
          newMetrics.acceptanceRate = newMetrics.completedAssignments / newMetrics.totalAssignments;
        }
        setMetrics(newMetrics);
      }
    },
    [volunteerId, metrics]
  );

  return {
    metrics,
    recordCompletion,
  };
}

/**
 * Hook to display assignment results and recommended volunteers
 */
export function useAssignmentRecommendations(mission?: Mission, volunteers?: UserProfile[]) {
  const [recommendations, setRecommendations] = useState<MissionAssignmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { assignMission } = useMissionAssignment();

  // Generate recommendations when mission or volunteers change
  useEffect(() => {
    if (!mission || !volunteers || volunteers.length === 0) {
      setRecommendations(null);
      return;
    }

    const generateRecommendations = async () => {
      setLoading(true);
      try {
        const result = await assignMission(mission, volunteers);
        setRecommendations(result);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [mission, volunteers, assignMission]);

  return {
    recommendations,
    loading,
  };
}
