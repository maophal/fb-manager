import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import type { PoolClient } from 'pg';
import https from 'https';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

// Ensure ffmpeg path is set if not in system PATH
// You might need to adjust this path based on your server setup
// ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg');
// ffmpeg.setFfprobePath('/usr/local/bin/ffprobe');

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL) {
    console.error('Facebook API base URL is not configured.');
    return NextResponse.json({ message: 'Facebook API base URL is not configured on the server.' }, { status: 500 });
  }

  let client: PoolClient | null = null;
  let originalVideoPath: string | undefined;
  let croppedVideoPath: string | undefined;

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const pageId = formData.get('pageId') as string;
    const caption = formData.get('caption') as string;
    const scheduledPublishTime = formData.get('scheduledPublishTime') as string;

    console.log('--- Received Reel Post Request ---');
    console.log('Page ID:', pageId);
    console.log('Caption:', caption);
    console.log('Video File Name:', videoFile?.name);
    console.log('Video File Size:', videoFile?.size);
    console.log('Scheduled Publish Time:', scheduledPublishTime);

    if (!videoFile || !pageId) {
      return NextResponse.json({ message: 'Missing video file or page ID.' }, { status: 400 });
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

    // Save the original video file temporarily
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    originalVideoPath = path.join('/tmp', `${Date.now()}-${videoFile.name}`);
    await fs.writeFile(originalVideoPath, videoBuffer);
    console.log('Original video saved to:', originalVideoPath);

    if (!originalVideoPath) {
      throw new Error('originalVideoPath is not defined');
    }

    // Get video metadata to determine cropping
    const metadata = await new Promise<FfprobeData>((resolve, reject) => {
      if (!originalVideoPath) {
        return reject(new Error('originalVideoPath is not defined'));
      }
      ffmpeg.ffprobe(originalVideoPath, (err: Error, data: FfprobeData) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
    if (!videoStream || typeof videoStream.width === 'undefined' || typeof videoStream.height === 'undefined') {
      throw new Error('No video stream with dimensions found in the uploaded file.');
    }

    const originalWidth = videoStream.width;
    const originalHeight = videoStream.height;
    const targetAspectRatio = 9 / 16; // Facebook Reels aspect ratio

    let outputWidth: number;
    let outputHeight: number;

    const currentAspectRatio = originalWidth / originalHeight;

    if (currentAspectRatio > targetAspectRatio) {
      // Video is wider than 9:16, crop horizontally (center crop)
      outputHeight = originalHeight;
      outputWidth = Math.round(originalHeight * targetAspectRatio);
      const x = Math.round((originalWidth - outputWidth) / 2);
      cropFilter = `${outputWidth}:${outputHeight}:${x}:0`;
      console.log(`Cropping horizontally: ${originalWidth}x${originalHeight} -> ${outputWidth}x${outputHeight} (x=${x})`);
    } else if (currentAspectRatio < targetAspectRatio) {
      // Video is taller than 9:16, crop vertically (center crop)
      outputWidth = originalWidth;
      outputHeight = Math.round(originalWidth / targetAspectRatio);
      const y = Math.round((originalHeight - outputHeight) / 2);
      cropFilter = `${outputWidth}:${outputHeight}:0:${y}`;
      console.log(`Cropping vertically: ${originalWidth}x${originalHeight} -> ${outputWidth}x${outputHeight} (y=${y})`);
    } else {
      // Aspect ratio is already 9:16, no cropping needed
      cropFilter = `${originalWidth}:${originalHeight}:0:0`; // No-op crop
      outputWidth = originalWidth;
      outputHeight = originalHeight;
      console.log('Video aspect ratio is already 9:16, no cropping needed.');
    }

    croppedVideoPath = path.join('/tmp', `cropped-${Date.now()}-${videoFile.name}`);

    if (!croppedVideoPath) {
      throw new Error('croppedVideoPath is not defined');
    }

    const finalCroppedPath = croppedVideoPath;

    await new Promise<void>((resolve, reject) => {
      if (!originalVideoPath) {
        return reject(new Error('originalVideoPath is not defined'));
      }
      ffmpeg(originalVideoPath)
        .videoFilters(`crop=${cropFilter},scale=1080:1920`) // Apply crop then scale
        .outputOptions([
          '-c:v libx264', // H.264 codec
          '-preset medium', // Encoding preset
          '-crf 23', // Constant Rate Factor for quality
          '-pix_fmt yuv420p', // Chroma subsampling 4:2:0
          '-g 60', // Closed GOP (2 seconds at 30fps)
          '-keyint_min 60', // Minimum keyframe interval
          '-r 30', // Fixed frame rate (30 fps)
          '-movflags +faststart', // Optimize for streaming
          '-c:a aac', // AAC audio codec
          '-b:a 128k', // Audio bitrate
          '-ar 48000', // Audio sample rate 48kHz
          '-ac 2', // Stereo audio channels
          '-max_muxing_queue_size 1024' // Increase queue size
        ])
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('FFmpeg processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('FFmpeg cropping finished.');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          reject(new Error(`Video cropping failed: ${err.message}`));
        })
        .save(finalCroppedPath);
    });

    // Read the cropped video file for upload
    const croppedVideoBuffer = await fs.readFile(croppedVideoPath);
    const croppedFileSize = croppedVideoBuffer.length;

    const endpoint = 'video_reels';
    const graphApiBaseUrl = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_BASE_URL!;
    const facebookApiUrl = `${graphApiBaseUrl}${pageId}/${endpoint}`;

    // 1) Start upload session
    console.log('--- Start Reel Upload Phase (Cropped Video) ---');
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

    // 2) Upload in chunks with Offset header and raw bytes (using cropped video)
    console.log('--- Starting Cropped Video Chunk Upload ---');
    const chunkSize = 4 * 1024 * 1024; // 4MB
    let offset = 0;

    const transferUrl = new URL(upload_url);

    while (offset < croppedFileSize) {
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
    console.log('--- Cropped Video Chunk Upload Complete ---');


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
    // Clean up temporary files
    if (originalVideoPath) {
      await fs.unlink(originalVideoPath).catch(console.error);
      console.log('Cleaned up original video:', originalVideoPath);
    }
    if (croppedVideoPath) {
      await fs.unlink(croppedVideoPath).catch(console.error);
      console.log('Cleaned up cropped video:', croppedVideoPath);
    }
  }
}
