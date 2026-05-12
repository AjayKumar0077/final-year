import { createLocalClient } from '@/lib/local-db';

export async function createClient() {
  return createLocalClient();
}
