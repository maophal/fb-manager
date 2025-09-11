import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: parseInt(process.env.PG_PORT || '5432', 10),
});

// Optional: Log a message when the pool is connected
pool.on('connect', () => {
  console.log('PostgreSQL client connected to the database.');
});

// Optional: Log errors from the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Exit process if a critical error occurs
});

export default pool;