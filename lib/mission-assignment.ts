/**
 * Mission Order Assignment System
 * Intelligently assigns missions to volunteers based on multiple criteria
 */

import type { Mission, UserProfile } from '@/lib/types';
import { calculateHaversineDistance } from '@/lib/geo-distance';
import { getVolunteerCurrentLocation, getVolunteerMovementStatus } from '@/lib/volunteer-tracking';
import { writeAuditEvent } from '@/lib/audit-log';

export interface MissionAssignmentScore {
  volunteerId: string;
  volunteerName: string;
  score: number;
  factors: {
    distanceScore: number;
    availabilityScore: number;
    performanceScore: number;
    priorityMatchScore: number;
    urgencyScore: number;
  };
  reasons: string[];
}

export interface MissionAssignmentResult {
  missionId: string;
  assignedVolunteer: UserProfile;
  score: MissionAssignmentScore;
  estimatedArrivalMinutes: number;
  assignedAt: number;
}

export interface AssignmentMetrics {
  volunteerId: string;
  totalAssignments: number;
  completedAssignments: number;
  acceptanceRate: number;
  averageCompletionTimeMinutes: number;
  averageRating: number;
  successRate: number;
}

// Assignment configuration
const ASSIGNMENT_CONFIG = {
  MAX_DISTANCE_KM: 50,
  PREFERRED_DISTANCE_KM: 5,
  MIN_VOLUNTEERS_TO_CONSIDER: 3,
  DISTANCE_WEIGHT: 0.25,
  AVAILABILITY_WEIGHT: 0.20,
  PERFORMANCE_WEIGHT: 0.25,
  PRIORITY_WEIGHT: 0.15,
  URGENCY_WEIGHT: 0.15,
  AVERAGE_SPEED_KMH: 20,
  ACTIVE_MISSION_LIMIT: 5,
};

const ASSIGNMENT_METRICS_KEY = 'mission_assignment_metrics';
const MISSION_ASSIGNMENT_HISTORY_KEY = 'mission_assignment_history';

/**
 * Find best volunteer for a mission using multi-factor scoring
 */
export async function findBestVolunteerForMission(
  mission: Mission,
  availableVolunteers: UserProfile[]
): Promise<MissionAssignmentResult | null> {
  if (!mission || availableVolunteers.length === 0) {
    return null;
  }

  // Get mission location
  const missionLat = mission.pickup_latitude ?? mission.location_latitude;
  const missionLon = mission.pickup_longitude ?? mission.location_longitude;

  if (typeof missionLat !== 'number' || typeof missionLon !== 'number') {
    console.warn('Mission has no valid location');
    return null;
  }

  // Score all volunteers
  const scores = availableVolunteers.map(volunteer => {
    return scoreVolunteerForMission(volunteer, mission, missionLat, missionLon);
  });

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  // Get top scorer
  const topScore = scores[0];
  if (!topScore || topScore.score < 40) {
    console.warn('No suitable volunteer found for mission', { topScore });
    return null;
  }

  // Find the volunteer profile for the top scorer
  const assignedVolunteer = availableVolunteers.find(v => v.id === topScore.volunteerId);
  if (!assignedVolunteer) {
    return null;
  }

  // Calculate ETA
  const volunteerLat = assignedVolunteer.latitude;
  const volunteerLon = assignedVolunteer.longitude;
  let estimatedArrivalMinutes = 0;

  if (typeof volunteerLat === 'number' && typeof volunteerLon === 'number') {
    const distanceKm = calculateHaversineDistance(
      { latitude: volunteerLat, longitude: volunteerLon },
      { latitude: missionLat, longitude: missionLon }
    );
    estimatedArrivalMinutes = Math.ceil((distanceKm / ASSIGNMENT_CONFIG.AVERAGE_SPEED_KMH) * 60);
  }

  const result: MissionAssignmentResult = {
    missionId: mission.id,
    assignedVolunteer,
    score: topScore,
    estimatedArrivalMinutes,
    assignedAt: Date.now(),
  };

  // Log assignment
  logAssignment(result);
  writeAuditEvent({
    action: 'mission_assigned',
    targetId: mission.id,
    details: {
      volunteerId: assignedVolunteer.id,
      score: topScore.score,
      eta: estimatedArrivalMinutes,
    },
  });

  return result;
}

/**
 * Score a volunteer for a specific mission
 */
