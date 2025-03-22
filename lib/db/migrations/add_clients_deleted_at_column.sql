-- Add deleted_at column to the clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp; 