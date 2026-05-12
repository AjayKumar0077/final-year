/**
 * KYC (Know Your Customer) Verification System
 * Handles recipient verification, beneficiary validation, and compliance checks
 */

import { writeAuditEvent } from '@/lib/audit-log';
import { errorHandler } from '@/lib/error-handler';

export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface KycDocument {
  type: 'aadhar' | 'voter_id' | 'pan' | 'driving_license' | 'ration_card' | 'other';
  documentNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
}

export interface KycVerification {
  recipientId: string;
  status: KycStatus;
  fullName: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address: string;
  documents: KycDocument[];
  verificationScore: number; // 0-100
  verifiedBy?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  lastVerifiedAt?: number;
  nextReviewDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface KycReviewEntry {
  recipientId: string;
  status: KycStatus;
  reviewedBy: string;
  reviewDate: number;
  reason: string;
  verificationScore: number;
  documentList: string[];
}

// Validation rules for KYC
const KYC_VALIDATION_RULES = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  VALID_PHONE_REGEX: /^[6-9]\d{9}$/,
  MIN_ADDRESS_LENGTH: 10,
  MAX_ADDRESS_LENGTH: 500,
  MIN_VERIFICATION_SCORE: 60,
  APPROVAL_THRESHOLD: 75,
  REVIEW_INTERVAL_DAYS: 365,
};

const STORAGE_KEY = 'kyc_verifications';
const REVIEW_HISTORY_KEY = 'kyc_review_history';
const CHANGE_EVENT = 'kyc_verification_updated';

/**
 * Validate KYC verification data
 */
export function validateKycData(data: Partial<KycVerification>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Name validation
  if (!data.fullName) {
    errors.push('Full name is required');
  } else if (data.fullName.length < KYC_VALIDATION_RULES.MIN_NAME_LENGTH) {
    errors.push(`Full name must be at least ${KYC_VALIDATION_RULES.MIN_NAME_LENGTH} characters`);
  } else if (data.fullName.length > KYC_VALIDATION_RULES.MAX_NAME_LENGTH) {
    errors.push(`Full name must not exceed ${KYC_VALIDATION_RULES.MAX_NAME_LENGTH} characters`);
  }

  // Phone validation
  if (!data.phone) {
    errors.push('Phone number is required');
  } else if (!KYC_VALIDATION_RULES.VALID_PHONE_REGEX.test(data.phone)) {
    errors.push('Invalid Indian phone number format');
  }

  // Address validation
  if (!data.address) {
    errors.push('Address is required');
  } else if (data.address.length < KYC_VALIDATION_RULES.MIN_ADDRESS_LENGTH) {
    errors.push(`Address must be at least ${KYC_VALIDATION_RULES.MIN_ADDRESS_LENGTH} characters`);
  } else if (data.address.length > KYC_VALIDATION_RULES.MAX_ADDRESS_LENGTH) {
    errors.push(`Address must not exceed ${KYC_VALIDATION_RULES.MAX_ADDRESS_LENGTH} characters`);
  }

  // Documents validation
  if (!data.documents || data.documents.length === 0) {
    errors.push('At least one document is required');
  }

  // Email validation (if provided)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate verification score based on submitted documents and information
 */
export function calculateVerificationScore(data: Partial<KycVerification>): number {
  let score = 0;

  // Base score for complete information (30 points)
  if (data.fullName && data.phone && data.address) {
    score += 30;
  }

  // Document score (40 points)
  if (data.documents && data.documents.length > 0) {
    const docScore = Math.min(data.documents.length * 15, 40);
    score += docScore;
  }

  // Additional info score (30 points)
  if (data.email) score += 10;
  if (data.dateOfBirth) score += 10;
  if (data.documents?.some(d => d.expiryDate)) score += 10;

  return Math.min(score, 100);
}

/**
 * Submit KYC verification for review
 */
export function submitKycVerification(data: Omit<KycVerification, 'status' | 'createdAt' | 'updatedAt' | 'verificationScore'>): KycVerification | null {
  if (typeof window === 'undefined') return null;

  try {
    const validation = validateKycData(data);
    if (!validation.valid) {
      errorHandler.handleValidationError('KYC validation failed', validation.errors.join(', '));
      return null;
    }

    const verificationScore = calculateVerificationScore(data);
    const verification: KycVerification = {
      ...data,
      status: 'under_review',
      verificationScore,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const verifications = readVerifications();
    verifications[data.recipientId] = verification;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifications));

    writeAuditEvent({
      action: 'kyc_submitted',
      targetId: data.recipientId,
      details: {
        verificationScore,
        documentCount: data.documents.length,
      },
    });

    window.dispatchEvent(new Event(CHANGE_EVENT));
    return verification;
  } catch (error) {
    errorHandler.handleDatabaseError('Error submitting KYC verification', error);
    return null;
  }
}

