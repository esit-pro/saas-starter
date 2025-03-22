-- Add updated_by column to service_tickets
ALTER TABLE "service_tickets" ADD COLUMN "updated_by" integer;
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action; 