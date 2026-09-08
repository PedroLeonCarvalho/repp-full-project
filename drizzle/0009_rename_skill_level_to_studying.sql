ALTER TABLE "customer_musics" RENAME COLUMN "skill_level" TO "studying";--> statement-breakpoint
ALTER TABLE "customer_musics" ALTER COLUMN "studying" SET DEFAULT false;
