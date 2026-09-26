import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Admin session (Supabase Auth server session OR verified Admin session cookie)
    const adminSession = await verifyAdminSession(request);

    if (!adminSession.isValid) {
      return NextResponse.redirect(new URL('/admin-login?error=unauthorized', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'https://facultymarks.vercel.app/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in environment variables.',
        },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 2. Generate secure state parameter for CSRF protection
    const state = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    // 3. Generate OAuth Authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive'],
      state,
      include_granted_scopes: true,
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
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate Google OAuth authorization' },
      { status: 500 }
    );
  }
}
