import type { UserRole } from '@/lib/types';

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  page: string;
  entityType: 'donation' | 'case_report' | 'mission' | 'user' | 'system';
  entityId: string;
  status: 'success' | 'error';
  detail?: string;
  durationMs?: number;
  timestamp: number;
}

const STORAGE_KEY = 'foodbridge.audit.events';
const CHANGE_EVENT = 'foodbridge_audit_events_updated';

function readRawEvents(): AuditEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading audit events:', error);
    return [];
  }
}

function writeRawEvents(events: AuditEvent[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Error writing audit events:', error);
  }
}

export function readAuditEvents(limit = 500): AuditEvent[] {
  return readRawEvents()
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, limit);
}

export function writeAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  const record: AuditEvent = {
    ...event,
    id: `evt-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`,
    timestamp: Date.now(),
  };

  const current = readRawEvents();
  const next = [record, ...current].slice(0, 2000);
  writeRawEvents(next);
}

export function subscribeToAuditEvents(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

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
