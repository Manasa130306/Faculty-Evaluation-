import { createClient } from '@supabase/supabase-js';

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY
 * to bypass Row Level Security exclusively for authorized server-side backend operations
 * (e.g. storing and retrieving OAuth refresh tokens in system_settings).
 *
 * CRITICAL SECURITY:
 * - This function must ONLY be executed in server-side environments (API routes / Server Actions).
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY or this client to the browser/client components.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL environment variable.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      '[Supabase Admin] Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Server-side administrative operations require the Service Role key to bypass RLS.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
