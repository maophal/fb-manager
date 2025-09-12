import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  try {
    client = await pool.connect();
    const { pageId, message } = await request.json();
    console.log('Received pageId:', pageId, 'and message:', message);

    if (!pageId || !message) {
      return NextResponse.json({ message: 'Page ID and message are required.' }, { status: 400 });
    }

    // Fetch the page access token from your database
    const getPageTokenQuery = 'SELECT page_access_token FROM facebook_pages WHERE page_id = $1';
    const result = await client.query(getPageTokenQuery, [pageId]);
    console.log('Database query result for page token:', result.rows);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Page not found or not connected.' }, { status: 404 });
    }

    const pageAccessToken = result.rows[0].page_access_token;
    console.log('Fetched pageAccessToken:', pageAccessToken ? '[TOKEN_EXISTS]' : '[TOKEN_MISSING]');

    // Post the message to Facebook Graph API
    const facebookApiUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const postResponse = await fetch(facebookApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        access_token: pageAccessToken,
      }),
    });

    const postData = await postResponse.json();

    if (postData.error) {
      console.error('Facebook API post error:', postData.error);
      return NextResponse.json({ message: postData.error.message || 'Failed to post to Facebook.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, postId: postData.id }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error posting to Facebook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}