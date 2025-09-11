import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Import the reusable connection pool

export async function PUT(request: Request) {
  let client;
  try {
    client = await pool.connect(); // Get a client from the pool

    const { id, name, email, plan_id } = await request.json();

    // Basic validation
    if (!id) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    // Build dynamic update query
    const updates = [];
    const values = [id];
    let paramIndex = 2;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (plan_id !== undefined) {
      updates.push(`plan_id = $${paramIndex++}`);
      values.push(plan_id);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update.' }, { status: 400 });
    }

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, email, plan_id`;
    const result = await client.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    console.log('User updated in DB:', result.rows[0]);

    return NextResponse.json({ message: 'User updated successfully!', user: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
    }
  }
}