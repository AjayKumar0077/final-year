import { AssistanceCategory } from '@/lib/text-classifier';
import { Mission } from '@/lib/types';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface UrgencyInput {
  title: string;
  description?: string;
  reporterNote?: string;
  peopleCount?: number;
  category?: AssistanceCategory;
}

export interface UrgencyResult {
  score: number;
  level: UrgencyLevel;
  reasons: string[];
}

const HIGH_PRIORITY_KEYWORDS = ['injured', 'bleeding', 'critical', 'unconscious', 'severe', 'emergency'];
const MEDIUM_HIGH_KEYWORDS = ['elderly', 'child', 'children', 'pregnant', 'disabled', 'newborn'];
const MEDIUM_KEYWORDS = ['hungry', 'cold', 'rain', 'night', 'homeless', 'food'];

function countMatches(text: string, keywords: string[]): number {
  const normalized = text.toLowerCase();
  return keywords.reduce((count, keyword) => count + (normalized.includes(keyword) ? 1 : 0), 0);
}

export function getUrgencyLevelFromScore(score: number): UrgencyLevel {
  if (score >= 9) return 'urgent';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

export function mapUrgencyLevelToMissionPriority(level: UrgencyLevel): Mission['priority'] {
  if (level === 'urgent') return 'urgent';
  if (level === 'high') return 'high';
  if (level === 'medium') return 'normal';
  return 'low';
}

/**
 * Rule-based urgency estimator aligned with project methodology.
 * Returns a normalized score in the [1, 10] range.
 */
export function detectUrgency(input: UrgencyInput): UrgencyResult {
  const text = `${input.title} ${input.description || ''} ${input.reporterNote || ''}`.trim();

  let score = 2;
  const reasons: string[] = [];

  const highMatches = countMatches(text, HIGH_PRIORITY_KEYWORDS);
  if (highMatches > 0) {
    score += highMatches * 2.2;
    reasons.push('Critical medical keywords detected');
  }

  const mediumHighMatches = countMatches(text, MEDIUM_HIGH_KEYWORDS);
  if (mediumHighMatches > 0) {
    score += mediumHighMatches * 1.4;
    reasons.push('Vulnerable population keywords detected');
  }

  const mediumMatches = countMatches(text, MEDIUM_KEYWORDS);
  if (mediumMatches > 0) {
    score += mediumMatches * 0.8;
    reasons.push('General hardship keywords detected');
  }

  const peopleCount = input.peopleCount || 1;
  if (peopleCount >= 50) {
    score += 2.2;
    reasons.push('Large affected population');
  } else if (peopleCount >= 20) {
    score += 1.3;
    reasons.push('Moderate affected population');
  } else if (peopleCount >= 8) {
    score += 0.6;
  }

  if (input.category === 'medical') {
    score += 1.1;
    reasons.push('Medical assistance category predicted');
  } else if (input.category === 'shelter') {
    score += 0.5;
  }

  const boundedScore = Number(Math.max(1, Math.min(10, score)).toFixed(1));
  const level = getUrgencyLevelFromScore(boundedScore);

  return {
    score: boundedScore,
    level,
    reasons,
  };
}
