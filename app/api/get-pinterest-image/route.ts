import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('POST /api/get-pinterest-image received request.');
  try {
    const { pinterestUrl } = await request.json();

    if (!pinterestUrl || !pinterestUrl.includes('pinterest.com/pin/')) {
      return NextResponse.json({ message: 'Invalid Pinterest URL provided.' }, { status: 400 });
    }

    console.log('Attempting to fetch Pinterest page:', pinterestUrl);

    // Fetch the Pinterest page content
    const response = await fetch(pinterestUrl, {
      headers: {
        // It's good practice to set a User-Agent, some sites block requests without one
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Pinterest page: ${response.status} ${response.statusText}`);
      return NextResponse.json({ message: `Failed to fetch Pinterest page: ${response.statusText}` }, { status: response.status });
    }

    const htmlContent = await response.text();
    console.log('Pinterest page fetched. Attempting to extract image URL.');

    let directImageUrl = null;

    // Try to find the og:image meta tag first
    const ogImageRegex = /<meta property="og:image" content="(.*?)"/;
    const match = htmlContent.match(ogImageRegex);

    if (match && match[1]) {
      directImageUrl = match[1];
      console.log('Extracted direct image URL from og:image:', directImageUrl);
    } else {
      console.warn('Could not find og:image meta tag on Pinterest page. Trying fallback.');

      // Fallback: Try to find a direct image URL from common Pinterest image patterns
      const pinterestImageRegex = /<img[^>]+src=["'](https:\/\/i\.pinimg\.com\/[^"']+\.(?:jpg|jpeg|png|gif|webp))["']/g;
      let pinterestMatch;
      while ((pinterestMatch = pinterestImageRegex.exec(htmlContent)) !== null) {
        // Prioritize larger images if multiple are found (simple heuristic: longer URL)
        if (!directImageUrl || pinterestMatch[1].length > directImageUrl.length) {
          directImageUrl = pinterestMatch[1];
        }
      }

      if (directImageUrl) {
        console.log('Extracted direct image URL from img src (fallback):', directImageUrl);
      } else {
        console.warn('Could not extract direct image URL from Pinterest page using fallback.');
        return NextResponse.json({ message: 'Could not extract direct image URL from Pinterest page. Please try a direct image link.' }, { status: 404 });
      }
    }

    // Attempt to transform the URL to /originals/ if it's a Pinterest image URL
    if (directImageUrl && directImageUrl.includes('i.pinimg.com/')) {
      const parts = directImageUrl.split('/');
      const sizeIndex = parts.findIndex(part => part.match(/^\d+x$/)); // Find a part like '236x' or '736x'

      if (sizeIndex !== -1 && parts[sizeIndex - 1] !== 'originals') {
        // Replace the size segment with 'originals'
        parts[sizeIndex] = 'originals';
        const transformedUrl = parts.join('/');
        console.log('Attempting to transform URL to originals:', transformedUrl);
        // You might want to verify if this transformed URL actually exists
        // by making a HEAD request, but for simplicity, we'll assume it does.
        directImageUrl = transformedUrl;
      }
    }

    return NextResponse.json({ directImageUrl }, { status: 200 });

    return NextResponse.json({ directImageUrl }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error processing Pinterest URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: `Server error: ${errorMessage}` }, { status: 500 });
  }
}