import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export async function GET(request: NextRequest) {
  try {
    const adminSession = await verifyAdminSession(request);

    if (!adminSession.isValid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hasOAuthClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasEnvRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;

    let hasDbRefreshToken = false;
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('system_settings')
        .select('updated_at')
        .eq('key', 'google_drive_refresh_token')
        .single();
      hasDbRefreshToken = !!data;
    } catch {
      // Table may not exist yet
    }

    const isOAuthConfigured = hasOAuthClientId && (hasEnvRefreshToken || hasDbRefreshToken);
    const isServiceAccountConfigured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );

    return NextResponse.json({
      connected: isOAuthConfigured || isServiceAccountConfigured,
      authMethod: isOAuthConfigured
        ? 'OAuth 2.0 (User Authorization)'
        : isServiceAccountConfigured
        ? 'Service Account'
        : 'None',
      hasOAuthClientId,
      hasRefreshToken: hasEnvRefreshToken || hasDbRefreshToken,
      tokenSource: hasEnvRefreshToken
        ? 'Environment Variable'
        : hasDbRefreshToken
        ? 'Database (OAuth Consent)'
        : 'None',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check Google Drive status' },
      { status: 500 }
    );
  }
}
