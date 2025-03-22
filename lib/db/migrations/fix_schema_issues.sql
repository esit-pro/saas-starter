-- Fix missing column issue in clients table
-- Migration to align the database schema with the application code

-- Check if the column exists before attempting to alter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'created_by'
    ) THEN
        -- Add the created_by column
        ALTER TABLE "clients" ADD COLUMN "created_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") 
            ON DELETE no action ON UPDATE no action;
    END IF;

    -- Fix service_tickets deleted_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_tickets' AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE "service_tickets" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") 
            ON DELETE no action ON UPDATE no action;
    END IF;

    -- Fix activity_logs entity_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'entity_id'
    ) THEN
        ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;
        ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);
    END IF;
END
$$; 