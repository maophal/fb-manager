import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting

export async function POST(request: NextRequest) {
  console.log('POST /api/facebook/post received request.');
  let client: Client | null = null;
  try {
    client = await pool.connect();
    const { pageId, message, caption, attachedMedia, scheduledPublishTime } = await request.json();
    console.log('Incoming payload to /api/facebook/post:', { pageId, message, caption, attachedMedia, scheduledPublishTime }); // Debug log

    if (!pageId) {
      return NextResponse.json({ message: 'Page ID is required.' }, { status: 400 });
    }

    // For multi-photo posts, 'attachedMedia' is required instead of 'message'
    if (!message && (!attachedMedia || attachedMedia.length === 0)) {
      return NextResponse.json({ message: 'Either message or attached media is required.' }, { status: 400 });
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

    const postBody: {
      message?: string; // message is optional for attached_media posts
      caption?: string;
      access_token: string;
      scheduled_publish_time?: number;
      published?: boolean;
      attached_media?: { media_fbid: string }[]; // New: for multi-photo posts
    } = {
      access_token: pageAccessToken,
    };

    if (message) { // Only add message if it exists
      postBody.message = message;
    }
    if (caption) {
      postBody.caption = caption;
    }
    if (attachedMedia) {
      postBody.attached_media = attachedMedia;
    }

    if (scheduledPublishTime) {
      // Facebook Graph API requires scheduled_publish_time as a Unix timestamp (seconds since epoch)
      postBody.scheduled_publish_time = Math.floor(new Date(scheduledPublishTime).getTime() / 1000);
      postBody.published = false; // Must be false for scheduled posts
      console.log(`Scheduling post for: ${new Date(scheduledPublishTime).toISOString()} (Unix: ${postBody.scheduled_publish_time})`);
      // IMPORTANT: For true scheduling, you would typically save this post to a database
      // with its scheduled time and use a background job (e.g., cron, message queue)
      // to publish it at the specified time. This API endpoint only sets the
      // scheduled_publish_time parameter for Facebook's API.
    }

    console.log(`Sending payload to Facebook API for page ${pageId}:`, postBody); // Debug log
    const postResponse = await fetch(facebookApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    });

    const postData = await postResponse.json();
    console.log(`Facebook Graph API response for page ${pageId}:`, postData); // Debug log

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