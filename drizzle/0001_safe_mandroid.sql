CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"stage_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"cpf" text,
	"phone" text,
	"instagram" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "musics" ALTER COLUMN "customer_id" SET DATA TYPE uuid USING customer_id::uuid;--> statement-breakpoint
ALTER TABLE "musics" ALTER COLUMN "skill_level" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "musics" ADD CONSTRAINT "musics_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;