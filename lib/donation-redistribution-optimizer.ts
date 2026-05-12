/**
 * Optimized Food Redistribution Algorithm
 * Balances efficiency, fairness, and impact when distributing food donations
 */

import type { Donation, UserProfile } from '@/lib/types';
import { calculateHaversineDistance } from '@/lib/geo-distance';
import { writeAuditEvent } from '@/lib/audit-log';

export interface NGOCapacityInfo {
  ngoId: string;
  ngoName: string;
  currentLoad: number; // Number of people being served
  maxCapacity: number;
  utilizationRate: number; // 0-1
  lastFedAt?: number;
}

export interface DonationRecipient {
  ngoId: string;
  ngoName: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  score: number;
  factors: {
    distanceScore: number;
    capacityScore: number;
    demandScore: number;
    fairnessScore: number;
    specializedScore: number; // For dietary requirements, medical, etc.
  };
  reasons: string[];
}

export interface RedistributionPlan {
  donationId: string;
  primaryRecipient: DonationRecipient;
  secondaryRecipients: DonationRecipient[];
  totalServed: number;
  efficiency: number; // 0-1 score for this distribution
  plan: string;
}

// Redistribution configuration
const REDISTRIBUTION_CONFIG = {
  MAX_DISTANCE_KM: 50,
  PREFERRED_DISTANCE_KM: 5,
  EQUAL_SPLIT_THRESHOLD: 0.6, // If utilization > this, consider splitting
  EFFICIENCY_WEIGHT: 0.20,
  FAIRNESS_WEIGHT: 0.20,
  DEMAND_WEIGHT: 0.25,
  DISTANCE_WEIGHT: 0.20,
  SPECIALIZED_WEIGHT: 0.15,
};

const CAPACITY_CACHE_KEY = 'ngo_capacity_cache';
const REDISTRIBUTION_HISTORY_KEY = 'redistribution_history';

/**
 * Find optimal recipient(s) for a donation using multi-objective optimization
 */
export function findOptimalRecipients(
  donation: Donation,
  availableNgos: UserProfile[],
  capacityInfo?: Record<string, NGOCapacityInfo>
): RedistributionPlan | null {
  if (!donation || availableNgos.length === 0) {
    return null;
  }

  const pickupLat = donation.pickup_latitude;
  const pickupLon = donation.pickup_longitude;

  if (typeof pickupLat !== 'number' || typeof pickupLon !== 'number') {
    console.warn('Donation has no valid location');
    return null;
  }

  // Score all NGOs
  const recipients = availableNgos
    .map(ngo => scoreNgoForRecipient(ngo, donation, pickupLat, pickupLon, capacityInfo))
    .filter(r => r.score >= 40)
    .sort((a, b) => b.score - a.score);

  if (recipients.length === 0) {
    console.warn('No suitable NGO found for donation');
    return null;
  }

  // Determine if we should split the donation
  const primaryRecipient = recipients[0];
  const shouldSplit = shouldSplitDonation(donation, primaryRecipient, recipients, capacityInfo);

  const plan: RedistributionPlan = {
    donationId: donation.id,
    primaryRecipient,
    secondaryRecipients: shouldSplit ? recipients.slice(1, 2) : [],
    totalServed: calculatePeopleServed(donation),
    efficiency: calculateEfficiency(primaryRecipient, shouldSplit ? recipients[1] : null),
    plan: generateDistributionPlan(primaryRecipient, shouldSplit ? recipients[1] : null, donation),
  };

  // Log the redistribution plan
  logRedistributionPlan(plan);

  return plan;
}

/**
 * Score an NGO as a recipient for a donation
 */
