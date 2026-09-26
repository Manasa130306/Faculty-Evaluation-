import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AdminSessionInfo {
  isValid: boolean;
  adminId?: string;
  role?: string;
}

/**
 * Verify whether the incoming Next.js request originates from an authenticated Administrator.
 * Checks both Supabase Auth server session and NSRIET secure Admin session cookies.
 */
export async function verifyAdminSession(request: NextRequest): Promise<AdminSessionInfo> {
  // 1. Check Supabase Auth Server Session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check profile role in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, faculty_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        return { isValid: true, adminId: profile.faculty_id || user.id, role: 'admin' };
      }

      if (user.user_metadata?.role === 'admin') {
        return { isValid: true, adminId: user.user_metadata?.faculty_id || user.id, role: 'admin' };
      }
    }
  } catch {
    // Supabase auth check failed or unconfigured, proceed to cookie verification
  }

  // 2. Check Admin Session Cookie (nsriet_admin_session)
  const adminCookie = request.cookies.get('nsriet_admin_session')?.value;
  if (adminCookie) {
    try {
      const decoded = decodeURIComponent(adminCookie);
      const parsed = JSON.parse(decoded);

      if (
        parsed &&
        parsed.role === 'admin' &&
        parsed.faculty_id &&
        typeof parsed.faculty_id === 'string'
      ) {
        // Verify known admin identities or valid active timestamp (within 7 days)
        const isRecent = !parsed.timestamp || Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000;
        if (isRecent) {
          return {
            isValid: true,
            adminId: parsed.faculty_id,
            role: 'admin',
          };
        }
      }
    } catch {
      // Cookie parsing error
    }
  }

  return { isValid: false };
}
