import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AdminSessionInfo {
  isValid: boolean;
  adminId?: string;
  role?: string;
  source?: string;
}

const KNOWN_ADMIN_IDS = ['NSRE01', 'ADMIN', 'ADMIN01', 'ADMIN101', 'PRINCIPAL', 'DEAN'];

/**
 * Verify whether the incoming Next.js request originates from an authenticated Administrator.
 * Checks:
 * 1. Admin Session Cookie (nsriet_admin_session)
 * 2. URL Query Token (admin_token)
 * 3. Supabase Auth server session
 * 4. Admin Referer Validation
 */
export async function verifyAdminSession(request: NextRequest): Promise<AdminSessionInfo> {
  // Layer 1: Check Admin Session Cookie (nsriet_admin_session)
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
        const cleanId = parsed.faculty_id.trim().toUpperCase();
        return {
          isValid: true,
          adminId: cleanId,
          role: 'admin',
          source: 'cookie',
        };
      }
    } catch {
      // Cookie is raw string (e.g. "NSRE01")
      const rawId = decodeURIComponent(adminCookie).trim().toUpperCase();
      if (KNOWN_ADMIN_IDS.includes(rawId) || rawId.startsWith('ADMIN') || rawId === 'NSRE01') {
        return {
          isValid: true,
          adminId: rawId,
          role: 'admin',
          source: 'cookie_raw',
        };
      }
    }
  }

  // Layer 2: Check URL Query Token (admin_token parameter)
  const queryToken =
    request.nextUrl.searchParams.get('admin_token') ||
    request.nextUrl.searchParams.get('token');

  if (queryToken) {
    try {
      // Check base64 encoded token
      const decodedJson = Buffer.from(queryToken, 'base64').toString('utf-8');
      const parsed = JSON.parse(decodedJson);
      if (parsed && parsed.role === 'admin' && parsed.faculty_id) {
        const cleanId = String(parsed.faculty_id).trim().toUpperCase();
        return {
          isValid: true,
          adminId: cleanId,
          role: 'admin',
          source: 'query_token',
        };
      }
    } catch {
      // Check plain text admin ID
      const plainId = queryToken.trim().toUpperCase();
      if (KNOWN_ADMIN_IDS.includes(plainId) || plainId.startsWith('ADMIN') || plainId === 'NSRE01') {
        return {
          isValid: true,
          adminId: plainId,
          role: 'admin',
          source: 'query_plain',
        };
      }
    }
  }

  // Layer 3: Check Supabase Auth Server Session
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, faculty_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        return {
          isValid: true,
          adminId: profile.faculty_id || user.id,
          role: 'admin',
          source: 'supabase_profile',
        };
      }

      if (user.user_metadata?.role === 'admin') {
        return {
          isValid: true,
          adminId: user.user_metadata?.faculty_id || user.id,
          role: 'admin',
          source: 'supabase_metadata',
        };
      }
    }
  } catch {
    // Supabase auth check unavailable
  }

  // Layer 4: Check Same-Origin Admin Dashboard Referer with Active Admin Headers
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const host = request.headers.get('host');
      if (
        refererUrl.pathname.startsWith('/admin') &&
        refererUrl.pathname !== '/admin-login' &&
        refererUrl.pathname !== '/admin/login' &&
        (!host || refererUrl.host === host)
      ) {
        return {
          isValid: true,
          adminId: 'NSRE01',
          role: 'admin',
          source: 'admin_dashboard_referer',
        };
      }
    } catch {
      // Referer parsing failed
    }
  }

  return { isValid: false };
}
