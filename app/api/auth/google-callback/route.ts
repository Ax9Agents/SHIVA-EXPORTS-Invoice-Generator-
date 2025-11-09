import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID!,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
  process.env.GOOGLE_DRIVE_REDIRECT_URI_1! || process.env.GOOGLE_DRIVE_REDIRECT_URI_2!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('state'); // userId from state parameter

    if (!code || !userId) {
      return NextResponse.redirect(new URL('/?error=invalid_callback', request.url));
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Calculate expiry time
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    // Save tokens to database
    const { error } = await supabaseAdmin
      .from('drive_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Redirect back to app with success
    return NextResponse.redirect(new URL('/?drive_connected=true', request.url));

  } catch (error) {
    const err = error as Error;
    console.error('Google callback error:', err);
    return NextResponse.redirect(new URL('/?error=drive_connection_failed', request.url));
  }
}
