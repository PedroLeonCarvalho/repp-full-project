import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerMusics } from "@/db/schema/customer-musics";
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
  type UpdateMusicSchemaInput,
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

const UNIQUE_VIOLATION = "23505";

function duplicateMessage(title: string, artist: string): string {
  return `A música "${title}" do artista "${artist}" já está cadastrada no seu acervo.`;
}

function toMusic(row: typeof customerMusics.$inferSelect): Music {
  const genresList: MusicGenre[] =
    row.genres && row.genres.length > 0
      ? (row.genres as MusicGenre[])
      : row.genre
      ? [row.genre]
      : [];

  return {
    id: row.id,
    customerId: row.customerId,
    title: row.title,
    artist: row.artist,
    lyrics: row.lyrics,
    chords: row.chords,
    originalKey: row.originalKey,
    preferredKey: row.preferredKey,
    studying: row.studying,
    genre: row.genre ?? (genresList[0] || null),
    genres: genresList,
    note: row.note,
    spotifyLink: row.spotifyLink,
    sheetMusicFile: row.sheetMusicFile,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findDuplicate(customerId: string, title: string, artist: string) {
  const [existing] = await db
    .select({ id: customerMusics.id })
    .from(customerMusics)
    .where(
      and(
        eq(customerMusics.customerId, customerId),
        sql`lower(${customerMusics.title}) = lower(${title})`,
        sql`lower(${customerMusics.artist}) = lower(${artist})`
      )
    )
    .limit(1);
  return existing ?? null;
}

export async function createMusic(
  input: CreateMusicInput,
  customerId: string
): Promise<Music> {
  const validated = createMusicSchema.parse(input);

  if (await findDuplicate(customerId, validated.title, validated.artist)) {
    throw new MusicServiceError(
      duplicateMessage(validated.title, validated.artist),
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

  try {
    const [created] = await db
      .insert(customerMusics)
      .values({
        customerId,
        title: validated.title,
        artist: validated.artist,
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

    return toMusic(created);
  } catch (err) {
    // Concurrent insert of the same song hits the unique index
    if (typeof err === "object" && err !== null && "code" in err && err.code === UNIQUE_VIOLATION) {
      throw new MusicServiceError(
        duplicateMessage(validated.title, validated.artist),
        "DUPLICATE_MUSIC"
      );
    }
    throw err;
  }
}

/**
 * Maps validated update input to the personal (non-identity) columns shared by
 * customer_musics and setlist_music. title/artist are never included.
 */
export function buildPersonalMusicUpdate(validated: UpdateMusicSchemaInput) {
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

  return {
    ...(validated.lyrics !== undefined ? { lyrics: validated.lyrics } : {}),
    ...(validated.chords !== undefined ? { chords: validated.chords } : {}),
    ...(validated.originalKey !== undefined ? { originalKey: validated.originalKey } : {}),
    ...(validated.preferredKey !== undefined ? { preferredKey: validated.preferredKey } : {}),
    ...(validated.studying !== undefined ? { studying: validated.studying } : {}),
    ...genresUpdate,
    ...(validated.note !== undefined ? { note: validated.note } : {}),
    ...(validated.spotifyLink !== undefined ? { spotifyLink: validated.spotifyLink } : {}),
    ...(validated.sheetMusicFile !== undefined ? { sheetMusicFile: validated.sheetMusicFile } : {}),
  };
}

export async function updateMusic(
  id: string,
  input: Omit<UpdateMusicInput, "id">,
  customerId: string
): Promise<Music> {
  const validated = updateMusicSchema.parse({ ...input, id });

  // Verify ownership
  const [current] = await db
    .select({ id: customerMusics.id })
    .from(customerMusics)
    .where(and(eq(customerMusics.id, id), eq(customerMusics.customerId, customerId)))
    .limit(1);

  if (!current) {
    throw new MusicServiceError(
      "Música não encontrada no seu acervo.",
      "NOT_FOUND"
    );
  }

  // Update only personal fields (title/artist are immutable)
  const [updated] = await db
    .update(customerMusics)
    .set(buildPersonalMusicUpdate(validated))
    .where(and(eq(customerMusics.id, id), eq(customerMusics.customerId, customerId)))
    .returning();

  return toMusic(updated);
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
  const [row] = await db
    .select()
    .from(customerMusics)
    .where(
      and(
        eq(customerMusics.id, id),
        eq(customerMusics.customerId, customerId)
      )
    )
    .limit(1);

  return row ? toMusic(row) : null;
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
        ilike(customerMusics.title, term),
        ilike(customerMusics.artist, term)
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
    conditions.push(ilike(customerMusics.artist, `%${filters.artist.trim()}%`));
  }

  const rows = await db
    .select()
    .from(customerMusics)
    .where(and(...conditions))
    .orderBy(asc(customerMusics.title));

  return rows.map(toMusic);
}
