import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;

  try {
    // 1. Verify Admin session
    const adminSession = await verifyAdminSession(request);

    if (!adminSession.isValid) {
      const referer = request.headers.get('referer');
      if (referer && referer.includes('/admin')) {
        return NextResponse.redirect(
          new URL('/admin/dashboard?drive_auth=error&reason=unauthorized_admin', baseUrl)
        );
      }
      return NextResponse.redirect(new URL('/admin-login?error=unauthorized', baseUrl));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      baseUrl.includes('localhost')
        ? `${baseUrl}/api/auth/google/callback`
        : (process.env.GOOGLE_REDIRECT_URI || 'https://nsriet.vercel.app/api/auth/google/callback');

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/admin/dashboard?drive_auth=error&reason=credentials_missing', baseUrl)
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 2. Generate secure state parameter for CSRF protection
    const state =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);

    // 3. Generate OAuth Authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive'],
      state,
      include_granted_scopes: true,
    });

    const parsedAuthUrl = new URL(authUrl);
    console.log('[Google OAuth Init Diagnostic]', {
      runtimeClientId: clientId,
      runtimeRedirectUri: redirectUri,
      authUrlClientIdParam: parsedAuthUrl.searchParams.get('client_id'),
      authUrlRedirectUriParam: parsedAuthUrl.searchParams.get('redirect_uri'),
      authUrlScopeParam: parsedAuthUrl.searchParams.get('scope'),
    });

    // 4. Redirect with secure state cookie
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      path: '/',
      maxAge: 600, // 10 minutes
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Error initiating Google OAuth flow:', error?.message || error);
    return NextResponse.redirect(
      new URL(
        `/admin/dashboard?drive_auth=error&reason=${encodeURIComponent(
          error?.message || 'oauth_init_failed'
        )}`,
        baseUrl
      )
    );
  }
}
