import { CaseReport, Donation, Mission, UserProfile, UserRole } from '@/lib/types';

export type LocalAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

type SignupOptions = {
  data?: Record<string, unknown>;
  emailRedirectTo?: string;
};

type LocalSessionRecord = {
  userId: string;
  rememberMe: boolean;
  createdAt: string;
};

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT';

type StoredUser = UserProfile & {
  passwordHash: string;
  kyc?: Record<string, unknown>;
  onboardingCompleted?: boolean;
};

type LocalDatabaseState = {
  users: StoredUser[];
  donations: Donation[];
  case_reports: CaseReport[];
  missions: Mission[];
};

type SessionPayload = {
  user: LocalAuthUser;
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  expires_at: number;
  refresh_token: string;
};

type QueryFilter =
  | { kind: 'eq'; column: string; value: unknown }
  | { kind: 'is'; column: string; value: unknown };

type QueryOrder = {
  column: string;
  ascending: boolean;
};

type QueryResponse<T> = Promise<{ data: T | null; error: null | { message: string; code?: string } }>;

type InsertResponse<T> = Promise<{ data: T | null; error: null | { message: string; code?: string } }>;

type UpsertUserInput = {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  metadata?: Record<string, unknown>;
};

const DATABASE_KEY = 'foodbridge.local.database.v1';
const SESSION_KEY = 'foodbridge.local.session.v1';
const TEMP_SESSION_KEY = 'foodbridge.local.session.temp.v1';
const AUTH_CHANGE_EVENT = 'foodbridge.local.auth.changed';
const STORAGE_VERSION = 1;

const DEFAULT_PASSWORD = 'Password123!';
const DEFAULT_SECRET = 'foodbridge-local-secret';
const DEFAULT_EVIDENCE_IMAGE_DATA_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22480%22 viewBox=%220 0 640 480%22%3E%3Crect width=%22640%22 height=%22480%22 fill=%22%23e5f3ff%22/%3E%3Crect x=%2256%22 y=%2258%22 width=%22528%22 height=%22364%22 rx=%2220%22 fill=%22%23ffffff%22 stroke=%22%2393c5fd%22 stroke-width=%224%22/%3E%3Ccircle cx=%22208%22 cy=%22208%22 r=%2248%22 fill=%22%23bfdbfe%22/%3E%3Cpath d=%22M136 338l92-96 76 78 58-60 142 148H136z%22 fill=%22%2360a5fa%22/%3E%3Ctext x=%22320%22 y=%22126%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2230%22 fill=%22%231e3a8a%22%3EDonation Evidence%3C/text%3E%3C/svg%3E';
const DEFAULT_EVIDENCE_IMAGE_NAME = 'donation-evidence.svg';

let memoryState: LocalDatabaseState | null = null;
let memorySession: LocalSessionRecord | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'donor' || value === 'reporter' || value === 'ngo' || value === 'volunteer';
}