function scoreVolunteerForMission(
  volunteer: UserProfile,
  mission: Mission,
  missionLat: number,
  missionLon: number
): MissionAssignmentScore {
  const reasons: string[] = [];

  // 1. Distance Score (0-25 points)
  const distanceScore = calculateDistanceScore(volunteer, missionLat, missionLon);
  if (distanceScore < 10) {
    reasons.push('Too far from mission location');
  }

  // 2. Availability Score (0-20 points)
  const availabilityScore = calculateAvailabilityScore(volunteer);

  // 3. Performance Score (0-25 points)
  const performanceScore = calculatePerformanceScore(volunteer.id);

  // 4. Priority Match Score (0-15 points)
  const priorityMatchScore = calculatePriorityMatchScore(volunteer, mission);

  // 5. Urgency Score (0-15 points)
  const urgencyScore = calculateUrgencyScore(mission);

  // Calculate weighted total
  const totalScore =
    distanceScore * ASSIGNMENT_CONFIG.DISTANCE_WEIGHT +
    availabilityScore * ASSIGNMENT_CONFIG.AVAILABILITY_WEIGHT +
    performanceScore * ASSIGNMENT_CONFIG.PERFORMANCE_WEIGHT +
    priorityMatchScore * ASSIGNMENT_CONFIG.PRIORITY_WEIGHT +
    urgencyScore * ASSIGNMENT_CONFIG.URGENCY_WEIGHT;

  return {
    volunteerId: volunteer.id,
    volunteerName: volunteer.full_name || 'Unknown',
    score: Math.round(totalScore),
    factors: {
      distanceScore: Math.round(distanceScore),
      availabilityScore: Math.round(availabilityScore),
      performanceScore: Math.round(performanceScore),
      priorityMatchScore: Math.round(priorityMatchScore),
      urgencyScore: Math.round(urgencyScore),
    },
    reasons,
  };
}

/**
 * Calculate distance score (0-25)
 */
function calculateDistanceScore(
  volunteer: UserProfile,
  missionLat: number,
  missionLon: number
): number {
  if (typeof volunteer.latitude !== 'number' || typeof volunteer.longitude !== 'number') {
    return 0; // No location data
  }

  const distanceKm = calculateHaversineDistance(
    { latitude: volunteer.latitude, longitude: volunteer.longitude },
    { latitude: missionLat, longitude: missionLon }
  );

  if (distanceKm > ASSIGNMENT_CONFIG.MAX_DISTANCE_KM) {
    return 0;
  }

  // Preferred distance gets max score
  if (distanceKm <= ASSIGNMENT_CONFIG.PREFERRED_DISTANCE_KM) {
    return 25;
  }

  // Score decreases with distance
  const extraDistance = distanceKm - ASSIGNMENT_CONFIG.PREFERRED_DISTANCE_KM;
  const maxExtraDistance = ASSIGNMENT_CONFIG.MAX_DISTANCE_KM - ASSIGNMENT_CONFIG.PREFERRED_DISTANCE_KM;
  const score = 25 * (1 - extraDistance / maxExtraDistance);

  return Math.max(0, score);
}

/**
 * Calculate availability score (0-20)
 */
function calculateAvailabilityScore(volunteer: UserProfile): number {
  let score = 20;

  // Check current activity
  const currentLocation = getVolunteerCurrentLocation(volunteer.id);
  if (!currentLocation) {
    return 15; // Offline, but still somewhat available
  }

  const status = getVolunteerMovementStatus(volunteer.id);
  if (status === 'in_transit') {
    score -= 5; // Already moving somewhere
  } else if (status === 'moving_slowly') {
    score -= 2; // Might be busy
  }

  // Could add logic to check active missions count here
  // For now, assume data is available via external call

  return Math.max(0, score);
}

/**
 * Calculate performance score based on historical metrics (0-25)
 */
function calculatePerformanceScore(volunteerId: string): number {
  const metrics = getAssignmentMetrics(volunteerId);
  if (!metrics) {
    return 15; // New volunteer - neutral score
  }

  let score = 15;

  // Boost for high acceptance rate
  if (metrics.acceptanceRate >= 0.9) {
    score += 5;
  } else if (metrics.acceptanceRate < 0.7) {
    score -= 3;
  }

  // Boost for high success rate
  if (metrics.successRate >= 0.95) {
    score += 5;
  } else if (metrics.successRate < 0.8) {
    score -= 3;
  }

  // Boost for high rating
  if (metrics.averageRating >= 4.5) {
    score += 5;
  } else if (metrics.averageRating < 3) {
    score -= 5;
  }

  return Math.min(25, Math.max(0, score));
}

