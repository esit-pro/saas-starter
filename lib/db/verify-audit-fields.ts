import { sql } from 'drizzle-orm';
import { db } from './drizzle';

async function main() {
  try {
    console.log('Database connection info:');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Test database connection
    try {
      const testResult = await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection test:', (testResult as any).rows[0]);
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
    
    console.log('Listing all tables in the database...');
    
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('__drizzle_migrations')
      ORDER BY table_name
    `);
    
    // Type assertion for result
    const rows = (result as any).rows;
    
    if (!rows || rows.length === 0) {
      console.log('No tables found in the database');
      process.exit(0);
    }
    
    console.log(`Tables found: ${rows.length}`);
    for (const row of rows) {
      console.log(`- ${row.table_name}`);
    }
    
    console.log('\nChecking audit fields for all tables...');
    
    for (const row of rows) {
      const tableName = row.table_name;
      console.log(`\nChecking table: ${tableName}`);
      const columnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        AND column_name IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
        ORDER BY column_name
      `);
      
      // Type assertion for columnsResult
      const columnRows = (columnsResult as any).rows;
      
      if (!columnRows) {
        console.log(`No columns found for table ${tableName}`);
        continue;
      }
      
      console.log(`Table: ${tableName}`);
      console.log('Audit fields:');
      const auditFields = columnRows.map((r: any) => r.column_name);
      console.log(auditFields);
      
      // Check which fields are missing
      const requiredFields = ['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];
      const missingFields = requiredFields.filter(field => !auditFields.includes(field));
      
      if (missingFields.length > 0) {
        console.log('MISSING audit fields:', missingFields);
      } else {
        console.log('✅ All audit fields present');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main(); 