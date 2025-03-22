CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(20) NOT NULL,
	"time_entry_id" integer,
	"expense_id" integer,
	"ticket_id" integer,
	"taxable" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"team_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoice_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"ticket_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"client_id" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"notes" text,
	"terms" text,
	"paid_date" timestamp,
	"paid_amount" numeric(10, 2),
	"paid_method" varchar(50),
	"sent_at" timestamp,
	"voided_at" timestamp,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"team_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ticket_comments" DROP CONSTRAINT "ticket_comments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "contact_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "contact_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "phone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "receipt_url" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "category" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "service_tickets" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "service_tickets" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "service_tickets" ALTER COLUMN "priority" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "service_tickets" ALTER COLUMN "category" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "service_tickets" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "billable_rate" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_id" integer;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "details" json;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "receipt" json;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "attachments" json;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_ticket_id_service_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."service_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tickets" ADD CONSTRAINT "invoice_tickets_ticket_id_service_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."service_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "date";--> statement-breakpoint
ALTER TABLE "service_tickets" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "ticket_comments" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "end_time";