import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Create a connection pool with limited max connections
export const client = postgres(process.env.POSTGRES_URL, {
  max: 10, // Limit max connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout after 10 seconds
});

export const db = drizzle(client, { schema });
