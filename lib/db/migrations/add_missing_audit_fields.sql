-- Add missing audit fields to tables that need them
-- This ensures all tables have proper audit trails for user actions and soft deletions

DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Invoice Tickets table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_tickets' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing audit fields to invoice_tickets table...';
        ALTER TABLE "invoice_tickets" ADD COLUMN "created_by" integer;
        ALTER TABLE "invoice_tickets" ADD COLUMN "updated_by" integer;
        ALTER TABLE "invoice_tickets" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "invoice_tickets" ADD COLUMN "team_id" integer NOT NULL DEFAULT 1;
        ALTER TABLE "invoice_tickets" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "invoice_tickets" ADD COLUMN "deleted_at" timestamp;
        
        -- Add foreign key constraints
        ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
            
        -- Remove default after adding data
        ALTER TABLE "invoice_tickets" ALTER COLUMN "team_id" DROP DEFAULT;
    END IF;
    
    -- Team Members table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_members' AND column_name = 'created_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing audit fields to team_members table...';
        ALTER TABLE "team_members" ADD COLUMN "created_by" integer;
        ALTER TABLE "team_members" ADD COLUMN "updated_by" integer;
        ALTER TABLE "team_members" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "team_members" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "team_members" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "team_members" ADD COLUMN "deleted_at" timestamp;
        
        -- Add foreign key constraints
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- Verification Codes table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_codes' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing audit fields to verification_codes table...';
        ALTER TABLE "verification_codes" ADD COLUMN "created_by" integer;
        ALTER TABLE "verification_codes" ADD COLUMN "updated_by" integer;
        ALTER TABLE "verification_codes" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "verification_codes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "verification_codes" ADD COLUMN "deleted_at" timestamp;
        
        -- Add foreign key constraints
        ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
    
    -- Invitations table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing audit fields to invitations table...';
        ALTER TABLE "invitations" ADD COLUMN "created_by" integer;
        ALTER TABLE "invitations" ADD COLUMN "updated_by" integer;
        ALTER TABLE "invitations" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "invitations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "invitations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
        ALTER TABLE "invitations" ADD COLUMN "deleted_at" timestamp;
        
        -- Add foreign key constraints
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        
        -- Set created_by to match invited_by for existing records
        UPDATE "invitations" SET "created_by" = "invited_by" WHERE "created_by" IS NULL;
    END IF;
    
    -- Users table 
    -- (Already has createdAt, updatedAt, deletedAt but adding user reference fields)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing audit fields to users table...';
        ALTER TABLE "users" ADD COLUMN "created_by" integer;
        ALTER TABLE "users" ADD COLUMN "updated_by" integer;
        ALTER TABLE "users" ADD COLUMN "deleted_by" integer;
        
        -- Add self-referencing foreign key constraints
        ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" 
            FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END
$$;