function getRoleFromMetadata(metadata?: Record<string, unknown>) {
  const role = metadata?.role;
  return isUserRole(role) ? role : 'donor';
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeImageName(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : DEFAULT_EVIDENCE_IMAGE_NAME;
}

function normalizeImageDataUrl(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : DEFAULT_EVIDENCE_IMAGE_DATA_URL;
}

async function hashSecret(value: string) {
  if (isBrowser() && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return `${DEFAULT_SECRET}:${value}`;
}

async function createSeedState(): Promise<LocalDatabaseState> {
  const passwordHash = await hashSecret(DEFAULT_PASSWORD);
  const base = new Date();
  const minusDays = (days: number) => new Date(base.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const users: StoredUser[] = [
    {
      id: 'demo-donor',
      email: 'donor@foodbridge.local',
      role: 'donor',
      full_name: 'Amina Okafor',
      bio: 'Community donor',
      organization: 'Sunrise Foods',
      phone: '+1 555 010 1001',
      created_at: minusDays(18),
      updated_at: minusDays(2),
      passwordHash,
      onboardingCompleted: true,
    },
    {
      id: 'demo-reporter',
      email: 'reporter@foodbridge.local',
      role: 'reporter',
      full_name: 'Kwame Mensah',
      bio: 'Field reporter',
      phone: '+1 555 010 1002',
      created_at: minusDays(16),
      updated_at: minusDays(1),
      passwordHash,
      onboardingCompleted: true,
    },
    {
      id: 'demo-ngo',
      email: 'ngo@foodbridge.local',
      role: 'ngo',
      full_name: 'Grace Foundation',
      bio: 'Operations coordinator',
      organization: 'Grace Foundation',
      phone: '+1 555 010 1003',
      created_at: minusDays(15),
      updated_at: minusDays(1),
      passwordHash,
      onboardingCompleted: true,
    },
    {
      id: 'demo-volunteer',
      email: 'volunteer@foodbridge.local',
      role: 'volunteer',
      full_name: 'Samuel Lee',
      bio: 'Volunteer driver',
      phone: '+1 555 010 1004',
      created_at: minusDays(14),
      updated_at: minusDays(1),
      passwordHash,
      onboardingCompleted: true,
    },
  ];

  const donations: Donation[] = [
    {
      id: 'donation_1',
      donor_id: 'demo-donor',
      description: 'Fresh vegetables and fruit crates',
      quantity: 18,
      category: 'produce',
      location: 'Central Market',
      created_at: minusDays(2),
      packaging_image_data_url: DEFAULT_EVIDENCE_IMAGE_DATA_URL,
      packaging_image_name: DEFAULT_EVIDENCE_IMAGE_NAME,
    },
    {
      id: 'donation_2',
      donor_id: 'demo-donor',
      description: 'Packaged meals for evening outreach',
      quantity: 24,
      category: 'prepared-meals',
      location: 'Riverside Kitchen',
      created_at: minusDays(1),
      packaging_image_data_url: DEFAULT_EVIDENCE_IMAGE_DATA_URL,
      packaging_image_name: DEFAULT_EVIDENCE_IMAGE_NAME,
    },
    {
      id: 'donation_3',
      donor_id: 'demo-donor',
      description: 'Bread and dry groceries',
      quantity: 12,
      category: 'dry-goods',
      location: 'Community Bakery',
      created_at: minusDays(0.5),
      packaging_image_data_url: DEFAULT_EVIDENCE_IMAGE_DATA_URL,
      packaging_image_name: DEFAULT_EVIDENCE_IMAGE_NAME,
    },
  ];

  const caseReports: CaseReport[] = [
    {
      id: 'case_1',
      reporter_id: 'demo-reporter',
      title: 'Shelter request near central station',
      description: 'Approx. 30 people need food support tonight.',
      location: 'Central Station underpass',
      latitude: 10.4884,
      longitude: 77.7459,
      status: 'unverified',
      urgency_score: 9.4,
      verified: false,
      created_at: minusDays(1.5),
      updated_at: minusDays(1.5),
    },
    {
      id: 'case_2',
      reporter_id: 'demo-reporter',
      title: 'Family outreach in east district',
      description: 'Families report limited access to evening meals.',
      location: 'East District Block C',
      latitude: 10.4996,
      longitude: 77.7625,
      status: 'verified',
      urgency_score: 7.2,
      verified: true,
      verified_by: 'demo-ngo',
      created_at: minusDays(3),
      updated_at: minusDays(1),
    },
  ];

  const missions: Mission[] = [
    {
      id: 'mission_1',
      case_report_id: 'case_1',
      title: 'Deliver packed meals to central station',
      description: 'Route assigned for tonight outreach window.',
      pickup_location: 'Riverside Kitchen',
      delivery_location: 'Central Station underpass',
      assigned_volunteer_id: 'demo-volunteer',
      status: 'in_progress',
      priority: 'urgent',
      created_at: minusDays(1),
      completed_at: undefined,
    },
    {
      id: 'mission_2',
      case_report_id: 'case_2',
      title: 'Support east district family outreach',
      description: 'Awaiting volunteer confirmation.',
      pickup_location: 'North Distribution Hub',
      delivery_location: 'East District Block C',
      assigned_volunteer_id: undefined,
      status: 'pending',
      priority: 'high',
      created_at: minusDays(0.75),
      completed_at: undefined,
    },
    {
      id: 'mission_3',
      case_report_id: undefined,
      title: 'Morning pickup for bread donation',
      description: 'Completed delivery to downtown shelter.',
      pickup_location: 'Community Bakery',
      delivery_location: 'Downtown Shelter',
      assigned_volunteer_id: 'demo-volunteer',
      status: 'completed',
      priority: 'normal',
      created_at: minusDays(4),
      completed_at: minusDays(3.5),
    },
  ];

  return {
    users,
    donations,
    case_reports: caseReports,
    missions,
  };
}

function readStorageValue<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageValue<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

async function getState() {
  if (memoryState) {
    return memoryState;
  }

  const stored = readStorageValue<{ version: number; state: LocalDatabaseState } | null>(DATABASE_KEY, null);
  if (stored?.version === STORAGE_VERSION) {
    memoryState = clone(stored.state);
    return memoryState;
  }

  memoryState = await createSeedState();
  writeStorageValue(DATABASE_KEY, { version: STORAGE_VERSION, state: memoryState });
  return memoryState;
}

async function setState(state: LocalDatabaseState) {
  memoryState = clone(state);
  writeStorageValue(DATABASE_KEY, { version: STORAGE_VERSION, state: memoryState });
}

async function getSessionRecord() {
  if (memorySession) {
    return memorySession;
  }

  const persistentSession = readStorageValue<LocalSessionRecord | null>(SESSION_KEY, null);
  if (persistentSession) {
    memorySession = persistentSession;
    return memorySession;
  }

  const temporarySession = readStorageValue<LocalSessionRecord | null>(TEMP_SESSION_KEY, null);
  if (temporarySession) {
    memorySession = temporarySession;
    return memorySession;
  }

  return null;
}

async function setSessionRecord(session: LocalSessionRecord | null) {
  memorySession = session ? { ...session } : null;

  if (!isBrowser()) {
    return;
  }

  if (session) {
    if (session.rememberMe) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window.sessionStorage.removeItem(TEMP_SESSION_KEY);
    } else {
      window.sessionStorage.setItem(TEMP_SESSION_KEY, JSON.stringify(session));
      window.localStorage.removeItem(SESSION_KEY);
    }
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(TEMP_SESSION_KEY);
  }

  // Notify listeners (e.g., hooks) that auth/session state changed.
  window.dispatchEvent(
    new CustomEvent(AUTH_CHANGE_EVENT, {
      detail: {
        event: (session ? 'SIGNED_IN' : 'SIGNED_OUT') as AuthChangeEvent,
      },
    }),
  );
}

function buildSessionUser(user: StoredUser): LocalAuthUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      role: user.role,
      full_name: user.full_name,
      kyc: user.kyc,
    },
    app_metadata: {
      role: user.role,
    },
  };
}

