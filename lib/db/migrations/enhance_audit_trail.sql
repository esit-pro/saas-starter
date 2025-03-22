-- Enhance activity_logs table for comprehensive audit trail

DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Add actionCategory column to categorize different types of actions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'action_category'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding action_category to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "action_category" varchar(50);
        
        -- Create index on action_category for faster filtering
        CREATE INDEX idx_activity_logs_action_category 
            ON activity_logs(action_category);
    END IF;
    
    -- Add status column for tracking success/failure of operations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding status to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "status" varchar(20);
    END IF;
    
    -- Add server_action column to record which server action was called
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'server_action'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding server_action to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "server_action" varchar(100);
    END IF;
    
    -- Add duration column to track how long operations took
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'duration_ms'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding duration_ms to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "duration_ms" integer;
    END IF;
    
    -- Add user_agent column for tracking browser/client info
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'user_agent'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding user_agent to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "user_agent" text;
    END IF;
    
    -- Add route column for tracking which page/route the action was performed on
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'route'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding route to activity_logs table...';
        ALTER TABLE "activity_logs" ADD COLUMN "route" varchar(255);
    END IF;
    
    -- Create indexes to improve query performance
    -- Note: Some of these might already exist
    
    -- Create index on userId for quick user activity lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'activity_logs' AND indexname = 'idx_activity_logs_user_id'
    ) THEN
        CREATE INDEX idx_activity_logs_user_id 
            ON activity_logs(user_id);
    END IF;
    
    -- Create index on teamId for team activity lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'activity_logs' AND indexname = 'idx_activity_logs_team_id'
    ) THEN
        CREATE INDEX idx_activity_logs_team_id 
            ON activity_logs(team_id);
    END IF;
    
    -- Create index on action for filtering by action type
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'activity_logs' AND indexname = 'idx_activity_logs_action'
    ) THEN
        CREATE INDEX idx_activity_logs_action 
            ON activity_logs(action);
    END IF;
    
    -- Create index on timestamp for time-based queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'activity_logs' AND indexname = 'idx_activity_logs_timestamp'
    ) THEN
        CREATE INDEX idx_activity_logs_timestamp 
            ON activity_logs(timestamp);
    END IF;
    
    -- Create index on entity type and id for entity-specific queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'activity_logs' AND indexname = 'idx_activity_logs_entity'
    ) THEN
        CREATE INDEX idx_activity_logs_entity 
            ON activity_logs(entity_type, entity_id);
    END IF;
    
    RAISE NOTICE 'Activity logs table enhancement complete';
END
$$; 