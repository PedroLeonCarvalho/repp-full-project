import { or, ilike, asc, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { musicCatalog } from "@/db/schema/music-catalog";
import type { MusicCatalogEntry, MusicCatalogFull } from "../types";

/**
 * Search the global music catalog by title or artist.
 * Used for autocomplete — requires at least 4 characters.
 * Returns up to 10 results ordered by title.
 */
export async function searchCatalog(query: string): Promise<MusicCatalogEntry[]> {
  const term = `%${query.trim()}%`;

  return db
    .select({
      id: musicCatalog.id,
      title: musicCatalog.title,
      artist: musicCatalog.artist,
    })
    .from(musicCatalog)
    .where(
      or(
        ilike(musicCatalog.title, term),
        ilike(musicCatalog.artist, term)
      )
    )
    .orderBy(asc(musicCatalog.title))
    .limit(10);
}

/**
 * Find or create a catalog entry by title + artist (case-insensitive match).
 * Returns the existing or newly created full catalog record.
 */
export async function findOrCreateCatalogEntry(
  title: string,
  artist: string,
  lyrics?: string | null,
  chords?: string | null
): Promise<MusicCatalogFull> {
  const normalizedTitle = title.trim();
  const normalizedArtist = artist.trim();

  // Try to find existing entry (case-insensitive)
  const [found] = await db
    .select()
    .from(musicCatalog)
    .where(
      and(
        sql`lower(${musicCatalog.title}) = lower(${normalizedTitle})`,
        sql`lower(${musicCatalog.artist}) = lower(${normalizedArtist})`
      )
    )
    .limit(1);

  if (found) {
    return found;
  }

  // Create new catalog entry; handle race condition with onConflictDoNothing
  const [created] = await db
    .insert(musicCatalog)
    .values({
      title: normalizedTitle,
      artist: normalizedArtist,
      lyrics: lyrics || null,
      chords: chords || null,
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  // Race condition: another process inserted the same entry — fetch it
  const [afterConflict] = await db
    .select()
    .from(musicCatalog)
    .where(
      and(
        sql`lower(${musicCatalog.title}) = lower(${normalizedTitle})`,
        sql`lower(${musicCatalog.artist}) = lower(${normalizedArtist})`
      )
    )
    .limit(1);

  if (!afterConflict) {
    throw new Error(
      `Erro ao registrar música no catálogo: "${normalizedTitle}" — "${normalizedArtist}".`
    );
  }

  return afterConflict;
}
