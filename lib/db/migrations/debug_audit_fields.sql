-- Debug version of fix_audit_fields.sql
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check and add updated_by to clients table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'updated_by'
    ) INTO column_exists;
    
    RAISE NOTICE 'clients.updated_by exists: %', column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding updated_by to clients table...';
        ALTER TABLE "clients" ADD COLUMN "updated_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_updated_by_users_id_fk" 
            FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        RAISE NOTICE 'Added updated_by to clients table';
    END IF;
    
    -- Check and add deleted_by to clients table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'deleted_by'
    ) INTO column_exists;
    
    RAISE NOTICE 'clients.deleted_by exists: %', column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding deleted_by to clients table...';
        ALTER TABLE "clients" ADD COLUMN "deleted_by" integer;
        ALTER TABLE "clients" ADD CONSTRAINT "clients_deleted_by_users_id_fk" 
            FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        RAISE NOTICE 'Added deleted_by to clients table';
    END IF;
END
$$; 