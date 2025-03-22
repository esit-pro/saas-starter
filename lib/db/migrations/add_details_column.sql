-- Add missing details column to activity_logs table

DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Add details JSON column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'details'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding details column to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "details" json;
    END IF;
END
$$; 