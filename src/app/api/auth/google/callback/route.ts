import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = new URL(request.url).origin;

  if (error) {
    console.error('[Google Drive Auth] OAuth callback returned error:', error);
    return NextResponse.redirect(
      new URL(`/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?drive_auth=error&reason=no_code_provided', baseUrl)
    );
  }

  // Verify OAuth CSRF state if present
  const storedState = request.cookies.get('oauth_state')?.value;
  if (state && storedState && state !== storedState) {
    console.warn('[Google Drive Auth] CSRF state mismatch detected in callback');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    baseUrl.includes('localhost')
      ? `${baseUrl}/api/auth/google/callback`
      : (process.env.GOOGLE_REDIRECT_URI || 'https://nsriet.vercel.app/api/auth/google/callback');

  if (!clientId || !clientSecret) {
    const missing = [
      !clientId ? 'GOOGLE_CLIENT_ID' : null,
      !clientSecret ? 'GOOGLE_CLIENT_SECRET' : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.error(`[Google Drive Auth] Missing required server environment variable(s): ${missing}`);
    return NextResponse.redirect(
      new URL(
        `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
          `credentials_missing: ${missing}`
        )}`,
        baseUrl
      )
    );
  }

  let tokenData: { access_token?: string; refresh_token?: string; error?: string; error_description?: string } = {};

  // Step 1: Exchange authorization code with https://oauth2.googleapis.com/token
  try {
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });

    tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok || tokenData.error) {
      const errorMsg = tokenData.error_description || tokenData.error || `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`;
      console.error(`[Google Drive Auth] Token exchange failed. Step: token_exchange, Status: ${tokenResponse.status}, Error: ${errorMsg}`);
      return NextResponse.redirect(
        new URL(
          `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
            `token_exchange_failed (${tokenResponse.status}): ${errorMsg}`
          )}`,
          baseUrl
        )
      );
    }
  } catch (fetchErr: any) {
    const safeError = fetchErr?.message || 'Network request to oauth2.googleapis.com failed';
    console.error('[Google Drive Auth] Exception during token exchange fetch:', safeError);
    return NextResponse.redirect(
      new URL(
        `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
          `token_exchange_network_error: ${safeError}`
        )}`,
        baseUrl
      )
    );
  }

  // Step 2: Persist refresh token in Supabase system_settings using Service Role Client
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Google Drive Auth] Missing SUPABASE_SERVICE_ROLE_KEY in server environment. Cannot bypass RLS on system_settings.');
      return NextResponse.redirect(
        new URL(
          `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
            'missing_supabase_service_role_key: Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file'
          )}`,
          baseUrl
        )
      );
    }

    if (tokenData.refresh_token) {
      const supabase = createAdminClient();
      const { error: upsertError } = await supabase.from('system_settings').upsert(
        {
          key: 'google_drive_refresh_token',
          value: tokenData.refresh_token,
          description: 'Google Drive OAuth 2.0 Refresh Token for Admin Personal Drive',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (upsertError) {
        console.error('[Google Drive Auth] Failed to save refresh token to Supabase:', upsertError.message);
        return NextResponse.redirect(
          new URL(
            `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
              `db_upsert_failed: ${upsertError.message}`
            )}`,
            baseUrl
          )
        );
      }
    } else {
      // Check if we already have a refresh token stored
      const supabase = createAdminClient();
      const { data: existingToken } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'google_drive_refresh_token')
        .maybeSingle();

      if (!existingToken?.value && !process.env.GOOGLE_REFRESH_TOKEN) {
        console.warn('[Google Drive Auth] Google did not return a refresh token and none is stored.');
        return NextResponse.redirect(
          new URL(
            '/admin/dashboard?drive_auth=error&reason=no_refresh_token_returned_reprompt',
            baseUrl
          )
        );
      }
    }

    const response = NextResponse.redirect(
      new URL('/admin/dashboard?drive_auth=success', baseUrl)
    );

    // Clear the oauth_state cookie
    response.cookies.set('oauth_state', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (dbException: any) {
    const safeDbError = dbException?.message || 'Failed during database storage step';
    console.error('[Google Drive Auth] Database exception while storing token:', safeDbError);
    return NextResponse.redirect(
      new URL(
        `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
          `db_storage_exception: ${safeDbError}`
        )}`,
        baseUrl
      )
    );
  }
}

