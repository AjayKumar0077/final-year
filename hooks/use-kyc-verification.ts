'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  submitKycVerification,
  reviewKycVerification,
  getKycVerification,
  getKycReviewHistory,
  isKycVerified,
  getPendingKycVerifications,
  subscribeToKycChanges,
  calculateVerificationScore,
  validateKycData,
  type KycVerification,
  type KycReviewEntry,
} from '@/lib/kyc-verification';
import { writeAuditEvent } from '@/lib/audit-log';

/**
 * Hook to manage KYC verification for a recipient
 */
export function useKycVerification(recipientId?: string) {
  const [verification, setVerification] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<KycReviewEntry[]>([]);

  // Fetch current verification
  useEffect(() => {
    if (!recipientId) return;

    setLoading(true);
    try {
      const data = getKycVerification(recipientId);
      setVerification(data);
      setReviewHistory(getKycReviewHistory(recipientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC verification');
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToKycChanges(() => {
      if (recipientId) {
        const data = getKycVerification(recipientId);
        setVerification(data);
        setReviewHistory(getKycReviewHistory(recipientId));
      }
    });

    return unsubscribe;
  }, [recipientId]);

  // Submit verification
  const submit = useCallback(
    async (data: Omit<KycVerification, 'status' | 'createdAt' | 'updatedAt' | 'verificationScore'>) => {
      setLoading(true);
      setError(null);

      try {
        const result = submitKycVerification(data);
        if (result) {
          setVerification(result);
          setReviewHistory(getKycReviewHistory(recipientId || ''));
          writeAuditEvent({
            action: 'kyc_submitted_via_hook',
            targetId: recipientId || '',
          });
        } else {
          setError('Failed to submit KYC verification');
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [recipientId]
  );

  // Check if verified
  const isVerified = verification ? isKycVerified(verification.recipientId) : false;

  return {
    verification,
    isVerified,
    loading,
    error,
    reviewHistory,
    submit,
    refresh: () => {
      if (recipientId) {
        const data = getKycVerification(recipientId);
        setVerification(data);
      }
    },
  };
}

/**
 * Hook for admin to review KYC verifications
 */
export function useKycReview() {
  const [pendingVerifications, setPendingVerifications] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const pending = getPendingKycVerifications();
      setPendingVerifications(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToKycChanges(() => {
      const pending = getPendingKycVerifications();
      setPendingVerifications(pending);
    });

    return unsubscribe;
  }, []);

  // Review verification
  const review = useCallback(
    async (recipientId: string, status: 'approved' | 'rejected', reviewedBy: string, reason: string, score?: number) => {
      setLoading(true);
      setError(null);

      try {
        const result = reviewKycVerification(recipientId, status, reviewedBy, reason, score);
        if (result) {
          const pending = getPendingKycVerifications();
          setPendingVerifications(pending);
        } else {
          setError('Failed to review KYC verification');
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    pendingVerifications,
    loading,
    error,
    review,
    count: pendingVerifications.length,
  };
}

/**
 * Hook for validating KYC data before submission
 */
export function useKycValidation(data: Partial<KycVerification>) {
  const [validation, setValidation] = useState({ valid: true, errors: [] as string[] });

  useEffect(() => {
    const result = validateKycData(data);
    setValidation(result);
  }, [data]);

  const calculateScore = useCallback(() => {
    return calculateVerificationScore(data);
  }, [data]);

  return {
    ...validation,
    calculateScore,
  };
}