function scoreNgoForRecipient(
  ngo: UserProfile,
  donation: Donation,
  donationLat: number,
  donationLon: number,
  capacityInfo?: Record<string, NGOCapacityInfo>
): DonationRecipient {
  const reasons: string[] = [];

  // 1. Distance Score (0-20)
  const distanceScore = calculateDistanceScore(ngo, donationLat, donationLon);
  if (distanceScore < 5) {
    reasons.push('Too far from donation location');
  }

  // 2. Capacity Score (0-25)
  const capacityScore = calculateCapacityScore(ngo.id, capacityInfo);
  if (capacityScore < 10) {
    reasons.push('NGO at or near capacity');
  }

  // 3. Demand Score (0-25) - How much the NGO needs this
  const demandScore = calculateDemandScore(ngo, capacityInfo);

  // 4. Fairness Score (0-15) - Balance distribution across all NGOs
  const fairnessScore = calculateFairnessScore(ngo, capacityInfo);

  // 5. Specialized Score (0-15) - Match dietary/special requirements
  const specializedScore = calculateSpecializedScore(ngo, donation);

  // Calculate weighted total
  const totalScore =
    distanceScore * REDISTRIBUTION_CONFIG.DISTANCE_WEIGHT +
    capacityScore * REDISTRIBUTION_CONFIG.EFFICIENCY_WEIGHT +
    demandScore * REDISTRIBUTION_CONFIG.DEMAND_WEIGHT +
    fairnessScore * REDISTRIBUTION_CONFIG.FAIRNESS_WEIGHT +
    specializedScore * REDISTRIBUTION_CONFIG.SPECIALIZED_WEIGHT;

  return {
    ngoId: ngo.id,
    ngoName: ngo.organization || ngo.full_name || 'NGO',
    latitude: ngo.latitude || 0,
    longitude: ngo.longitude || 0,
    distance_km: calculateHaversineDistance(
      { latitude: ngo.latitude || 0, longitude: ngo.longitude || 0 },
      { latitude: donationLat, longitude: donationLon }
    ),
    score: Math.round(totalScore),
    factors: {
      distanceScore: Math.round(distanceScore),
      capacityScore: Math.round(capacityScore),
      demandScore: Math.round(demandScore),
      fairnessScore: Math.round(fairnessScore),
      specializedScore: Math.round(specializedScore),
    },
    reasons,
  };
}

/**
 * Calculate distance score (0-20)
 */
function calculateDistanceScore(ngo: UserProfile, donationLat: number, donationLon: number): number {
  if (typeof ngo.latitude !== 'number' || typeof ngo.longitude !== 'number') {
    return 0;
  }

  const distanceKm = calculateHaversineDistance(
    { latitude: ngo.latitude, longitude: ngo.longitude },
    { latitude: donationLat, longitude: donationLon }
  );

  if (distanceKm > REDISTRIBUTION_CONFIG.MAX_DISTANCE_KM) {
    return 0;
  }

  // Preferred distance gets max score
  if (distanceKm <= REDISTRIBUTION_CONFIG.PREFERRED_DISTANCE_KM) {
    return 20;
  }

  // Score decreases with distance
  const extraDistance = distanceKm - REDISTRIBUTION_CONFIG.PREFERRED_DISTANCE_KM;
  const maxExtraDistance = REDISTRIBUTION_CONFIG.MAX_DISTANCE_KM - REDISTRIBUTION_CONFIG.PREFERRED_DISTANCE_KM;
  const score = 20 * (1 - extraDistance / maxExtraDistance);

  return Math.max(0, score);
}

/**
 * Calculate capacity score (0-25)
 */
function calculateCapacityScore(ngoId: string, capacityInfo?: Record<string, NGOCapacityInfo>): number {
  if (!capacityInfo || !capacityInfo[ngoId]) {
    return 15; // Unknown capacity - neutral score
  }

  const info = capacityInfo[ngoId];
  const utilizationRate = info.utilizationRate;

  // Prefer NGOs with more available capacity
  if (utilizationRate <= 0.3) {
    return 25; // Plenty of space
  } else if (utilizationRate <= 0.6) {
    return 20; // Good capacity available
  } else if (utilizationRate <= 0.8) {
    return 12; // Limited capacity
  } else if (utilizationRate <= 0.95) {
    return 5; // Almost full
  } else {
    return 0; // At or over capacity
  }
}

/**
 * Calculate demand score - higher for NGOs serving more people (0-25)
 */
function calculateDemandScore(ngo: UserProfile, capacityInfo?: Record<string, NGOCapacityInfo>): number {
  if (!capacityInfo || !capacityInfo[ngo.id]) {
    return 12; // Unknown demand - neutral score
  }

  const info = capacityInfo[ngo.id];
  const utilizationRate = info.utilizationRate;

  // Higher utilization = higher demand
  // But not if they're over capacity
  if (utilizationRate >= 0.95) {
    return 5; // Already over capacity
  }

  return Math.round(utilizationRate * 25);
}

/**
 * Calculate fairness score - give more to those served less recently (0-15)
 */
function calculateFairnessScore(ngo: UserProfile, capacityInfo?: Record<string, NGOCapacityInfo>): number {
  if (!capacityInfo || !capacityInfo[ngo.id]) {
    return 10; // Unknown last fed - neutral score
  }

  const info = capacityInfo[ngo.id];
  if (!info.lastFedAt) {
    return 15; // Never fed - highest priority
  }

  const hoursSinceLastFed = (Date.now() - info.lastFedAt) / (1000 * 60 * 60);
  // Normalize to 0-15 based on time
  return Math.min(15, Math.round((hoursSinceLastFed / 24) * 15));
}

/**
 * Calculate specialized score - match to NGO's specialty (0-15)
 */
