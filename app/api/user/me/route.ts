import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Import the reusable connection pool
import type { PoolClient } from 'pg'; // Import Client for type hinting
import { NextRequest } from 'next/server'; // Import NextRequest

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // In a real application, you would get the user ID from the session or a JWT.
    // For this simulation, we'll assume a user is logged in and has an ID.
    // You might pass it as a query parameter for testing, e.g., /api/user/me?id=1
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required for this endpoint.' }, { status: 400 });
    }

    const userQuery = 'SELECT id, name, email, plan_id, created_at FROM users WHERE id = $1';
    const result = await client.query(userQuery, [userId]);

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}