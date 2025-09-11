import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Reusable DB connection
import { Client } from 'pg'; // Import Client for type hinting
import { NextRequest } from 'next/server'; // Import NextRequest

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  try {
    client = await pool.connect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Our internal user ID

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    // Fetch all Facebook pages connected by this internal user
    // and group them by the Facebook account that connected them.
    const getPagesQuery = `
      SELECT
        fp.id AS page_db_id,
        fp.page_id,
        fp.page_name,
        fp.facebook_user_id,
        fp.facebook_user_name
      FROM
        facebook_pages fp
      WHERE
        fp.user_id = $1
      ORDER BY
        fp.facebook_user_name, fp.page_name;
    `;
    const result = await client.query(getPagesQuery, [userId]);

    // Group pages by Facebook account
    const groupedAccounts: { [key: string]: { facebook_user_id: string; facebook_user_name: string; pages: any[] } } = {};

    result.rows.forEach(row => {
      if (!groupedAccounts[row.facebook_user_id]) {
        groupedAccounts[row.facebook_user_id] = {
          facebook_user_id: row.facebook_user_id,
          facebook_user_name: row.facebook_user_name,
          pages: []
        };
      }
      groupedAccounts[row.facebook_user_id].pages.push({
        id: row.page_db_id,
        page_id: row.page_id,
        page_name: row.page_name
      });
    });

    const responseData = Object.values(groupedAccounts);

    return NextResponse.json({ accounts: responseData }, { status: 200 });
  } catch (error) {
    console.error('Get Facebook accounts and pages error:', error);
    return NextResponse.json({ message: 'Internal server error during fetching Facebook accounts and pages.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}