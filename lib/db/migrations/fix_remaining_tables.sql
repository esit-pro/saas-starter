-- Fix audit fields for remaining tables

DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Ticket Comments table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_comments' AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding created_by to ticket_comments table...';
        ALTER TABLE "ticket_comments" ADD COLUMN "created_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_comments' AND column_name = 'updated_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding updated_by to ticket_comments table...';
        ALTER TABLE "ticket_comments" ADD COLUMN "updated_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_comments' AND column_name = 'deleted_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding deleted_by to ticket_comments table...';
        ALTER TABLE "ticket_comments" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_comments' AND column_name = 'team_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding team_id to ticket_comments table...';
        ALTER TABLE "ticket_comments" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "ticket_comments" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Time Entries table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding created_by to time_entries table...';
        ALTER TABLE "time_entries" ADD COLUMN "created_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'updated_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding updated_by to time_entries table...';
        ALTER TABLE "time_entries" ADD COLUMN "updated_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'deleted_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding deleted_by to time_entries table...';
        ALTER TABLE "time_entries" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' AND column_name = 'team_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding team_id to time_entries table...';
        ALTER TABLE "time_entries" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "time_entries" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Expenses table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding created_by to expenses table...';
        ALTER TABLE "expenses" ADD COLUMN "created_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'updated_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding updated_by to expenses table...';
        ALTER TABLE "expenses" ADD COLUMN "updated_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'deleted_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding deleted_by to expenses table...';
        ALTER TABLE "expenses" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'team_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding team_id to expenses table...';
        ALTER TABLE "expenses" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "expenses" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Activity Logs table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'entity_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding entity tracking fields to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;
        ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);
        ALTER TABLE "activity_logs" ADD COLUMN "details" json;
    END IF;
END
$$; 