import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting

export async function POST(request: NextRequest) {
  console.log('POST /api/facebook/post-image received request.');
  let client: Client | null = null;
  try {
    client = await pool.connect();
    const formData = await request.formData();

    const pageId = formData.get('pageId')?.toString();
    const caption = formData.get('caption')?.toString();
    const imageUrl = formData.get('imageUrl')?.toString();
    const imageFile = formData.get('imageFile') as File | null;
    const scheduledPublishTime = formData.get('scheduledPublishTime')?.toString();

    console.log('Request form data:', { pageId, caption, imageUrl, imageFile: imageFile?.name, scheduledPublishTime });
    if (imageUrl) {
      console.log('Attempting to post image from URL:', imageUrl);
    } else if (imageFile) {
      console.log('Attempting to post image from uploaded file:', imageFile.name, 'Type:', imageFile.type);
    }

    if (!pageId) {
      return NextResponse.json({ message: 'Page ID is required.' }, { status: 400 });
    }
    if (!imageUrl && !imageFile) {
      return NextResponse.json({ message: 'Image URL or image file is required.' }, { status: 400 });
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

    const facebookApiUrl = `${process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL}${pageId}/photos`;

    const postBody: {
      caption?: string;
      url?: string;
      access_token: string;
      scheduled_publish_time?: number;
      published?: boolean;
      // For file upload, Facebook API expects 'source' as multipart/form-data,
      // which is handled by sending the FormData directly.
    } = {
      access_token: pageAccessToken,
    };

    if (caption) {
      postBody.caption = caption;
    }

    if (imageUrl) {
      postBody.url = imageUrl;
    }

    if (scheduledPublishTime) {
      postBody.scheduled_publish_time = Math.floor(new Date(scheduledPublishTime).getTime() / 1000);
      postBody.published = false;
      console.log(`Scheduling image post for: ${new Date(scheduledPublishTime).toISOString()} (Unix: ${postBody.scheduled_publish_time})`);
    }

    let postResponse;
    if (imageFile) {
      // For file upload, we need to construct a new FormData object
      // because the original request.formData() has already been consumed.
      // This is a simplification; in a real app, you might stream the file
      // or handle it differently.
      const fileFormData = new FormData();
      fileFormData.append('source', imageFile, imageFile.name); // Explicitly provide filename
      fileFormData.append('access_token', pageAccessToken);
      if (caption) fileFormData.append('caption', caption);
      if (scheduledPublishTime) {
        fileFormData.append('scheduled_publish_time', postBody.scheduled_publish_time!.toString());
        fileFormData.append('published', 'false');
      }

      console.log(`Making Facebook Graph API file upload call to: ${facebookApiUrl}`);
      postResponse = await fetch(facebookApiUrl, {
        method: 'POST',
        body: fileFormData, // Send FormData directly for file upload
      });
    } else {
      console.log(`Making Facebook Graph API URL post call to: ${facebookApiUrl}`);
      postResponse = await fetch(facebookApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody),
      });
    }

    const postData = await postResponse.json();
    console.log(`Facebook Graph API response for page ${pageId}:`, postData);

    if (postData.error) {
      console.error('Facebook API image post error:', postData.error);
      return NextResponse.json({ message: postData.error.message || 'Failed to post image to Facebook.' }, { status: 500 });
    }

    console.log('Returning final response:', { success: true, postId: postData.id });
    return NextResponse.json({ success: true, postId: postData.id }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error posting image to Facebook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}