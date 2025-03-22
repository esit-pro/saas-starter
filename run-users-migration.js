#!/usr/bin/env node

// This script adds the missing created_by, updated_by, and deleted_by columns to the users table
// This is a one-time migration to fix the database schema

const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config();

const createMissingColumns = async () => {
  // Use POSTGRES_URL directly from .env
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('Error: POSTGRES_URL is not defined in environment variables');
    process.exit(1);
  }
  
  console.log('Using database connection string (masked)');
  
  // Connect to the database
  const sql = postgres(connectionString);

  try {
    console.log('Checking if users table has created_by column...');
    
    const checkColumnResult = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'created_by'
      );
    `;
    
    const hasCreatedByColumn = checkColumnResult[0].exists;
    
    if (!hasCreatedByColumn) {
      console.log('Adding created_by, updated_by, and deleted_by columns to users table...');
      
      // Add the missing columns
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS created_by INTEGER,
        ADD COLUMN IF NOT EXISTS updated_by INTEGER,
        ADD COLUMN IF NOT EXISTS deleted_by INTEGER;
      `;
      
      console.log('Successfully added missing columns to users table!');
    } else {
      console.log('created_by column already exists in users table.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

console.log('Starting migration to add missing columns to users table...');
createMissingColumns()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 