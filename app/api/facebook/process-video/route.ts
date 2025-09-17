import { NextResponse, NextRequest } from 'next/server';
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

export async function POST(request: NextRequest) {
  let originalVideoPath: string | undefined;
  let processedVideoPath: string | undefined;

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json({ message: 'Missing video file.' }, { status: 400 });
    }

    // Save the original video file temporarily
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    originalVideoPath = path.join('/tmp', `${Date.now()}-${videoFile.name}`);
    await fs.writeFile(originalVideoPath, videoBuffer);
    console.log('Original video saved to:', originalVideoPath);

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

    let cropFilter: string;

    const currentAspectRatio = originalWidth / originalHeight;

    if (currentAspectRatio > targetAspectRatio) {
      const outputHeight = originalHeight;
      const outputWidth = Math.round(originalHeight * targetAspectRatio);
      const x = Math.round((originalWidth - outputWidth) / 2);
      cropFilter = `${outputWidth}:${outputHeight}:${x}:0`;
    } else if (currentAspectRatio < targetAspectRatio) {
      const outputWidth = originalWidth;
      const outputHeight = Math.round(originalWidth / targetAspectRatio);
      const y = Math.round((originalHeight - outputHeight) / 2);
      cropFilter = `${outputWidth}:${outputHeight}:0:${y}`;
    } else {
      cropFilter = `${originalWidth}:${originalHeight}:0:0`;
    }

    processedVideoPath = path.join('/tmp', `processed-${Date.now()}-${videoFile.name}`);

    await new Promise<void>((resolve, reject) => {
      if (!originalVideoPath) {
        return reject(new Error('originalVideoPath is not defined'));
      }
      if (!processedVideoPath) {
        return reject(new Error('processedVideoPath is not defined'));
      }
      ffmpeg(originalVideoPath)
        .videoFilters(`crop=${cropFilter},scale=1080:1920`)
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-g 60',
          '-keyint_min 60',
          '-r 30',
          '-movflags +faststart',
          '-c:a aac',
          '-b:a 128k',
          '-ar 48000',
          '-ac 2',
          '-max_muxing_queue_size 1024'
        ])
        .on('end', () => resolve())
        .on('error', reject)
        .save(processedVideoPath);
    });

    return NextResponse.json({ processedVideoPath }, { status: 200 });

  } catch (err: unknown) {
    console.error('--- Error Processing Video ---');
    console.error('Full error details:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    // Clean up original video file immediately after processing
    if (originalVideoPath) {
      await fs.unlink(originalVideoPath).catch(console.error);
      console.log('Cleaned up original video:', originalVideoPath);
    }
  }
}
