import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { PoolClient } from 'pg';

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL) {
    return NextResponse.json({ message: 'Facebook API base URL is not configured on the server.' }, { status: 500 });
  }

  let client: PoolClient | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const pageId = searchParams.get('pageId');

    if (!videoId || !pageId) {
      return NextResponse.json({ message: 'Missing videoId or pageId.' }, { status: 400 });
    }

    client = await pool.connect();

    const result = await client.query(
      'SELECT page_access_token FROM facebook_pages WHERE page_id = $1',
      [pageId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Page not found or not connected.' }, { status: 404 });
    }

    const pageAccessToken = result.rows[0].page_access_token;
    const graphApiBaseUrl = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL!;

    const statusUrl = `${graphApiBaseUrl}${videoId}?fields=status&access_token=${pageAccessToken}`;

    const fbRes = await fetch(statusUrl);
    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('Facebook API error (get video status):', fbData.error);
      return NextResponse.json(
        { message: fbData?.error?.message || 'Failed to get video status from Facebook.' },
        { status: 500 }
      );
    }

    return NextResponse.json(fbData);
  } catch (err: unknown) {
    console.error('Error getting video status:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    client?.release();
  }
}
