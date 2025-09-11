import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting
import { NextRequest } from 'next/server'; // Import NextRequest

export async function POST(request: NextRequest) { // Using POST for disconnect as it modifies data
  let client: Client | null = null;
  try {
    client = await pool.connect();

    const { userId, pageId } = await request.json();

    if (!userId || !pageId) {
      return NextResponse.json({ message: 'User ID and Page ID are required.' }, { status: 400 });
    }

    // Delete the connected Facebook page from the database
    const deletePageQuery = 'DELETE FROM facebook_pages WHERE user_id = $1 AND page_id = $2 RETURNING id';
    const result = await client.query(deletePageQuery, [userId, pageId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Facebook page not found or not connected to this user.' }, { status: 404 });
    }

    console.log('Facebook page disconnected:', pageId);

    return NextResponse.json({ message: 'Facebook page disconnected successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Facebook disconnect error:', error);
    return NextResponse.json({ message: 'Internal server error during Facebook disconnect.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}