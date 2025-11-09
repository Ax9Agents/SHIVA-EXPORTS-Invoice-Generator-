import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID!,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
  process.env.GOOGLE_DRIVE_REDIRECT_URI_1! || process.env.GOOGLE_DRIVE_REDIRECT_URI_2!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
    state: userId, // Pass userId through state parameter
    prompt: 'consent' // Force consent to get refresh token
  });

  return NextResponse.redirect(authUrl);
}
