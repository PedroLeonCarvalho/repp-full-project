CREATE TYPE "public"."music_genre" AS ENUM('ROCK', 'MPB', 'JAZZ', 'BOSSA_NOVA', 'SAMBA', 'BLUES', 'POP_INTERNATIONAL', 'POP_BRAZILIAN', 'AXE', 'SERTANEJO', 'FORRO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."musical_key" AS ENUM('C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb', 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm');--> statement-breakpoint
CREATE TABLE "musics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"lyrics" text,
	"original_key" "musical_key",
	"preferred_key" "musical_key",
	"skill_level" boolean DEFAULT false NOT NULL,
	"genre" "music_genre",
	"note" text,
	"spotify_link" text,
	"sheet_music_file" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "musics_customer_title_artist_unique" UNIQUE("customer_id","title","artist")
);
--> statement-breakpoint
CREATE TABLE "project_musics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"music_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_musics_project_music_unique" UNIQUE("project_id","music_id")
);
--> statement-breakpoint
ALTER TABLE "project_musics" ADD CONSTRAINT "project_musics_music_id_musics_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."musics"("id") ON DELETE cascade ON UPDATE no action;