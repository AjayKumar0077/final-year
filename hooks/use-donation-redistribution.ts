'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  findOptimalRecipients,
  getRedistributionHistory,
  getRedistributionMetrics,
  type RedistributionPlan,
  type NGOCapacityInfo,
} from '@/lib/donation-redistribution-optimizer';
import type { Donation, UserProfile } from '@/lib/types';

/**
 * Hook for optimizing food donations to multiple recipients
 */
export function useDonationRedistribution() {
  const [plan, setPlan] = useState<RedistributionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Find optimal recipients for a donation
   */
  const findRecipients = useCallback(
    (
      donation: Donation,
      availableNgos: UserProfile[],
      capacityInfo?: Record<string, NGOCapacityInfo>
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = findOptimalRecipients(donation, availableNgos, capacityInfo);
        if (result) {
          setPlan(result);
          return result;
        } else {
          setError('No suitable recipients found for this donation');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to find recipients';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    plan,
    loading,
    error,
    findRecipients,
  };
}

/**
 * Hook for viewing redistribution analytics
 */
export function useRedistributionAnalytics() {
  const [history, setHistory] = useState<RedistributionPlan[]>([]);
  const [metrics, setMetrics] = useState({
    totalDistributions: 0,
    averageEfficiency: 0,
    totalMealsDistributed: 0,
    averageDistance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const historyData = getRedistributionHistory(100);
      const metricsData = getRedistributionMetrics();

      setHistory(historyData);
      setMetrics(metricsData);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh metrics
   */
  const refresh = useCallback(() => {
    try {
      const historyData = getRedistributionHistory(100);
      const metricsData = getRedistributionMetrics();

      setHistory(historyData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  }, []);

  return {
    history,
    metrics,
    loading,
    refresh,
  };
}

/**
 * Hook for managing NGO capacity information
 */
export function useNgoCapacityTracking() {
  const [capacityInfo, setCapacityInfo] = useState<Record<string, NGOCapacityInfo>>({});

  /**
   * Update capacity for an NGO
   */
  const updateCapacity = useCallback((ngoId: string, info: NGOCapacityInfo) => {
    setCapacityInfo(prev => ({
      ...prev,
      [ngoId]: info,
    }));
  }, []);

  /**
   * Batch update capacities
   */
  const updateBatch = useCallback((updates: Record<string, NGOCapacityInfo>) => {
    setCapacityInfo(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  return {
    capacityInfo,
    updateCapacity,
    updateBatch,
  };
}