/**
 * Calculate priority match score (0-15)
 */
function calculatePriorityMatchScore(volunteer: UserProfile, mission: Mission): number {
  let score = 10;

  // Check if mission priority aligns with volunteer capabilities
  if (mission.priority === 'urgent' && mission.category === 'medical') {
    // Might want to check if volunteer is trained in medical assistance
    score += 3;
  }

  if (mission.priority === 'normal') {
    score += 2;
  }

  return Math.min(15, score);
}

/**
 * Calculate urgency score - higher for urgent missions (0-15)
 */
function calculateUrgencyScore(mission: Mission): number {
  let score = 5;

  if (mission.priority === 'urgent') {
    score = 15;
  } else if (mission.priority === 'high') {
    score = 10;
  } else if (mission.priority === 'normal') {
    score = 5;
  }

  return score;
}

/**
 * Batch assign missions to multiple volunteers
 */
export async function batchAssignMissions(
  missions: Mission[],
  availableVolunteers: UserProfile[]
): Promise<MissionAssignmentResult[]> {
  const assignments: MissionAssignmentResult[] = [];
  const assignedVolunteerIds = new Set<string>();

  for (const mission of missions) {
    // Filter out already-assigned volunteers for this batch
    const remainingVolunteers = availableVolunteers.filter(v => !assignedVolunteerIds.has(v.id));

    if (remainingVolunteers.length === 0) {
      console.warn('No more volunteers available for remaining missions');
      break;
    }

    const assignment = await findBestVolunteerForMission(mission, remainingVolunteers);
    if (assignment) {
      assignments.push(assignment);
      assignedVolunteerIds.add(assignment.assignedVolunteer.id);
    }
  }

  return assignments;
}

/**
 * Get or initialize assignment metrics for a volunteer
 */
function getAssignmentMetrics(volunteerId: string): AssignmentMetrics | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(ASSIGNMENT_METRICS_KEY);
    const metrics = raw ? JSON.parse(raw) : {};
    return metrics[volunteerId] ?? null;
  } catch (error) {
    console.error('Error reading assignment metrics:', error);
    return null;
  }
}

/**
 * Update assignment metrics after mission completion
 */
export function updateAssignmentMetrics(
  volunteerId: string,
  accepted: boolean,
  completedSuccessfully: boolean,
  completionTimeMinutes: number,
  rating: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(ASSIGNMENT_METRICS_KEY);
    const allMetrics = raw ? JSON.parse(raw) : {};

    const current = allMetrics[volunteerId] || {
      volunteerId,
      totalAssignments: 0,
      completedAssignments: 0,
      acceptanceRate: 0,
      averageCompletionTimeMinutes: 0,
      averageRating: 0,
      successRate: 0,
    };

    current.totalAssignments++;

    if (accepted) {
      current.completedAssignments++;
      current.averageCompletionTimeMinutes =
        (current.averageCompletionTimeMinutes * (current.completedAssignments - 1) + completionTimeMinutes) /
        current.completedAssignments;

      if (completedSuccessfully) {
        current.successRate = (current.successRate * (current.completedAssignments - 1) + 1) / current.completedAssignments;
        current.averageRating = (current.averageRating * (current.completedAssignments - 1) + rating) / current.completedAssignments;
      } else {
        current.successRate = (current.successRate * (current.completedAssignments - 1) + 0) / current.completedAssignments;
      }
    }

    current.acceptanceRate = current.completedAssignments / current.totalAssignments;

    allMetrics[volunteerId] = current;
    localStorage.setItem(ASSIGNMENT_METRICS_KEY, JSON.stringify(allMetrics));

    writeAuditEvent({
      action: 'assignment_metrics_updated',
      targetId: volunteerId,
      details: current,
    });
  } catch (error) {
    console.error('Error updating assignment metrics:', error);
  }
}

/**
 * Log mission assignment for auditing
 */
function logAssignment(assignment: MissionAssignmentResult): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(MISSION_ASSIGNMENT_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push({
      ...assignment,
      timestamp: Date.now(),
    });

    // Keep last 1000 assignments
    if (history.length > 1000) {
      history.shift();
    }

    localStorage.setItem(MISSION_ASSIGNMENT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error logging assignment:', error);
  }
}
