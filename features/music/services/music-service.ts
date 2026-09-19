import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerMusics } from "@/db/schema/customer-musics";
import { musicCatalog } from "@/db/schema/music-catalog";
import { findOrCreateCatalogEntry } from "./music-catalog-service";
import type {
  CreateMusicInput,
  Music,
  MusicFilter,
  MusicGenre,
  UpdateMusicInput,
} from "../types";
import {
  createMusicSchema,
  updateMusicSchema,
} from "../schemas/music-schema";

export class MusicServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "DUPLICATE_MUSIC" | "NOT_FOUND" | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "MusicServiceError";
  }
}

/**
 * Build a merged Music object from a joined row of customer_musics + music_catalog.
 * Customer-level lyrics/chords take priority (Option B).
 */
function mergeRow(row: {
  cm: typeof customerMusics.$inferSelect;
  mc: typeof musicCatalog.$inferSelect;
}): Music {
  const genresList: MusicGenre[] =
    row.cm.genres && row.cm.genres.length > 0
      ? (row.cm.genres as MusicGenre[])
      : row.cm.genre
      ? [row.cm.genre]
      : [];

  return {
    id: row.cm.id,
    musicCatalogId: row.cm.musicCatalogId,
    customerId: row.cm.customerId,
    title: row.mc.title,
    artist: row.mc.artist,
    lyrics: row.cm.lyrics ?? row.mc.canonicalLyrics,
    chords: row.cm.chords ?? row.mc.canonicalChords,
    originalKey: row.cm.originalKey,
    preferredKey: row.cm.preferredKey,
    studying: row.cm.studying,
    genre: row.cm.genre ?? (genresList[0] || null),
    genres: genresList,
    note: row.cm.note,
    spotifyLink: row.cm.spotifyLink,
    sheetMusicFile: row.cm.sheetMusicFile,
    createdAt: row.cm.createdAt,
    updatedAt: row.cm.updatedAt,
  };
}

export async function createMusic(
  input: CreateMusicInput,
  customerId: string
): Promise<Music> {
  const validated = createMusicSchema.parse(input);

  // 1. Find or create canonical catalog entry
  const catalogEntry = await findOrCreateCatalogEntry(
    validated.title,
    validated.artist,
    validated.lyrics,
    validated.chords,
    validated.isCustom ?? false
  );

  // 2. Check for duplicate customer music pointing to same catalog entry
  const [existing] = await db
    .select()
    .from(customerMusics)
    .where(
      and(
        eq(customerMusics.customerId, customerId),
        eq(customerMusics.musicCatalogId, catalogEntry.id)
      )
    )
    .limit(1);

  if (existing) {
    throw new MusicServiceError(
      `A música "${catalogEntry.title}" do artista "${catalogEntry.artist}" já está cadastrada no seu acervo.`,
      "DUPLICATE_MUSIC"
    );
  }

  const genresToSave: MusicGenre[] =
    validated.genres && validated.genres.length > 0
      ? validated.genres
      : validated.genre
      ? [validated.genre]
      : [];

  const primaryGenre = genresToSave[0] || validated.genre || null;

  // 3. Insert customer music record
  const [created] = await db
    .insert(customerMusics)
    .values({
      customerId,
      musicCatalogId: catalogEntry.id,
      lyrics: validated.lyrics || null,
      chords: validated.chords || null,
      originalKey: validated.originalKey || null,
      preferredKey: validated.preferredKey || null,
      studying: validated.studying ?? false,
      genre: primaryGenre,
      genres: genresToSave.length > 0 ? genresToSave : null,
      note: validated.note || null,
      spotifyLink: validated.spotifyLink || null,
      sheetMusicFile: validated.sheetMusicFile || null,
    })
    .returning();

  return mergeRow({ cm: created, mc: catalogEntry });
}

