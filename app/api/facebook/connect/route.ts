import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import type { PoolClient } from 'pg'; // Import Client for type hinting
import { NextRequest } from 'next/server'; // Import NextRequest

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    const { userId, pageId, pageName } = await request.json();

    if (!userId || !pageId || !pageName) {
      return NextResponse.json({ message: 'User ID, Page ID, and Page Name are required.' }, { status: 400 });
    }

    // Check if page is already connected
    const checkPageQuery = 'SELECT * FROM facebook_pages WHERE page_id = $1 AND user_id = $2';
    const pageExists = await client.query(checkPageQuery, [pageId, userId]);

    if (pageExists.rows.length > 0) {
      return NextResponse.json({ message: 'This Facebook page is already connected.' }, { status: 409 });
    }

    // Simulate connecting a Facebook page (in a real app, this involves FB API calls)
    // Insert new connected page into the database
    const insertPageQuery = 'INSERT INTO facebook_pages (user_id, page_id, page_name) VALUES ($1, $2, $3) RETURNING id, page_id, page_name';
    const newPage = await client.query(insertPageQuery, [userId, pageId, pageName]);

    console.log('Facebook page connected:', newPage.rows[0]);

    return NextResponse.json({ message: 'Facebook page connected successfully!', page: newPage.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Facebook connect error:', error);
    return NextResponse.json({ message: 'Internal server error during Facebook connect.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}