function calculateSpecializedScore(ngo: UserProfile, donation: Donation): number {
  let score = 5;

  // Check if donation matches NGO's specialization
  // This is simplified - in real app, would check against NGO profile
  if (donation.category === 'medical' && ngo.bio?.toLowerCase().includes('medical')) {
    score += 10;
  }

  if (donation.category === 'children' && ngo.bio?.toLowerCase().includes('child')) {
    score += 10;
  }

  if (donation.category === 'elderly' && ngo.bio?.toLowerCase().includes('elder')) {
    score += 10;
  }

  return Math.min(15, score);
}

/**
 * Determine if donation should be split between multiple NGOs
 */
function shouldSplitDonation(
  donation: Donation,
  primaryRecipient: DonationRecipient,
  allRecipients: DonationRecipient[],
  capacityInfo?: Record<string, NGOCapacityInfo>
): boolean {
  if (allRecipients.length < 2) {
    return false;
  }

  const primaryCapacity = capacityInfo?.[primaryRecipient.ngoId];
  if (!primaryCapacity) {
    return false;
  }

  // Split if primary is nearly full and second recipient has space
  if (
    primaryCapacity.utilizationRate >= REDISTRIBUTION_CONFIG.EQUAL_SPLIT_THRESHOLD &&
    allRecipients[1]
  ) {
    const secondaryCapacity = capacityInfo?.[allRecipients[1].ngoId];
    if (secondaryCapacity && secondaryCapacity.utilizationRate < REDISTRIBUTION_CONFIG.EQUAL_SPLIT_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate number of people that can be served by a donation
 */
function calculatePeopleServed(donation: Donation): number {
  // Assume 1 meal per person (can be customized per org)
  return donation.quantity || 1;
}

/**
 * Calculate efficiency score for the distribution plan
 */
function calculateEfficiency(
  primaryRecipient: DonationRecipient,
  secondaryRecipient?: DonationRecipient
): number {
  // Score based on combined distance and utilization
  let efficiency = 0.5; // Base score

  // Penalize long distances
  efficiency -= Math.min(0.2, primaryRecipient.distance_km / 100);

  // Reward good matching scores
  efficiency += Math.min(0.3, primaryRecipient.score / 100);

  // Bonus for balanced distribution
  if (secondaryRecipient) {
    efficiency += 0.1; // Reward fairness
  }

  return Math.max(0, Math.min(1, efficiency));
}

/**
 * Generate human-readable distribution plan
 */
function generateDistributionPlan(
  primary: DonationRecipient,
  secondary: DonationRecipient | undefined,
  donation: Donation
): string {
  let plan = `Send ${donation.quantity} meals to ${primary.ngoName} (${primary.distance_km.toFixed(1)} km away)`;

  if (secondary) {
    plan += ` and some to ${secondary.ngoName}`;
  }

  plan += `. Estimated impact: serving vulnerable populations in the area.`;

  return plan;
}

/**
 * Log redistribution plan for auditing
 */
function logRedistributionPlan(plan: RedistributionPlan): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(REDISTRIBUTION_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push({
      ...plan,
      timestamp: Date.now(),
    });

    // Keep last 5000 distributions
    if (history.length > 5000) {
      history.shift();
    }

    localStorage.setItem(REDISTRIBUTION_HISTORY_KEY, JSON.stringify(history));

    writeAuditEvent({
      action: 'redistribution_planned',
      targetId: plan.donationId,
      details: {
        primaryNgo: plan.primaryRecipient.ngoId,
        score: plan.primaryRecipient.score,
        efficiency: plan.efficiency,
      },
    });
  } catch (error) {
    console.error('Error logging redistribution plan:', error);
  }
}

/**
 * Get redistribution history for analytics
 */
export function getRedistributionHistory(limit: number = 100): RedistributionPlan[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(REDISTRIBUTION_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    return history.slice(-limit);
  } catch (error) {
    console.error('Error retrieving redistribution history:', error);
    return [];
  }
}

/**
 * Calculate overall efficiency metrics
 */
export function getRedistributionMetrics(): {
  totalDistributions: number;
  averageEfficiency: number;
  totalMealsDistributed: number;
  averageDistance: number;
} {
  const history = getRedistributionHistory(1000);

  if (history.length === 0) {
    return {
      totalDistributions: 0,
      averageEfficiency: 0,
      totalMealsDistributed: 0,
      averageDistance: 0,
    };
  }

  const totalMeals = history.reduce((sum, plan) => sum + plan.totalServed, 0);
  const avgEfficiency = history.reduce((sum, plan) => sum + plan.efficiency, 0) / history.length;
  const avgDistance = history.reduce((sum, plan) => sum + plan.primaryRecipient.distance_km, 0) / history.length;

  return {
    totalDistributions: history.length,
    averageEfficiency: Math.round(avgEfficiency * 100) / 100,
    totalMealsDistributed: totalMeals,
    averageDistance: Math.round(avgDistance * 10) / 10,
  };
}
