ALTER TABLE "activity_logs" ADD COLUMN "action_category" varchar(50);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "status" varchar(20);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "server_action" varchar(100);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "route" varchar(255);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;