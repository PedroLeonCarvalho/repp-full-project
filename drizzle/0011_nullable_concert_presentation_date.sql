ALTER TABLE "concerts" ALTER COLUMN "presentation_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "concerts" ALTER COLUMN "presentation_date" DROP DEFAULT;
