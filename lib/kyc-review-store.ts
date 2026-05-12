export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface KycReviewRecord {
  userId: string;
  status: KycStatus;
  reviewerName: string;
  note?: string;
  reviewedAt: number;
}

export interface KycReviewHistoryEntry {
  status: KycStatus;
  reviewerName: string;
  note?: string;
  reviewedAt: number;
}

const STORAGE_KEY = 'foodbridge.kyc.reviews';
const HISTORY_STORAGE_KEY = 'foodbridge.kyc.review_history';
const CHANGE_EVENT = 'foodbridge_kyc_reviews_updated';

function readReviewMap(): Record<string, KycReviewRecord> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, KycReviewRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Error reading KYC review records:', error);
    return {};
  }
}

function writeReviewMap(map: Record<string, KycReviewRecord>) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Error writing KYC review records:', error);
  }
}

function readHistoryMap(): Record<string, KycReviewHistoryEntry[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, KycReviewHistoryEntry[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Error reading KYC review history:', error);
    return {};
  }
}

function writeHistoryMap(map: Record<string, KycReviewHistoryEntry[]>) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Error writing KYC review history:', error);
  }
}

export function getKycReview(userId: string): KycReviewRecord | null {
  return readReviewMap()[userId] ?? null;
}

export function getKycReviewHistory(userId: string): KycReviewHistoryEntry[] {
  return readHistoryMap()[userId] ?? [];
}

export function upsertKycReview(record: KycReviewRecord) {
  const reviews = readReviewMap();
  reviews[record.userId] = record;
  writeReviewMap(reviews);

  const history = readHistoryMap();
  history[record.userId] = [...(history[record.userId] ?? []), {
    status: record.status,
    reviewerName: record.reviewerName,
    note: record.note,
    reviewedAt: record.reviewedAt,
  }].sort((left, right) => left.reviewedAt - right.reviewedAt);
  writeHistoryMap(history);
}

export function subscribeToKycReviewChanges(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
