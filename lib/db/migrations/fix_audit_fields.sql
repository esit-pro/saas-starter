-- Comprehensive fix for audit fields across all tables
-- Adding created_by, updated_by, deleted_by to track user actions

DO $$
BEGIN
    -- Clients table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE "clients" ADD COLUMN "created_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_by') THEN
        ALTER TABLE "clients" ADD COLUMN "updated_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_by') THEN
        ALTER TABLE "clients" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- Service Tickets table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'created_by') THEN
        ALTER TABLE "service_tickets" ADD COLUMN "created_by" integer;
        ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'updated_by') THEN
        ALTER TABLE "service_tickets" ADD COLUMN "updated_by" integer;
        ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'deleted_by') THEN
        ALTER TABLE "service_tickets" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- Ticket Comments table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_comments' AND column_name = 'created_by') THEN
        ALTER TABLE "ticket_comments" ADD COLUMN "created_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_comments' AND column_name = 'updated_by') THEN
        ALTER TABLE "ticket_comments" ADD COLUMN "updated_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_comments' AND column_name = 'deleted_by') THEN
        ALTER TABLE "ticket_comments" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ticket_comments' AND column_name = 'team_id') THEN
        ALTER TABLE "ticket_comments" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        
        -- After adding with default, update constraint to remove default
        ALTER TABLE "ticket_comments" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Time Entries table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'created_by') THEN
        ALTER TABLE "time_entries" ADD COLUMN "created_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'updated_by') THEN
        ALTER TABLE "time_entries" ADD COLUMN "updated_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'deleted_by') THEN
        ALTER TABLE "time_entries" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'team_id') THEN
        ALTER TABLE "time_entries" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        
        -- After adding with default, update constraint to remove default
        ALTER TABLE "time_entries" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Expenses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'created_by') THEN
        ALTER TABLE "expenses" ADD COLUMN "created_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'updated_by') THEN
        ALTER TABLE "expenses" ADD COLUMN "updated_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'deleted_by') THEN
        ALTER TABLE "expenses" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'team_id') THEN
        ALTER TABLE "expenses" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
        
        -- After adding with default, update constraint to remove default
        ALTER TABLE "expenses" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Invoices table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
        ALTER TABLE "invoices" ADD COLUMN "created_by" integer;
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updated_by') THEN
        ALTER TABLE "invoices" ADD COLUMN "updated_by" integer;
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'deleted_by') THEN
        ALTER TABLE "invoices" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- Activity Logs table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'entity_id') THEN
        ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;
        ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);
        ALTER TABLE "activity_logs" ADD COLUMN "details" json;
    END IF;
END
$$; 