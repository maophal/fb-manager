import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import type { PoolClient } from 'pg';
import https from 'https';
import { URL } from 'url';

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL) {
    return NextResponse.json({ message: 'Facebook API base URL is not configured on the server.' }, { status: 500 });
  }

  let client: PoolClient | null = null;

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const pageId = formData.get('pageId') as string;
    const caption = formData.get('caption') as string;
    const scheduledPublishTime = formData.get('scheduledPublishTime') as string;

    if (!videoFile || !pageId) {
      return NextResponse.json({ message: 'Missing video file or page ID.' }, { status: 400 });
    }
    if (!caption) {
      return NextResponse.json({ message: 'Caption is required for reels.' }, { status: 400 });
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
    const fileSize = videoFile.size;

    const endpoint = 'video_reels';
    const graphApiBaseUrl = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL!;
    const facebookApiUrl = `${graphApiBaseUrl}${pageId}/${endpoint}`;

    // 1) Start upload session
    const startRes = await fetch(
      `${facebookApiUrl}?upload_phase=start&access_token=${encodeURIComponent(pageAccessToken)}&file_size=${fileSize}`,
      { method: 'POST' }
    );
    const startData = await startRes.json();
    if (!startRes.ok) {
      console.error('Facebook API error (start phase):', startData.error);
      return NextResponse.json(
        { message: startData?.error?.message || 'Failed to start reel upload session.' },
        { status: 500 }
      );
    }

    const { video_id, upload_url, upload_session_id: _sess } = startData;
    const uploadSessionId = _sess || video_id;

    if (!upload_url) {
      // For Reels, Meta returns a rupload URL. If it’s missing, better to fail than guess.
      return NextResponse.json(
        { message: 'Missing upload_url from Facebook start response.' },
        { status: 500 }
      );
    }

    // 2) Upload in chunks with Offset header and raw bytes
// 2) Upload in chunks with Offset header and raw bytes
const chunkSize = 4 * 1024 * 1024; // 4MB
let offset = 0;

const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
const transferUrl = new URL(upload_url);

while (offset < fileSize) {
  const end = Math.min(offset + chunkSize, fileSize);
  const chunk = videoBuffer.subarray(offset, end);

  const options: https.RequestOptions = {
    // Force http/1.1 behavior via the core https module + explicit headers
    protocol: transferUrl.protocol,
    hostname: transferUrl.hostname,
    port: transferUrl.port || 443,
    // include query string!
    path: `${transferUrl.pathname}${transferUrl.search || ''}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pageAccessToken}`,
      'Content-Type': 'application/octet-stream',
      'Transfer-Encoding': 'chunked',
      'Offset': String(offset),
    },
  };

  await new Promise<void>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          // If FB returns next offset in a header, use it; else advance locally
          const next = res.headers['offset'];
          if (typeof next === 'string' && /^\d+$/.test(next)) {
            offset = parseInt(next, 10);
          } else {
            offset += chunk.length;
          }
          resolve();
        } else {
          // Log what the server actually saw for debugging:
          console.error('FB transfer error', {
            status: res.statusCode,
            headers: res.headers,
            body,
          });
          reject(new Error(`Facebook API error (transfer phase): HTTP ${res.statusCode} ${body || ''}`));
        }
      });
    });

    req.on('error', reject);
    req.write(chunk);  // raw bytes
    req.end();         // closes the request (no keep-alive)
  });
}


    // Optional: poll status until ready
    let status = '';
    let tries = 0;
    while (status !== 'ready' && tries < 20) {
      await new Promise((r) => setTimeout(r, 5000));
      const stRes = await fetch(
        `${graphApiBaseUrl}${video_id}?fields=status&access_token=${encodeURIComponent(
          pageAccessToken
        )}`
      );
      const st = await stRes.json();
      if (st?.status?.uploading_phase?.status) {
        status = st.status.uploading_phase.status;
      }
      if (status === 'error') {
        console.error('Facebook API error (reel status check):', st?.status);
        return NextResponse.json({ message: 'Failed to publish reel.' }, { status: 500 });
      }
      tries++;
    }
    if (status !== 'ready') {
      return NextResponse.json({ message: 'Reel processing timed out.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, postId: video_id }, { status: 200 });
  } catch (err: unknown) {
    console.error('Error posting reel to Facebook:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    client?.release();
  }
}