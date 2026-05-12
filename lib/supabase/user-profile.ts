import { UserProfile, UserRole } from '@/lib/types';

type SessionUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

function isUserRole(value: unknown): value is UserRole {
  return value === 'donor' || value === 'reporter' || value === 'ngo' || value === 'volunteer' || value === 'admin';
}

function roleFromMetadata(user: SessionUser): UserRole | null {
  const roleCandidate = user.user_metadata?.role ?? user.app_metadata?.role;
  return isUserRole(roleCandidate) ? roleCandidate : null;
}

export function isUsersTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';

  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes("Could not find the table 'public.users'") ||
    message.includes('relation "public.users" does not exist')
  );
}

export function buildFallbackUserProfile(user: SessionUser): UserProfile {
  const fallbackRole = roleFromMetadata(user) ?? 'donor';
  const metadataName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined;

  return {
    id: user.id,
    email: user.email ?? '',
    role: fallbackRole,
    full_name: metadataName,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function toUserProfile(data: Record<string, unknown>, fallback: UserProfile): UserProfile {
  const id = typeof data.id === 'string' ? data.id : fallback.id;
  const email = typeof data.email === 'string' ? data.email : fallback.email;
  const role = isUserRole(data.role) ? data.role : fallback.role;
  const fullName = typeof data.full_name === 'string' ? data.full_name : fallback.full_name;
  const createdAt = typeof data.created_at === 'string' ? data.created_at : fallback.created_at;
  const updatedAt = typeof data.updated_at === 'string' ? data.updated_at : fallback.updated_at;

  return {
    id,
    email,
    role,
    full_name: fullName,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserRoleOrFallback<T extends { from: (table: string) => any }>(
  supabase: T,
  user: SessionUser
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    if (isUsersTableMissingError(error)) {
      return roleFromMetadata(user);
    }

    throw error;
  }

  return (data?.role as UserRole | undefined) ?? roleFromMetadata(user);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserProfileOrFallback<T extends { from: (table: string) => any }>(
  supabase: T,
  user: SessionUser
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    if (isUsersTableMissingError(error)) {
      return buildFallbackUserProfile(user);
    }

    throw error;
  }

  if (!data) {
    return buildFallbackUserProfile(user);
  }

  const fallbackProfile = buildFallbackUserProfile(user);
  return toUserProfile(data, fallbackProfile);
}
