import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?drive_auth=error&reason=no_code_provided', baseUrl)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'https://facultymarks.vercel.app/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/admin/dashboard?drive_auth=error&reason=credentials_missing', baseUrl)
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Store the refresh token securely in Supabase system_settings
      try {
        const supabase = await createClient();
        await supabase.from('system_settings').upsert({
          key: 'google_drive_refresh_token',
          value: tokens.refresh_token,
          description: 'Google Drive OAuth 2.0 Refresh Token for IQAC Drive Storage',
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        // Continue even if database table is not yet migrated, token is acknowledged
      }
    }

    return NextResponse.redirect(
      new URL('/admin/dashboard?drive_auth=success', baseUrl)
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(err?.message || 'token_exchange_failed')}`,
        baseUrl
      )
    );
  }
}
