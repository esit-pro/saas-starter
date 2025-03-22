-- Migration to add missing audit fields to all tables
-- Fields: created_at, updated_at, deleted_at, created_by, updated_by, deleted_by

DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('__drizzle_migrations')
    LOOP
        RAISE NOTICE 'Processing table %', table_record.table_name;

        -- Check and add created_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'created_at') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "created_at" timestamp NOT NULL DEFAULT now()', 
                         table_record.table_name);
            RAISE NOTICE 'Added created_at to %', table_record.table_name;
        END IF;

        -- Check and add updated_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'updated_at') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now()', 
                         table_record.table_name);
            RAISE NOTICE 'Added updated_at to %', table_record.table_name;
        END IF;

        -- Check and add deleted_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'deleted_at') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "deleted_at" timestamp', 
                         table_record.table_name);
            RAISE NOTICE 'Added deleted_at to %', table_record.table_name;
        END IF;

        -- Check and add created_by if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'created_by') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "created_by" integer', 
                         table_record.table_name);
            RAISE NOTICE 'Added created_by to %', table_record.table_name;
            
            -- Add foreign key constraint if users table exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                EXECUTE format('ALTER TABLE "%s" ADD CONSTRAINT "%s_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action', 
                             table_record.table_name, table_record.table_name);
                RAISE NOTICE 'Added created_by foreign key to %', table_record.table_name;
            END IF;
        END IF;

        -- Check and add updated_by if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'updated_by') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "updated_by" integer', 
                         table_record.table_name);
            RAISE NOTICE 'Added updated_by to %', table_record.table_name;
            
            -- Add foreign key constraint if users table exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                EXECUTE format('ALTER TABLE "%s" ADD CONSTRAINT "%s_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action', 
                             table_record.table_name, table_record.table_name);
                RAISE NOTICE 'Added updated_by foreign key to %', table_record.table_name;
            END IF;
        END IF;

        -- Check and add deleted_by if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_record.table_name AND column_name = 'deleted_by') THEN
            EXECUTE format('ALTER TABLE "%s" ADD COLUMN "deleted_by" integer', 
                         table_record.table_name);
            RAISE NOTICE 'Added deleted_by to %', table_record.table_name;
            
            -- Add foreign key constraint if users table exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                EXECUTE format('ALTER TABLE "%s" ADD CONSTRAINT "%s_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action', 
                             table_record.table_name, table_record.table_name);
                RAISE NOTICE 'Added deleted_by foreign key to %', table_record.table_name;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All tables processed successfully';
END $$; 