function buildSessionPayload(user: StoredUser): SessionPayload {
  const createdAt = now();
  return {
    user: buildSessionUser(user),
    access_token: `local_${user.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    refresh_token: `refresh_${user.id}_${createdAt}`,
  };
}

async function getUserByEmail(email: string) {
  const state = await getState();
  return state.users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
}

async function getUserById(id: string) {
  const state = await getState();
  return state.users.find((user) => user.id === id) ?? null;
}

async function upsertUser(input: UpsertUserInput) {
  const state = await getState();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashSecret(input.password);
  const existingIndex = state.users.findIndex((user) => normalizeEmail(user.email) === email);
  const timestamp = now();

  const nextUser: StoredUser = {
    id: existingIndex >= 0 ? state.users[existingIndex].id : createId('user'),
    email,
    role: input.role,
    full_name: input.fullName,
    organization: typeof input.metadata?.organization === 'string' ? input.metadata.organization : undefined,
    phone: typeof input.metadata?.phone === 'string' ? input.metadata.phone : undefined,
    bio: typeof input.metadata?.bio === 'string' ? input.metadata.bio : undefined,
    avatar_url: typeof input.metadata?.avatar_url === 'string' ? input.metadata.avatar_url : undefined,
    created_at: existingIndex >= 0 ? state.users[existingIndex].created_at : timestamp,
    updated_at: timestamp,
    passwordHash,
    kyc: typeof input.metadata?.kyc === 'object' && input.metadata.kyc ? (input.metadata.kyc as Record<string, unknown>) : undefined,
    onboardingCompleted: true,
  };

  if (existingIndex >= 0) {
    state.users[existingIndex] = nextUser;
  } else {
    state.users.unshift(nextUser);
  }

  await setState(state);
  return nextUser;
}

async function clearSession() {
  await setSessionRecord(null);
}

function matchesFilters<T extends Record<string, unknown>>(row: T, filters: QueryFilter[]) {
  return filters.every((filter) => {
    if (filter.kind === 'eq') {
      return row[filter.column] === filter.value;
    }

    return row[filter.column] == filter.value;
  });
}

function projectRow<T extends Record<string, unknown>>(row: T, columns: string[] | null) {
  if (!columns) {
    return clone(row);
  }

  const projected: Record<string, unknown> = {};
  columns.forEach((column) => {
    if (column in row) {
      projected[column] = row[column];
    }
  });

  return projected as T;
}

function sortRows<T extends Record<string, unknown>>(rows: T[], order: QueryOrder | null) {
  if (!order) {
    return rows;
  }

  const { column, ascending } = order;

  return [...rows].sort((left, right) => {
    const a = left[column];
    const b = right[column];

    if (typeof a === 'number' && typeof b === 'number') {
      return ascending ? a - b : b - a;
    }

    const aDate = typeof a === 'string' ? Date.parse(a) : Number.NaN;
    const bDate = typeof b === 'string' ? Date.parse(b) : Number.NaN;

    if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
      return ascending ? aDate - bDate : bDate - aDate;
    }

    const aText = String(a ?? '');
    const bText = String(b ?? '');
    return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
  });
}

function applyTableDefaults<T extends Record<string, unknown>>(table: string, row: T): T {
  const timestamp = now();

  if (table === 'donations') {
    return {
      ...row,
      id: typeof row.id === 'string' ? row.id : createId('donation'),
      created_at: typeof row.created_at === 'string' ? row.created_at : timestamp,
      quantity: typeof row.quantity === 'number' ? row.quantity : 1,
      packaging_image_data_url: normalizeImageDataUrl(row.packaging_image_data_url),
      packaging_image_name: normalizeImageName(row.packaging_image_name),
    };
  }

  if (table === 'case_reports') {
    return {
      ...row,
      id: typeof row.id === 'string' ? row.id : createId('case'),
      created_at: typeof row.created_at === 'string' ? row.created_at : timestamp,
      updated_at: typeof row.updated_at === 'string' ? row.updated_at : timestamp,
      status: typeof row.status === 'string' ? row.status : 'unverified',
      urgency_score: typeof row.urgency_score === 'number' ? row.urgency_score : 1,
      verified: typeof row.verified === 'boolean' ? row.verified : false,
    };
  }

  if (table === 'missions') {
    return {
      ...row,
      id: typeof row.id === 'string' ? row.id : createId('mission'),
      created_at: typeof row.created_at === 'string' ? row.created_at : timestamp,
      status: typeof row.status === 'string' ? row.status : 'pending',
      priority: typeof row.priority === 'string' ? row.priority : 'normal',
    };
  }

  if (table === 'users') {
    return {
      ...row,
      id: typeof row.id === 'string' ? row.id : createId('user'),
      created_at: typeof row.created_at === 'string' ? row.created_at : timestamp,
      updated_at: typeof row.updated_at === 'string' ? row.updated_at : timestamp,
      role: isUserRole(row.role) ? row.role : 'donor',
    };
  }

  return row;
}

class LocalQueryBuilder {
  private columns: string[] | null = null;

  private filters: QueryFilter[] = [];

  private orderBy: QueryOrder | null = null;

  private limitCount: number | null = null;

  private updateValues: Record<string, unknown> | null = null;

  constructor(private readonly table: keyof LocalDatabaseState) {}

  select(columns = '*') {
    this.columns = columns === '*' ? null : columns.split(',').map((column) => column.trim()).filter(Boolean);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: 'eq', column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ kind: 'is', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private async getRows() {
    const state = await getState();
    const rows = state[this.table] as unknown as Record<string, unknown>[];
    const filtered = rows.filter((row) => matchesFilters(row, this.filters));
    const ordered = sortRows(filtered, this.orderBy);
    const sliced = typeof this.limitCount === 'number' ? ordered.slice(0, this.limitCount) : ordered;
    return sliced.map((row) => projectRow(row, this.columns));
  }

  private async execute() {
    const rows = await this.getRows();
    return {
      data: rows,
      error: null,
    };
  }

  async maybeSingle(): QueryResponse<Record<string, unknown> | null> {
    const { data } = await this.execute();
    return { data: (data[0] ?? null) as Record<string, unknown> | null, error: null };
  }

  async insert(values: Record<string, unknown> | Record<string, unknown>[]): InsertResponse<Record<string, unknown> | Record<string, unknown>[]> {
    const state = await getState();
    const incoming = Array.isArray(values) ? values : [values];
    const inserted = incoming.map((row) => applyTableDefaults(this.table, clone(row)));
    const target = state[this.table] as unknown as Record<string, unknown>[];
    target.unshift(...inserted);
    await setState(state);
    return { data: Array.isArray(values) ? inserted : inserted[0] ?? null, error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    if (this.updateValues) {
      const values = this.updateValues;
      this.updateValues = null;
      return (this.executeUpdate(values) as unknown as Promise<unknown>).then(onfulfilled, onrejected);
    }
    return (this.execute() as unknown as Promise<unknown>).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ) {
    if (this.updateValues) {
      const values = this.updateValues;
      this.updateValues = null;
      return this.executeUpdate(values).catch(onrejected);
    }
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    if (this.updateValues) {
      const values = this.updateValues;
      this.updateValues = null;
      return this.executeUpdate(values).finally(onfinally);
    }
    return this.execute().finally(onfinally);
  }

  update(values: Record<string, unknown>) {
    this.updateValues = values;
    return this;
  }

  private async executeUpdate(values: Record<string, unknown>) {
    const state = await getState();
    const target = state[this.table] as unknown as Record<string, unknown>[];
    const updatedRows: Record<string, unknown>[] = [];

    target.forEach((row, index) => {
      if (!matchesFilters(row, this.filters)) {
        return;
      }

      const merged = applyTableDefaults(this.table, {
        ...row,
        ...clone(values),
      });

      target[index] = merged;
      updatedRows.push(clone(merged));
    });

    await setState(state);
    return { data: updatedRows.length > 1 ? updatedRows : updatedRows[0] ?? null, error: null };
  }
}

function buildAuthError(message: string, code = 'LOCAL_AUTH_ERROR') {
  return { message, code };
}

async function signInWithPassword(input: { email: string; password: string; rememberMe?: boolean }) {
  const user = await getUserByEmail(input.email);
  if (!user) {
    return { data: { user: null, session: null }, error: buildAuthError('Invalid email or password') };
  }

  const passwordHash = await hashSecret(input.password);
  if (passwordHash !== user.passwordHash) {
    return { data: { user: null, session: null }, error: buildAuthError('Invalid email or password') };
  }

  const session = buildSessionPayload(user);
  await setSessionRecord({ userId: user.id, rememberMe: input.rememberMe ?? true, createdAt: now() });
  return { data: { user: buildSessionUser(user), session }, error: null };
}

async function signUp(input: { email: string; password: string; options?: SignupOptions; rememberMe?: boolean }) {
  const role = getRoleFromMetadata(input.options?.data);
  const fullName = typeof input.options?.data?.full_name === 'string' && input.options.data.full_name.trim()
    ? input.options.data.full_name.trim()
    : input.email.split('@')[0];

  const existing = await getUserByEmail(input.email);
  if (existing) {
    return { data: { user: null, session: null }, error: buildAuthError('An account with this email already exists') };
  }

  const user = await upsertUser({
    email: input.email,
    password: input.password,
    role,
    fullName,
    metadata: input.options?.data,
  });

  const session = buildSessionPayload(user);
  await setSessionRecord({ userId: user.id, rememberMe: input.rememberMe ?? true, createdAt: now() });
  return { data: { user: buildSessionUser(user), session }, error: null };
}

async function getSession() {
  const sessionRecord = await getSessionRecord();
  if (!sessionRecord) {
    return { data: { session: null }, error: null };
  }

  const user = await getUserById(sessionRecord.userId);
  if (!user) {
    await clearSession();
    return { data: { session: null }, error: null };
  }

  return { data: { session: buildSessionPayload(user) }, error: null };
}

async function signOut() {
  await clearSession();
  return { error: null };
}

type AuthStateChangeCallback = (event: AuthChangeEvent, session: SessionPayload | null) => void;

async function getCurrentUserProfile() {
  const { data } = await getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser) {
    return null;
  }

  const user = await getUserById(sessionUser.id);
  if (!user) {
    return null;
  }

  return clone(user);
}

async function getCurrentUserRole() {
  const profile = await getCurrentUserProfile();
  return profile?.role ?? null;
}

async function getCurrentSessionUser() {
  const { data } = await getSession();
  return data.session?.user ?? null;
}

export async function getUserProfileById(id: string) {
  const user = await getUserById(id);
  return user ? clone(user) : null;
}

export async function getUserRoleById(id: string) {
  const user = await getUserById(id);
  return user?.role ?? null;
}

export async function getDashboardSnapshot(role?: UserRole) {
  const state = await getState();
  const profile = await getCurrentUserProfile();
  return {
    user: profile,
    role: role ?? profile?.role ?? null,
    donations: clone(state.donations),
    caseReports: clone(state.case_reports),
    missions: clone(state.missions),
  };
}

export function createLocalClient() {
  const noopRealtimeChannel = {
    on() {
      return noopRealtimeChannel;
    },
    subscribe() {
      return noopRealtimeChannel;
    },
    unsubscribe() {
      return noopRealtimeChannel;
    },
  };

  return {
    auth: {
      signInWithPassword,
      signUp,
      getSession,
      signOut,
      onAuthStateChange(callback: AuthStateChangeCallback) {
        const handler = async (event: Event) => {
          const nextEvent =
            event instanceof CustomEvent && typeof (event as CustomEvent).detail?.event === 'string'
              ? ((event as CustomEvent).detail.event as AuthChangeEvent)
              : 'SIGNED_OUT';

          const { data } = await getSession();
          callback(nextEvent, (data.session as SessionPayload | null) ?? null);
        };

        if (typeof window !== 'undefined') {
          window.addEventListener(AUTH_CHANGE_EVENT, handler as EventListener);
        }

        return {
          data: {
            subscription: {
              unsubscribe() {
                if (typeof window !== 'undefined') {
                  window.removeEventListener(AUTH_CHANGE_EVENT, handler as EventListener);
                }
              },
            },
          },
        };
      },
    },
    channel() {
      return noopRealtimeChannel;
    },
    removeChannel() {
      return noopRealtimeChannel;
    },
    from(table: string) {
      if (table !== 'users' && table !== 'donations' && table !== 'case_reports' && table !== 'missions') {
        throw new Error(`Unsupported local table: ${table}`);
      }

      return new LocalQueryBuilder(table as keyof LocalDatabaseState);
    },
  };
}

export function hasLocalDatabaseConfig() {
  return true;
}

export { getCurrentSessionUser, getCurrentUserProfile, getCurrentUserRole, signInWithPassword as localSignInWithPassword, signOut as localSignOut, signUp as localSignUp };
