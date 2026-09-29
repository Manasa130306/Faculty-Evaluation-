import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth/admin-session';
import { google } from 'googleapis';

// Cache the drive status to avoid pinging Google Drive API on every dashboard load
let cachedStatus: any = null;
let lastCheckTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const adminSession = await verifyAdminSession(request);

    if (!adminSession.isValid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = Date.now();
    // Use cached status if available and fresh, EXCEPT if the client forces a refresh
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    if (!forceRefresh && cachedStatus && now - lastCheckTime < CACHE_DURATION_MS) {
      return NextResponse.json(cachedStatus);
    }

    const hasOAuthClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasEnvRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;

    let hasDbRefreshToken = false;
    let dbRefreshTokenValue = '';
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from('system_settings')
          .select('value, updated_at')
          .eq('key', 'google_drive_refresh_token')
          .maybeSingle();

        if (error) {
          console.warn('[Google Drive Status] Could not read system_settings:', error.message);
        } else if (data && data.value) {
          hasDbRefreshToken = true;
          dbRefreshTokenValue = data.value;
        }
      }
    } catch (err: any) {
      console.warn('[Google Drive Status] Exception reading system_settings:', err?.message);
    }

    let isConnected = false;
    let authMethod = 'None';
    let tokenSource = 'None';
    let debugError = null;

    if (hasOAuthClientId && (hasEnvRefreshToken || hasDbRefreshToken)) {
      const refreshToken = hasDbRefreshToken ? dbRefreshTokenValue : process.env.GOOGLE_REFRESH_TOKEN;
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        // Attempt to fetch about info to verify token
        await drive.about.get({ fields: 'user' });
        
        isConnected = true;
        authMethod = 'OAuth 2.0 (Admin Personal Account)';
        tokenSource = hasDbRefreshToken ? 'Database (OAuth Consent)' : 'Environment Variable';
      } catch (err: any) {
        console.error('[Google Drive Auth] Failed to authenticate with stored refresh token:', err.message);
        debugError = err.message;
      }
    }

    const responsePayload = {
      connected: isConnected,
      authMethod: authMethod,
      hasOAuthClientId,
      hasRefreshToken: hasEnvRefreshToken || hasDbRefreshToken,
      tokenSource: tokenSource,
      debugError: debugError
    };

    // Update cache
    cachedStatus = responsePayload;
    lastCheckTime = now;

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check Google Drive status' },
      { status: 500 }
    );
  }
}
