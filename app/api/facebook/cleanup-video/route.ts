import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ message: 'Missing file path.' }, { status: 400 });
    }

    await fs.unlink(filePath);
    console.log('Cleaned up video:', filePath);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('--- Error Cleaning Up Video ---');
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    // If the file doesn't exist, it's not a critical error in a cleanup job.
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      console.log('File not found for cleanup (already deleted?):', message);
      return NextResponse.json({ success: true, message: 'File not found, assumed already deleted.' });
    }
    console.error('Full error details:', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
