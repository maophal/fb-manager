import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import type { PoolClient } from 'pg';
import https from 'https';
import { URL } from 'url';
import fs from 'fs/promises';
// Removed path import as it's no longer needed
// import path from 'path';
// Removed ffmpeg import as it's no longer needed for cropping in this API
// import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL) {
    console.error('Facebook API base URL is not configured.');
    return NextResponse.json({ message: 'Facebook API base URL is not configured on the server.' }, { status: 500 });
  }

  let client: PoolClient | null = null;
  // Removed originalVideoPath and croppedVideoPath declarations

  try {
    const formData = await request.formData();
    const processedVideoPath = formData.get('processedVideoPath') as string; // Expect processed video path
    const pageId = formData.get('pageId') as string;
    const caption = formData.get('caption') as string;
    const scheduledPublishTime = formData.get('scheduledPublishTime') as string;

    console.log('--- Received Reel Post Request ---');
    console.log('Page ID:', pageId);
    console.log('Caption:', caption);
    console.log('Processed Video Path:', processedVideoPath);
    console.log('Scheduled Publish Time:', scheduledPublishTime);

    if (!processedVideoPath || !pageId) {
      return NextResponse.json({ message: 'Missing processed video path or page ID.' }, { status: 400 });
    }
    if (!caption) {
      console.error('Caption is missing for reel.');
      return NextResponse.json({ message: 'Caption is required for reels.' }, { status: 400 });
    }

    console.log('--- Connecting to Database ---');
    client = await pool.connect();
    console.log('Database connected.');

    console.log('--- Querying Page Access Token ---');
    const result = await client.query(
      'SELECT page_access_token FROM facebook_pages WHERE page_id = $1',
      [pageId]
    );
    if (result.rows.length === 0) {
      console.error('Page not found or not connected in DB for pageId:', pageId);
      return NextResponse.json({ message: 'Page not found or not connected.' }, { status: 404 });
    }

    const pageAccessToken = result.rows[0].page_access_token;
    console.log('Page Access Token retrieved (first 5 chars):', pageAccessToken.substring(0, 5) + '...');

    // Read the processed video file for upload
    const croppedVideoBuffer = await fs.readFile(processedVideoPath);
    const croppedFileSize = croppedVideoBuffer.length;

    const endpoint = 'video_reels';
    const graphApiBaseUrl = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL!;
    const facebookApiUrl = `${graphApiBaseUrl}${pageId}/${endpoint}`;

    // 1) Start upload session
    console.log('--- Start Reel Upload Phase (Processed Video) ---'); // Updated log
    console.log('Start API URL:', facebookApiUrl);
    const startRequestBody = JSON.stringify({
      upload_phase: 'start',
      access_token: pageAccessToken,
    });
    console.log('Start Request Body:', startRequestBody);

    const startRes = await fetch(
      facebookApiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: startRequestBody,
      }
    );
    const startData = await startRes.json();
    console.log('Start API Response:', startData);
    if (!startRes.ok) {
      console.error('Facebook API error (start phase):', startData.error);
      return NextResponse.json(
        { message: startData?.error?.message || 'Failed to start reel upload session.' },
        { status: 500 }
      );
    }

    const { video_id, upload_url } = startData;
    console.log('Received video_id:', video_id);
    console.log('Received upload_url:', upload_url);

    if (!upload_url) {
      console.error('Missing upload_url from Facebook start response.');
      return NextResponse.json(
        { message: 'Missing upload_url from Facebook start response.' },
        { status: 500 }
      );
    }

    // 2) Upload in chunks with Offset header and raw bytes (using processed video)
    console.log('--- Starting Processed Video Chunk Upload ---'); // Updated log
    const chunkSize = 4 * 1024 * 1024; // 4MB
    let offset = 0;

    const transferUrl = new URL(upload_url);

    while (offset < croppedFileSize) { // Renamed croppedFileSize to processedFileSize for clarity, but keeping for now
      const end = Math.min(offset + chunkSize, croppedFileSize);
      const chunk = croppedVideoBuffer.subarray(offset, end);

      console.log(`Uploading chunk: offset=${offset}, size=${chunk.length}/${croppedFileSize}`);

      const options: https.RequestOptions = {
        protocol: transferUrl.protocol,
        hostname: transferUrl.hostname,
        port: transferUrl.port || 443,
        path: `${transferUrl.pathname}${transferUrl.search || ''}`,
        method: 'POST',
        headers: {
          Authorization: `OAuth ${pageAccessToken}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(chunk.length),
          'Offset': String(offset),
          'file_size': String(croppedFileSize),
        },
      };

      await new Promise<void>((resolve, reject) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const next = res.headers['offset'];
              if (typeof next === 'string' && /^\d+$/.test(next)) {
                offset = parseInt(next, 10);
                console.log('Facebook returned next offset:', offset);
              } else {
                offset += chunk.length;
                console.log('Advanced offset locally to:', offset);
              }
              resolve();
            } else {
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
        req.write(chunk);
        req.end();
      });
    }
    console.log('--- Processed Video Chunk Upload Complete ---');


    // 3) Publish the Reel
    console.log('--- Publishing the Reel ---');
    const publishUrl = `${facebookApiUrl}?access_token=${encodeURIComponent(pageAccessToken)}&video_id=${video_id}&upload_phase=finish&video_state=PUBLISHED&description=${encodeURIComponent(caption)}`;
    console.log('Publish URL:', publishUrl);

    const publishRes = await fetch(
      publishUrl,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();
    console.log('Publish API Response:', publishData);

    if (!publishRes.ok) {
      console.error('Facebook API error (publish phase):', publishData.error);
      return NextResponse.json(
        { message: publishData?.error?.message || 'Failed to publish reel.' },
        { status: 500 }
      );
    }

    console.log('Reel published successfully with postId:', video_id);
    return NextResponse.json({ success: true, postId: video_id }, { status: 200 });
  } catch (err: unknown) {
    console.error('--- Error Posting Reel to Facebook ---');
    console.error('Full error details:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
    // The processedVideoPath will be cleaned up by the cleanup-video API
  }}