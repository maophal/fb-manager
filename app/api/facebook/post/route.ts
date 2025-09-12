import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting

export async function POST(request: NextRequest) {
  console.log('POST /api/facebook/post received request.');
  let client: Client | null = null;
  try {
    client = await pool.connect();
    const { pageId, message, caption } = await request.json();
    console.log('Request body:', { pageId, message, caption });

    if (!pageId || !message) {
      return NextResponse.json({ message: 'Page ID and message are required.' }, { status: 400 });
    }

    // Fetch the page access token from your database
    console.log(`Fetching page access token for pageId: ${pageId}`);
    const getPageTokenQuery = 'SELECT page_access_token FROM facebook_pages WHERE page_id = $1';
    const result = await client.query(getPageTokenQuery, [pageId]);

    if (result.rows.length === 0) {
      console.warn(`Page access token not found for pageId: ${pageId}`);
      return NextResponse.json({ message: 'Page not found or not connected.' }, { status: 404 });
    }

    const pageAccessToken = result.rows[0].page_access_token;
    console.log(`Page access token fetched for pageId: ${pageId}`);

    // Post the message to Facebook Graph API
    const facebookApiUrl = `${process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL}${pageId}/feed`;
    console.log(`Making Facebook Graph API call to: ${facebookApiUrl}`);
    console.log('Request payload:', { message, caption });
    const postResponse = await fetch(facebookApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        caption: caption, // Include caption
        access_token: pageAccessToken,
      }),
    });

    const postData = await postResponse.json();
    console.log(`Facebook Graph API response for page ${pageId}:`, postData);

    if (postData.error) {
      console.error('Facebook API post error:', postData.error);
      return NextResponse.json({ message: postData.error.message || 'Failed to post to Facebook.' }, { status: 500 });
    }

    console.log('Returning final response:', { success: true, postId: postData.id });
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