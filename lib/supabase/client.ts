import { createLocalClient, hasLocalDatabaseConfig } from '@/lib/local-db';

export function hasSupabaseConfig() {
  return hasLocalDatabaseConfig();
}

export function createClient() {
  return createLocalClient();
}