export async function updateMusic(
  id: string,
  input: Omit<UpdateMusicInput, "id">,
  customerId: string
): Promise<Music> {
  const validated = updateMusicSchema.parse({ ...input, id });

  // Verify ownership
  const [current] = await db
    .select()
    .from(customerMusics)
    .where(and(eq(customerMusics.id, id), eq(customerMusics.customerId, customerId)))
    .limit(1);

  if (!current) {
    throw new MusicServiceError(
      "Música não encontrada no seu acervo.",
      "NOT_FOUND"
    );
  }

  let genresUpdate: { genre?: MusicGenre | null; genres?: string[] | null } = {};
  if (validated.genres !== undefined) {
    const gList = validated.genres || [];
    genresUpdate = {
      genres: gList.length > 0 ? gList : null,
      genre: gList[0] || null,
    };
  } else if (validated.genre !== undefined) {
    genresUpdate = {
      genre: validated.genre,
      genres: validated.genre ? [validated.genre] : null,
    };
  }

  // Update only personal fields (title/artist are immutable)
  const [updated] = await db
    .update(customerMusics)
    .set({
      ...(validated.lyrics !== undefined ? { lyrics: validated.lyrics } : {}),
      ...(validated.chords !== undefined ? { chords: validated.chords } : {}),
      ...(validated.originalKey !== undefined ? { originalKey: validated.originalKey } : {}),
      ...(validated.preferredKey !== undefined ? { preferredKey: validated.preferredKey } : {}),
      ...(validated.studying !== undefined ? { studying: validated.studying } : {}),
      ...genresUpdate,
      ...(validated.note !== undefined ? { note: validated.note } : {}),
      ...(validated.spotifyLink !== undefined ? { spotifyLink: validated.spotifyLink } : {}),
      ...(validated.sheetMusicFile !== undefined ? { sheetMusicFile: validated.sheetMusicFile } : {}),
    })
    .where(and(eq(customerMusics.id, id), eq(customerMusics.customerId, customerId)))
    .returning();

  // Fetch catalog data to merge
  const [catalog] = await db
    .select()
    .from(musicCatalog)
    .where(eq(musicCatalog.id, updated.musicCatalogId))
    .limit(1);

  return mergeRow({ cm: updated, mc: catalog });
}

export async function deleteMusic(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const result = await db
    .delete(customerMusics)
    .where(and(eq(customerMusics.id, id), eq(customerMusics.customerId, customerId)))
    .returning({ id: customerMusics.id });

  if (result.length === 0) {
    throw new MusicServiceError(
      "Música não encontrada para exclusão.",
      "NOT_FOUND"
    );
  }

  return { success: true };
}

export async function getMusicById(
  id: string,
  customerId: string
): Promise<Music | null> {
  const rows = await db
    .select({
      cm: customerMusics,
      mc: musicCatalog,
    })
    .from(customerMusics)
    .innerJoin(musicCatalog, eq(customerMusics.musicCatalogId, musicCatalog.id))
    .where(
      and(
        eq(customerMusics.id, id),
        eq(customerMusics.customerId, customerId)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  return mergeRow(rows[0]);
}

export async function listMusics(
  customerId: string,
  filters?: MusicFilter
): Promise<Music[]> {
  const conditions = [eq(customerMusics.customerId, customerId)];

  if (filters?.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(musicCatalog.title, term),
        ilike(musicCatalog.artist, term)
      )!
    );
  }

  if (filters?.genre) {
    conditions.push(
      or(
        eq(customerMusics.genre, filters.genre),
        sql`${filters.genre} = ANY(${customerMusics.genres})`
      )!
    );
  }

  if (filters?.originalKey) {
    conditions.push(eq(customerMusics.originalKey, filters.originalKey));
  }

  if (filters?.preferredKey) {
    conditions.push(eq(customerMusics.preferredKey, filters.preferredKey));
  }

  if (filters?.studying !== undefined) {
    conditions.push(eq(customerMusics.studying, filters.studying));
  }

  if (filters?.artist && filters.artist.trim().length > 0) {
    conditions.push(ilike(musicCatalog.artist, `%${filters.artist.trim()}%`));
  }

  const rows = await db
    .select({
      cm: customerMusics,
      mc: musicCatalog,
    })
    .from(customerMusics)
    .innerJoin(musicCatalog, eq(customerMusics.musicCatalogId, musicCatalog.id))
    .where(and(...conditions))
    .orderBy(asc(musicCatalog.title));

  return rows.map(mergeRow);
}
