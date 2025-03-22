import { sql } from 'drizzle-orm';
import { db } from './drizzle';

async function main() {
  try {
    console.log('Checking if deleted_at column exists in clients table...');
    
    // Check if the column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'deleted_at'
    `);
    
    console.log('Check result:', checkResult);
    
    // Use type assertion to fix TypeScript error
    const rows = (checkResult as any).rows;
    if (!rows || rows.length === 0) {
      console.log('Column does not exist, adding it now...');
      // Add the column if it doesn't exist
      await db.execute(sql`ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp`);
      console.log('Added deleted_at column to clients table');
    } else {
      console.log('Column deleted_at already exists in clients table');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main(); 