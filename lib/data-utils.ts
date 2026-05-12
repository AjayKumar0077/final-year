/**
 * Unified data utilities for deduplication and normalization
 * Replaces scattered utility functions across components
 */

import { Donation, Mission, CaseReport, UserProfile } from './types';

/**
 * Generic deduplication function using ID as primary key
 * Falls back to fingerprint-based deduplication if ID is missing
 */
export function deduplicateById<T extends { id?: string }>(
  items: T[],
  fingerprint?: (item: T) => string,
): T[] {
  const byId = new Map<string, T>();
  const seenFingerprint = new Set<string>();
  const unique: T[] = [];

  items.forEach((item) => {
    // Check ID-based deduplication
    const id = typeof item.id === 'string' ? item.id : null;
    if (id) {
      if (byId.has(id)) {
        return; // Already seen this ID
      }
      byId.set(id, item);
    }

    // Check fingerprint-based deduplication if provided
    if (fingerprint) {
      const fp = fingerprint(item);
      if (seenFingerprint.has(fp)) {
        return; // Already seen this fingerprint
      }
      seenFingerprint.add(fp);
    }

    unique.push(item);
  });

  return unique;
}

/**
 * Deduplicates donations by ID and fingerprint
 */
export function dedupeDonations(items: Donation[]): Donation[] {
  return deduplicateById(items, (item) =>
    [
      item.description?.trim().toLowerCase() ?? '',
      String(item.quantity ?? ''),
      item.location?.trim().toLowerCase() ?? '',
      item.pickup_time_window?.trim().toLowerCase() ?? '',
      new Date(item.created_at).toISOString().slice(0, 16),
    ].join('|'),
  );
}

/**
 * Deduplicates missions by ID
 */
export function dedupeMissions(items: Mission[]): Mission[] {
  return deduplicateById(items, (item) =>
    [
      item.title?.trim().toLowerCase() ?? '',
      item.pickup_location?.trim().toLowerCase() ?? '',
      item.delivery_location?.trim().toLowerCase() ?? '',
      new Date(item.created_at).toISOString().slice(0, 10),
    ].join('|'),
  );
}

/**
 * Deduplicates case reports by ID
 */
export function dedupeCaseReports(items: CaseReport[]): CaseReport[] {
  return deduplicateById(items, (item) =>
    [
      item.title?.trim().toLowerCase() ?? '',
      item.location?.trim().toLowerCase() ?? '',
      item.reporter_id ?? '',
      new Date(item.created_at).toISOString().slice(0, 10),
    ].join('|'),
  );
}

/**
 * Deduplicates users by ID
 */
export function deduplicateUsers(items: UserProfile[]): UserProfile[] {
  return deduplicateById(items);
}

/**
 * Groups data by a specific field
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keySelector: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keySelector(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Maps items to a record by ID
 */
export function mapById<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, T>,
  );
}

/**
 * Filters and deduplicates in one pass
 */
export function filterDeduplicateBy<T extends { id?: string }>(
  items: T[],
  predicate: (item: T) => boolean,
  fingerprint?: (item: T) => string,
): T[] {
  return deduplicateById(items.filter(predicate), fingerprint);
}

/**
 * Sorts missions by priority and urgency
 */
export function sortMissionsByPriority(missions: Mission[]): Mission[] {
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  return [...missions].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Secondary sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Sorts case reports by urgency score
 */
export function sortCasesByUrgency(cases: CaseReport[]): CaseReport[] {
  return [...cases].sort((a, b) => b.urgency_score - a.urgency_score);
}

/**
 * Filters missions by status
 */
export function getMissionsByStatus(missions: Mission[], status: Mission['status']): Mission[] {
  return missions.filter((m) => m.status === status);
}

/**
 * Filters donations by assignment status
 */
export function getDonationsByStatus(
  donations: Donation[],
  status: Donation['assignment_status'],
): Donation[] {
  return donations.filter((d) => d.assignment_status === status);
}

/**
 * Counts items by status/type
 */
export function countByStatus<T extends { status?: string }>(
  items: T[],
  statusKey?: keyof T,
): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const key = statusKey ? String(item[statusKey]) : 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

/**
 * Validates data completeness
 */
export function isDataComplete<T>(item: T, requiredFields: (keyof T)[]): boolean {
  return requiredFields.every((field) => {
    const value = item[field];
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Normalizes whitespace and trims strings
 */
export function normalizeText(text: string | undefined | null): string {
  return (text ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  return normalizeText(input)
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, maxLength);
}

/**
 * Validates if a string looks like a phone number
 */
export function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Batches array into chunks
 */
export function batch<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Delays execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
