import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// IMPORTANT: Replace with your actual Facebook App ID and Redirect URI
// These should ideally be loaded from environment variables for security.
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/facebook/callback';

export async function GET(request: NextRequest) {
  const scope = 'public_profile,email,pages_show_list,pages_manage_posts'; // Required permissions

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Get userId from query parameter

  // The 'state' parameter is used for CSRF protection and can carry data
  // We'll encode the userId into the state parameter
  const state = userId ? `userId=${userId}` : ''; // Simple encoding for simulation

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}`;

  return NextResponse.json({ authUrl }, { status: 200 });
}