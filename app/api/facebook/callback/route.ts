import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting

// IMPORTANT: Replace with your actual Facebook App ID and Secret
// These should ideally be loaded from environment variables for security.
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/facebook/callback';

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  try {
    client = await pool.connect();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code'); // Authorization code from Facebook
    const state = searchParams.get('state'); // State parameter from Facebook

    if (!code) {
      throw new Error('Authorization code not received from Facebook.');
    }

    // Extract userId from the state parameter
    let currentAppUserId: string | null = null;
    if (state) {
      const stateParams = new URLSearchParams(state);
      currentAppUserId = stateParams.get('userId');
    }

    if (!currentAppUserId) {
      throw new Error('User ID not found in state parameter. Cannot link Facebook account.');
    }

    // 1. Exchange code for User Access Token
    const tokenExchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    const tokenResponse = await fetch(tokenExchangeUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(`Facebook token exchange error: ${tokenData.error.message}`);
    }

    const userAccessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // Short-lived token expiration

    // 2. Get User's Profile (ID, Name, Email)
    const userProfileUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${userAccessToken}`;
    const userProfileResponse = await fetch(userProfileUrl);
    const userProfileData = await userProfileResponse.json();

    if (userProfileData.error) {
      throw new Error(`Facebook user profile error: ${userProfileData.error.message}`);
    }

    const facebookUserId = userProfileData.id;
    const facebookUserName = userProfileData.name;
    const facebookUserEmail = userProfileData.email;

    // 3. Get User's Managed Pages and their Page Access Tokens
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(`Facebook pages error: ${pagesData.error.message}`);
    }

    const managedPages = pagesData.data; // Array of pages user manages

    // Connect pages to the user in our database
    const connectedPages = [];
    for (const page of managedPages) {
      // In a real app, you'd store page.access_token securely (encrypted)
      // and handle its expiration/refresh.
      const pageId = page.id;
      const pageName = page.name;
      const pageAccessToken = page.access_token; // This is the page-specific token

      const checkPageQuery = 'SELECT * FROM facebook_pages WHERE user_id = $1 AND page_id = $2';
      const pageExists = await client.query(checkPageQuery, [currentAppUserId, pageId]);

      if (pageExists.rows.length === 0) {
        const insertPageQuery = 'INSERT INTO facebook_pages (user_id, page_id, page_name, facebook_user_id, facebook_user_name, page_access_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, page_id, page_name, facebook_user_id, facebook_user_name';
        const newPage = await client.query(insertPageQuery, [currentAppUserId, pageId, pageName, facebookUserId, facebookUserName, pageAccessToken]);
        connectedPages.push(newPage.rows[0]);
      } else {
        const updatePageQuery = 'UPDATE facebook_pages SET facebook_user_name = $1, page_access_token = $2 WHERE user_id = $3 AND page_id = $4 RETURNING id, page_id, page_name, facebook_user_id, facebook_user_name';
        const updatedPage = await client.query(updatePageQuery, [facebookUserName, pageAccessToken, currentAppUserId, pageId]);
        connectedPages.push(updatedPage.rows[0]);
      }
    }

    // Redirect back to the Facebook management page with a success message
    const redirectUrl = `/facebook?status=success&message=Facebook_account_connected&pages=${encodeURIComponent(JSON.stringify(connectedPages))}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error: unknown) {
    console.error('Facebook callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed_to_connect_Facebook_account';
    const redirectUrl = `/facebook?status=error&message=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } finally {
    if (client) {
      client.release();
    }
  }
}