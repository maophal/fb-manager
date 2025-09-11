import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection

import { NextRequest } from 'next/server'; // Import NextRequest

export async function POST(request: NextRequest) {
  let client: Client | null = null; // Initialize client as nullable
  try {
    const { userId, planId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json({ message: 'User ID and Plan ID are required.' }, { status: 400 });
    }

    // Simulate Bakong payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2-second payment processing

    // In a real scenario, you would interact with the Bakong API here
    // to initiate payment and then poll for status or receive a webhook.
    // For this simulation, we assume payment is successful.

    // Update user's plan_id in the database after simulated successful payment
    client = await pool.connect();
    const updateQuery = 'UPDATE users SET plan_id = $1 WHERE id = $2 RETURNING id, name, email, plan_id';
    const result = await client.query(updateQuery, [planId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found for plan update.' }, { status: 404 });
    }

    console.log(`Simulated Bakong payment successful for user ${userId}, plan ${planId}`);
    return NextResponse.json({ message: 'Simulated Bakong payment successful!', user: result.rows[0] }, { status: 200 });

  } catch (error) {
    console.error('Simulated Bakong payment error:', error);
    return NextResponse.json({ message: 'Internal server error during simulated payment.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}