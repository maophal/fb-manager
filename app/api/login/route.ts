import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db'; // Import the reusable connection pool

export async function POST(request: Request) {
  let client;
  try {
    client = await pool.connect(); // Get a client from the pool

    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Find user by email
    const userQuery = 'SELECT id, name, email, password, plan_id FROM users WHERE email = $1';
    const result = await client.query(userQuery, [email]);

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // Compare provided password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // Login successful
    // In a real application, you would create a session or JWT here
    console.log('User logged in:', user.email);

    // Return user details (excluding hashed password)
    const { password: hashedPassword, ...userData } = user;
    return NextResponse.json({ message: 'Login successful!', user: userData }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
    }
  }
}