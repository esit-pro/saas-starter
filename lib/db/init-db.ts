import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';


async function main() {
  // First connect as postgres user to create the database and user
  // Load environment variables
  
  // Use default admin connection if POSTGRES_ADMIN_URL is not defined
  const adminUrl = process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:54322/postgres';
  const adminClient = postgres(adminUrl);

  try {
    // Create the database if it doesn't exist
    console.log('Creating database if it doesn\'t exist...');
    await adminClient.unsafe(`
      CREATE DATABASE esit_service_db;
    `).catch(e => {
      // Ignore errors if database already exists
      if (e.code !== '42P04') throw e;
      console.log('Database already exists');
    });

    // Create the user if it doesn't exist
    console.log('Creating user if it doesn\'t exist...');
    await adminClient.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'esitdev') THEN
          CREATE USER esitdev WITH PASSWORD '21c2692af7b8b48f33bb3ba6c4b1ea8a';
        END IF;
      END
      $$;
    `);

    // Grant privileges
    console.log('Granting privileges...');
    await adminClient.unsafe(`
      GRANT ALL PRIVILEGES ON DATABASE esit_service_db TO esitdev;
      ALTER DATABASE esit_service_db OWNER TO esitdev;
    `);

    console.log('Initial database setup completed.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await adminClient.end();
  }

  // Now connect as the application user to create the tables
  const appUrl = 'postgres://esitdev:21c2692af7b8b48f33bb3ba6c4b1ea8a@localhost:54322/esit_service_db';
  const appClient = postgres(appUrl);
  const db = drizzle(appClient);

  try {
    // Check and connect to the database
    console.log('Connecting to the database as esitdev user...');
    await appClient.unsafe('SELECT 1');
    console.log('Connected successfully, now creating tables...');

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100),
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'member',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp
      );
    `);
    console.log('Created users table');

    // Create teams table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "stripe_customer_id" text UNIQUE,
        "stripe_subscription_id" text UNIQUE,
        "stripe_product_id" text,
        "plan_name" varchar(50),
        "subscription_status" varchar(20)
      );
    `);
    console.log('Created teams table');

    // Create team_members table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "team_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "role" varchar(50) NOT NULL,
        "joined_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created team_members table');

    // Create activity_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "user_id" integer REFERENCES "users"("id"),
        "action" text NOT NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        "ip_address" varchar(45)
      );
    `);
    console.log('Created activity_logs table');

    // Create invitations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "invitations" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "email" varchar(255) NOT NULL,
        "role" varchar(50) NOT NULL,
        "invited_by" integer NOT NULL REFERENCES "users"("id"),
        "invited_at" timestamp NOT NULL DEFAULT now(),
        "status" varchar(20) NOT NULL DEFAULT 'pending'
      );
    `);
    console.log('Created invitations table');

    // Create clients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "name" varchar(100) NOT NULL,
        "contact_name" varchar(100),
        "email" varchar(255),
        "phone" varchar(20),
        "address" text,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created clients table');

    // Create service_tickets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "service_tickets" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL REFERENCES "teams"("id"),
        "client_id" integer NOT NULL REFERENCES "clients"("id"),
        "assigned_to" integer REFERENCES "users"("id"),
        "title" varchar(200) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'open',
        "priority" varchar(20) NOT NULL DEFAULT 'medium',
        "category" varchar(50),
        "due_date" timestamp,
        "created_by" integer NOT NULL REFERENCES "users"("id"),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "closed_at" timestamp,
        "metadata" json
      );
    `);
    console.log('Created service_tickets table');

    // Create ticket_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "ticket_comments" (
        "id" serial PRIMARY KEY NOT NULL,
        "ticket_id" integer NOT NULL REFERENCES "service_tickets"("id"),
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "content" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created ticket_comments table');

    // Create time_entries table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "time_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "ticket_id" integer REFERENCES "service_tickets"("id"),
        "client_id" integer NOT NULL REFERENCES "clients"("id"),
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "description" text NOT NULL,
        "start_time" timestamp NOT NULL,
        "end_time" timestamp,
        "duration" integer NOT NULL,
        "billable" boolean NOT NULL DEFAULT true,
        "billed" boolean NOT NULL DEFAULT false,
        "billable_rate" numeric(10, 2),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created time_entries table');

    // Create expenses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" serial PRIMARY KEY NOT NULL,
        "ticket_id" integer REFERENCES "service_tickets"("id"),
        "client_id" integer NOT NULL REFERENCES "clients"("id"),
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "description" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "date" timestamp NOT NULL,
        "receipt_url" text,
        "billable" boolean NOT NULL DEFAULT true,
        "billed" boolean NOT NULL DEFAULT false,
        "category" varchar(50),
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('Created expenses table');

    // Insert a test team and client for development
    try {
      console.log('Creating test data...');
      
      // Check if test team exists
      const testTeam = await db.execute(sql`SELECT id FROM teams WHERE name = 'Test Team' LIMIT 1`);
      
      let teamId;
      
      // Type assertion for rows property
      const testTeamRows = (testTeam as unknown as { rows: Array<{ id: number }> }).rows;
      
      if (testTeamRows.length === 0) {
        // Create test team
        const newTeam = await db.execute(sql`
          INSERT INTO teams (name, created_at, updated_at)
          VALUES ('Test Team', now(), now())
          RETURNING id
        `);
        
        // Type assertion for newTeam rows
        const newTeamRows = (newTeam as unknown as { rows: Array<{ id: number }> }).rows;
        teamId = newTeamRows[0].id;
        console.log('Created test team with ID:', teamId);
      } else {
        teamId = testTeamRows[0].id;
        console.log('Using existing test team with ID:', teamId);
      }
      
      // Create test client
      await db.execute(sql`
        INSERT INTO clients (
          team_id, name, contact_name, email, phone, 
          address, notes, is_active, created_at, updated_at
        )
        VALUES (
          ${teamId}, 'Acme Corporation', 'John Doe', 'contact@acme.com', 
          '555-123-4567', '123 Main St', 'Test client', true, now(), now()
        )
        ON CONFLICT DO NOTHING
      `);
      
      console.log('Test data created or already exists');
    } catch (error) {
      console.error('Error creating test data:', error);
    }

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await appClient.end();
  }
}

main().catch(console.error);