/**
 * Review and approve/reject KYC verification
 */
export function reviewKycVerification(
  recipientId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reason: string,
  score?: number
): KycVerification | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!recipientId || !reviewedBy || !reason) {
      errorHandler.handleValidationError('Invalid review parameters', 'recipientId, reviewedBy, and reason are required');
      return null;
    }

    const verifications = readVerifications();
    const verification = verifications[recipientId];

    if (!verification) {
      errorHandler.handleValidationError('Verification not found', `No KYC verification found for recipient ${recipientId}`);
      return null;
    }

    const newScore = score ?? verification.verificationScore;

    // Auto-determine status based on score if not explicitly provided
    let finalStatus: KycStatus = status;
    if (newScore >= KYC_VALIDATION_RULES.APPROVAL_THRESHOLD && status === 'approved') {
      finalStatus = 'approved';
    } else if (newScore < KYC_VALIDATION_RULES.MIN_VERIFICATION_SCORE) {
      finalStatus = 'rejected';
    }

    verification.status = finalStatus;
    verification.verificationScore = newScore;
    verification.verifiedBy = reviewedBy;
    verification.verificationNotes = reason;
    verification.lastVerifiedAt = Date.now();
    verification.updatedAt = Date.now();

    if (finalStatus === 'approved') {
      verification.nextReviewDate = Date.now() + KYC_VALIDATION_RULES.REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    } else if (finalStatus === 'rejected') {
      verification.rejectionReason = reason;
    }

    verifications[recipientId] = verification;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifications));

    // Add to review history
    addReviewHistory({
      recipientId,
      status: finalStatus,
      reviewedBy,
      reviewDate: Date.now(),
      reason,
      verificationScore: newScore,
      documentList: verification.documents.map(d => d.type),
    });

    writeAuditEvent({
      action: 'kyc_reviewed',
      targetId: recipientId,
      details: {
        status: finalStatus,
        score: newScore,
        reviewedBy,
      },
    });

    window.dispatchEvent(new Event(CHANGE_EVENT));
    return verification;
  } catch (error) {
    errorHandler.handleDatabaseError('Error reviewing KYC verification', error);
    return null;
  }
}

/**
 * Get KYC verification for a recipient
 */
export function getKycVerification(recipientId: string): KycVerification | null {
  if (typeof window === 'undefined') return null;

  try {
    const verifications = readVerifications();
    const verification = verifications[recipientId] ?? null;

    // Check if verification has expired
    if (verification && verification.nextReviewDate && verification.nextReviewDate < Date.now()) {
      verification.status = 'expired';
    }

    return verification;
  } catch (error) {
    console.error('Error retrieving KYC verification:', error);
    return null;
  }
}

/**
 * Check if recipient is KYC verified (approved and not expired)
 */
export function isKycVerified(recipientId: string): boolean {
  const verification = getKycVerification(recipientId);
  return verification?.status === 'approved' && (!verification.nextReviewDate || verification.nextReviewDate > Date.now());
}

/**
 * Get KYC review history for a recipient
 */
export function getKycReviewHistory(recipientId: string): KycReviewEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const history = readReviewHistory();
    return history[recipientId] ?? [];
  } catch (error) {
    console.error('Error retrieving KYC review history:', error);
    return [];
  }
}

/**
 * Get all pending KYC verifications for admin review
 */
export function getPendingKycVerifications(): KycVerification[] {
  if (typeof window === 'undefined') return [];

  try {
    const verifications = readVerifications();
    return Object.values(verifications).filter(v => v.status === 'under_review');
  } catch (error) {
    console.error('Error retrieving pending KYC verifications:', error);
    return [];
  }
}

/**
 * Get batch of KYC verifications for review (paginated)
 */
export function getKycVerificationsForReview(page: number = 1, pageSize: number = 20): {
  verifications: KycVerification[];
  total: number;
  page: number;
  pageCount: number;
} {
  const pending = getPendingKycVerifications();
  const total = pending.length;
  const pageCount = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    verifications: pending.slice(start, end),
    total,
    page,
    pageCount,
  };
}

/**
 * Subscribe to KYC verification changes
 */
export function subscribeToKycChanges(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

// Private helpers

function readVerifications(): Record<string, KycVerification> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading KYC verifications:', error);
    return {};
  }
}

function readReviewHistory(): Record<string, KycReviewEntry[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(REVIEW_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error reading review history:', error);
    return {};
  }
}

function addReviewHistory(entry: KycReviewEntry): void {
  if (typeof window === 'undefined') return;

  try {
    const history = readReviewHistory();
    if (!history[entry.recipientId]) {
      history[entry.recipientId] = [];
    }
    history[entry.recipientId].push(entry);
    localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding review history:', error);
  }
}
