import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Admin access before initiating OAuth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin-login?error=unauthorized', request.url));
    }

    // Check if user is an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can connect Google Drive.' },
        { status: 403 }
      );
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

    // Generate OAuth Authorization URL with offline access and force consent to guarantee refresh_token
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive'],
      include_granted_scopes: true,
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating Google OAuth flow:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate Google OAuth authorization' },
      { status: 500 }
    );
  }
}
