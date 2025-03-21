import { sql } from 'drizzle-orm';
import { db } from '../drizzle';

async function addTeamIdToTimeEntries() {
  console.log('Starting migration: Adding teamId to time_entries table');
  
  try {
    // First check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'team_id'
    `);
    
    // Correctly handle the result structure
    const columnExists = result && Array.isArray(result) 
      ? result.length > 0
      : result?.rows && result.rows.length > 0;
    
    if (!columnExists) {
      // Column doesn't exist, so add it
      console.log('Adding team_id column to time_entries table');
      
      // Add the column
      await db.execute(sql`
        ALTER TABLE time_entries 
        ADD COLUMN team_id INTEGER REFERENCES teams(id)
      `);
      
      // Update existing entries to use the team_id from their client
      console.log('Updating existing time entries with team_id from their client');
      await db.execute(sql`
        UPDATE time_entries
        SET team_id = clients.team_id
        FROM clients
        WHERE time_entries.client_id = clients.id
      `);
      
      // Make the column NOT NULL after updating
      console.log('Setting team_id column to NOT NULL');
      await db.execute(sql`
        ALTER TABLE time_entries 
        ALTER COLUMN team_id SET NOT NULL
      `);
      
      console.log('Migration completed successfully');
    } else {
      console.log('Column team_id already exists on time_entries table. Skipping migration.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addTeamIdToTimeEntries()
    .then(() => {
      console.log('Migration completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addTeamIdToTimeEntries }; 