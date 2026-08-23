import { and, asc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { musics } from "@/db/schema/musics";
import type {
  CreateMusicInput,
  Music,
  MusicFilter,
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

export async function createMusic(
  input: CreateMusicInput,
  customerId: string
): Promise<Music> {
  const validated = createMusicSchema.parse(input);

  // Business rule 5: Uniqueness scoped to Customer (customerId, title, artist)
  const [existing] = await db
    .select()
    .from(musics)
    .where(
      and(
        eq(musics.customerId, customerId),
        sql`lower(${musics.title}) = lower(${validated.title})`,
        sql`lower(${musics.artist}) = lower(${validated.artist})`
      )
    )
    .limit(1);

  if (existing) {
    throw new MusicServiceError(
      `A música "${validated.title}" do artista "${validated.artist}" já está cadastrada no seu acervo.`,
      "DUPLICATE_MUSIC"
    );
  }

  const [created] = await db
    .insert(musics)
    .values({
      customerId,
      title: validated.title,
      artist: validated.artist,
      lyrics: validated.lyrics || null,
      originalKey: validated.originalKey || null,
      preferredKey: validated.preferredKey || null,
      skillLevel: validated.skillLevel ?? true,
      genre: validated.genre || null,
      note: validated.note || null,
      spotifyLink: validated.spotifyLink || null,
      sheetMusicFile: validated.sheetMusicFile || null,
    })
    .returning();

  return created;
}

export async function updateMusic(
  id: string,
  input: Omit<UpdateMusicInput, "id">,
  customerId: string
): Promise<Music> {
  const validated = updateMusicSchema.parse({ ...input, id });

  const [current] = await db
    .select()
    .from(musics)
    .where(and(eq(musics.id, id), eq(musics.customerId, customerId)))
    .limit(1);

  if (!current) {
    throw new MusicServiceError(
      "Música não encontrada no seu acervo.",
      "NOT_FOUND"
    );
  }

  const newTitle = validated.title ?? current.title;
  const newArtist = validated.artist ?? current.artist;

  const isTitleChanged =
    validated.title !== undefined &&
    validated.title.trim().toLowerCase() !== current.title.trim().toLowerCase();
  const isArtistChanged =
    validated.artist !== undefined &&
    validated.artist.trim().toLowerCase() !== current.artist.trim().toLowerCase();

  if (isTitleChanged || isArtistChanged) {
    const [conflict] = await db
      .select()
      .from(musics)
      .where(
        and(
          eq(musics.customerId, customerId),
          ne(musics.id, id),
          sql`lower(${musics.title}) = lower(${newTitle})`,
          sql`lower(${musics.artist}) = lower(${newArtist})`
        )
      )
      .limit(1);

    if (conflict) {
      throw new MusicServiceError(
        `Já existe outra música cadastrada com o título "${newTitle}" e artista "${newArtist}".`,
        "DUPLICATE_MUSIC"
      );
    }
  }

  const [updated] = await db
    .update(musics)
    .set({
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.artist !== undefined ? { artist: validated.artist } : {}),
      ...(validated.lyrics !== undefined ? { lyrics: validated.lyrics } : {}),
      ...(validated.originalKey !== undefined
        ? { originalKey: validated.originalKey }
        : {}),
      ...(validated.preferredKey !== undefined
        ? { preferredKey: validated.preferredKey }
        : {}),
      ...(validated.skillLevel !== undefined
        ? { skillLevel: validated.skillLevel }
        : {}),
      ...(validated.genre !== undefined ? { genre: validated.genre } : {}),
      ...(validated.note !== undefined ? { note: validated.note } : {}),
      ...(validated.spotifyLink !== undefined
        ? { spotifyLink: validated.spotifyLink }
        : {}),
      ...(validated.sheetMusicFile !== undefined
        ? { sheetMusicFile: validated.sheetMusicFile }
        : {}),
    })
    .where(and(eq(musics.id, id), eq(musics.customerId, customerId)))
    .returning();

  return updated;
}

export async function deleteMusic(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const result = await db
    .delete(musics)
    .where(and(eq(musics.id, id), eq(musics.customerId, customerId)))
    .returning({ id: musics.id });

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
  const [item] = await db
    .select()
    .from(musics)
    .where(and(eq(musics.id, id), eq(musics.customerId, customerId)))
    .limit(1);

  return item || null;
}

export async function listMusics(
  customerId: string,
  filters?: MusicFilter
): Promise<Music[]> {
  const conditions = [eq(musics.customerId, customerId)];

  if (filters?.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(musics.title, term), ilike(musics.artist, term))!
    );
  }

  if (filters?.genre) {
    conditions.push(eq(musics.genre, filters.genre));
  }

  if (filters?.originalKey) {
    conditions.push(eq(musics.originalKey, filters.originalKey));
  }

  if (filters?.preferredKey) {
    conditions.push(eq(musics.preferredKey, filters.preferredKey));
  }

  if (filters?.skillLevel !== undefined) {
    conditions.push(eq(musics.skillLevel, filters.skillLevel));
  }

  if (filters?.artist && filters.artist.trim().length > 0) {
    conditions.push(ilike(musics.artist, `%${filters.artist.trim()}%`));
  }

  return db
    .select()
    .from(musics)
    .where(and(...conditions))
    .orderBy(asc(musics.title));
}
