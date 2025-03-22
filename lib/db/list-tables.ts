import { sql } from 'drizzle-orm';
import { db } from './drizzle';

async function main() {
  try {
    console.log('Listing all tables in the database...');
    
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Type assertion for result
    const rows = (result as any).rows || [];
    
    console.log('Tables:');
    for (const row of rows) {
      console.log(row.table_name);
    }
    
    console.log('\nChecking audit fields for all tables...');
    
    for (const row of rows) {
      const tableName = row.table_name;
      const columnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        AND column_name IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
        ORDER BY column_name
      `);
      
      console.log(`\nTable: ${tableName}`);
      console.log('Audit fields:');
      const auditFields = ((columnsResult as any).rows || []).map((r: any) => r.column_name);
      console.log(auditFields);
      
      // Check which fields are missing
      const requiredFields = ['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];
      const missingFields = requiredFields.filter(field => !auditFields.includes(field));
      
      if (missingFields.length > 0) {
        console.log('Missing audit fields:', missingFields);
      } else {
        console.log('All audit fields present');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main(); 