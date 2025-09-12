import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  console.log('POST /api/get-pinterest-image received request.');
  try {
    const { pinterestUrl } = await request.json();

    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com/pin/')) {
      return NextResponse.json({ message: 'Invalid Pinterest URL provided.' }, { status: 400 });
    }

    console.log('Attempting to fetch Pinterest page with axios:', pinterestUrl);

    const response = await axios.get(pinterestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);

    let directImageUrl = $('meta[property="og:image"]').attr('content');

    if (directImageUrl) {
      console.log('Extracted direct image URL from og:image:', directImageUrl);
      return NextResponse.json({ directImageUrl }, { status: 200 });
    } else {
      console.warn('Could not extract direct image URL from Pinterest page.');
      return NextResponse.json({ message: 'Could not extract direct image URL from Pinterest page. Please try a direct image link.' }, { status: 404 });
    }

  } catch (error: unknown) {
    console.error('Error processing Pinterest URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
