-- Add deleted_at column to clients table
DO $$
BEGIN
    -- Check if the column exists first to avoid errors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'clients' AND column_name = 'deleted_at') THEN
        ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp;
        RAISE NOTICE 'Added deleted_at column to clients table';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists in clients table';
    END IF;
END $$; 