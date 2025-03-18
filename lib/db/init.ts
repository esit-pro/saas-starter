import { sql } from 'drizzle-orm';
import { db } from './drizzle';

async function main() {
  console.log('Creating database tables from scratch...');

  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE "users" (
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
      CREATE TABLE "teams" (
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
      CREATE TABLE "team_members" (
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
      CREATE TABLE "activity_logs" (
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
      CREATE TABLE "invitations" (
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
      CREATE TABLE "clients" (
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
      CREATE TABLE "service_tickets" (
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
      CREATE TABLE "ticket_comments" (
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
      CREATE TABLE "time_entries" (
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
      CREATE TABLE "expenses" (
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

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

main();