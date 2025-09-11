import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db'; // Import the reusable connection pool

export async function POST(request: Request) {
  let client; // Declare client outside try block for finally access
  try {
    client = await pool.connect(); // Get a client from the pool

    const { name, email, password } = await request.json();

    // Basic server-side validation
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = $1';
    const userExists = await client.query(checkUserQuery, [email]);

    if (userExists.rows.length > 0) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user into the database
    const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email';
    const newUser = await client.query(insertUserQuery, [name, email, hashedPassword]);

    console.log('User registered in DB:', newUser.rows[0]);

    return NextResponse.json({ message: 'Registration successful!', user: newUser.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  } finally {
    // Ensure the client is released back to the pool
    // This is crucial for connection pooling
    if (client) {
      client.release();
    }
  }
}