import { randomBytes } from "crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { concerts } from "@/db/schema/concerts";
import { setlistMusic } from "@/db/schema/setlist-music";
import { customerMusics } from "@/db/schema/customer-musics";
import { projects } from "@/db/schema/projects";
import { contractors } from "@/db/schema/contractors";
import { concertMusicians } from "@/db/schema/concert-musicians";
import { accompanyingMusicians } from "@/db/schema/accompanying-musicians";
import { songKey } from "@/features/concert/utils/song-key";
import type {
  Concert,
  ConcertWithSetlist,
  CreateConcertInput,
  PublicSharedConcert,
  UpdateConcertInput,
} from "../types";
import type { Music, MusicGenre, UpdateMusicInput } from "@/features/music/types";
import { buildPersonalMusicUpdate } from "@/features/music/services/music-service";
import { updateMusicSchema } from "@/features/music/schemas/music-schema";
import {
  createConcertSchema,
  updateConcertSchema,
} from "../schemas/concert-schema";

export class ConcertServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "UNAUTHORIZED"
      | "VALIDATION_ERROR"
      | "DUPLICATE_ERROR"
  ) {
    super(message);
    this.name = "ConcertServiceError";
  }
}

function mapConcert(raw: typeof concerts.$inferSelect): Concert {
  return {
    ...raw,
    agreedFee: raw.agreedFee ? Number(raw.agreedFee) : null,
    travelCost: raw.travelCost ? Number(raw.travelCost) : null,
    durationInHours: raw.durationInHours ? Number(raw.durationInHours) : null,
  };
}

export async function createConcert(
  input: CreateConcertInput,
  customerId: string
): Promise<Concert> {
  const validated = createConcertSchema.parse(input);

  // 1. Verify project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, validated.projectId),
        eq(projects.customerId, customerId)
      )
    )
    .limit(1);

  if (!project) {
    throw new ConcertServiceError(
      "Projeto não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const presentationDate = validated.presentationDate
    ? typeof validated.presentationDate === "string"
      ? new Date(validated.presentationDate)
      : validated.presentationDate
    : null;

  const [created] = await db
    .insert(concerts)
    .values({
      projectId: validated.projectId,
      customerId,
      contractorId: validated.contractorId || null,
      title: validated.title,
      location: validated.location || null,
      presentationDate,
      startTime: validated.startTime || null,
      finishTime: validated.finishTime || null,
      durationInHours:
        validated.durationInHours !== undefined && validated.durationInHours !== null
          ? String(validated.durationInHours)
          : null,
      totalBreakTime: validated.totalBreakTime ?? null,
      agreedFee:
        validated.agreedFee !== undefined && validated.agreedFee !== null
          ? String(validated.agreedFee)
          : null,
      travelCost:
        validated.travelCost !== undefined && validated.travelCost !== null
          ? String(validated.travelCost)
          : null,
      paymentStatus: validated.paymentStatus ?? "PENDING",
      note: validated.note || null,
    })
    .returning();

  if (validated.musicians && validated.musicians.length > 0) {
    const musicianIds = validated.musicians.map((m) => m.musicianId);
    const userMusicians = await db
      .select({ id: accompanyingMusicians.id })
      .from(accompanyingMusicians)
      .where(
        and(
          eq(accompanyingMusicians.customerId, customerId),
          inArray(accompanyingMusicians.id, musicianIds)
        )
      );

    const validIdSet = new Set(userMusicians.map((m) => m.id));
    const validMusicians = validated.musicians.filter((m) =>
      validIdSet.has(m.musicianId)
    );

    if (validMusicians.length > 0) {
      await db.insert(concertMusicians).values(
        validMusicians.map((m) => ({
          concertId: created.id,
          musicianId: m.musicianId,
          agreedFee:
            m.agreedFee !== undefined && m.agreedFee !== null
              ? String(m.agreedFee)
              : null,
        }))
      );
    }
  }

  return mapConcert(created);
}

export async function updateConcert(
  id: string,
  input: UpdateConcertInput,
  customerId: string
): Promise<Concert> {
  const validated = updateConcertSchema.parse(input);

  const [existing] = await db
    .select()
    .from(concerts)
    .where(and(eq(concerts.id, id), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const updateData: Partial<typeof concerts.$inferInsert> = {};
  if (validated.contractorId !== undefined) {
    updateData.contractorId = validated.contractorId || null;
  }
  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.location !== undefined) updateData.location = validated.location || null;
  if (validated.presentationDate !== undefined) {
    updateData.presentationDate = validated.presentationDate
      ? typeof validated.presentationDate === "string"
        ? new Date(validated.presentationDate)
        : validated.presentationDate
      : null;
  }
  if (validated.startTime !== undefined) updateData.startTime = validated.startTime || null;
  if (validated.finishTime !== undefined) updateData.finishTime = validated.finishTime || null;
  if (validated.durationInHours !== undefined) {
    updateData.durationInHours =
      validated.durationInHours !== null ? String(validated.durationInHours) : null;
  }
  if (validated.totalBreakTime !== undefined) {
    updateData.totalBreakTime = validated.totalBreakTime ?? null;
  }
  if (validated.agreedFee !== undefined) {
    updateData.agreedFee =
      validated.agreedFee !== null ? String(validated.agreedFee) : null;
  }
  if (validated.travelCost !== undefined) {
    updateData.travelCost =
      validated.travelCost !== null ? String(validated.travelCost) : null;
  }
  if (validated.paymentStatus !== undefined) {
    updateData.paymentStatus = validated.paymentStatus;
  }
  if (validated.note !== undefined) updateData.note = validated.note || null;

  if (validated.musicians !== undefined) {
    await db
      .delete(concertMusicians)
      .where(eq(concertMusicians.concertId, id));

    if (validated.musicians.length > 0) {
      const musicianIds = validated.musicians.map((m) => m.musicianId);
      const userMusicians = await db
        .select({ id: accompanyingMusicians.id })
        .from(accompanyingMusicians)
        .where(
          and(
            eq(accompanyingMusicians.customerId, customerId),
            inArray(accompanyingMusicians.id, musicianIds)
          )
        );

      const validIdSet = new Set(userMusicians.map((m) => m.id));
      const validMusicians = validated.musicians.filter((m) =>
        validIdSet.has(m.musicianId)
      );

      if (validMusicians.length > 0) {
        await db.insert(concertMusicians).values(
          validMusicians.map((m) => ({
            concertId: id,
            musicianId: m.musicianId,
            agreedFee:
              m.agreedFee !== undefined && m.agreedFee !== null
                ? String(m.agreedFee)
                : null,
          }))
        );
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return mapConcert(existing);
  }

  const [updated] = await db
    .update(concerts)
    .set(updateData)
    .where(and(eq(concerts.id, id), eq(concerts.customerId, customerId)))
    .returning();

  return mapConcert(updated);
}

export async function deleteConcert(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const [existing] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(and(eq(concerts.id, id), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!existing) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(concerts)
    .where(and(eq(concerts.id, id), eq(concerts.customerId, customerId)));

  return { success: true };
}

type SetlistMusicRow = typeof setlistMusic.$inferSelect;

/** Maps a setlist_music row to the Music shape used by the UI. id is the setlist row id. */
function setlistRowToMusic(r: SetlistMusicRow, customerId: string): Music {
  const genres = (r.genres as MusicGenre[] | null) ?? (r.genre ? [r.genre] : null);
  return {
    id: r.id,
    customerId,
    title: r.title,
    artist: r.artist,
    lyrics: r.lyrics,
    chords: r.chords,
    originalKey: r.originalKey,
    preferredKey: r.preferredKey,
    studying: r.studying,
    genre: r.genre,
    genres,
    note: r.note,
    spotifyLink: r.spotifyLink,
    sheetMusicFile: r.sheetMusicFile,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function getConcertById(
  id: string,
  customerId: string
): Promise<ConcertWithSetlist | null> {
  const [concert] = await db
    .select({
      concert: concerts,
      projectName: projects.name,
      contractorName: contractors.contactPersonName,
    })
    .from(concerts)
    .innerJoin(projects, eq(projects.id, concerts.projectId))
    .leftJoin(contractors, eq(contractors.id, concerts.contractorId))
    .where(and(eq(concerts.id, id), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    return null;
  }

  const rows = await db
    .select()
    .from(setlistMusic)
    .where(eq(setlistMusic.concertId, id))
    .orderBy(asc(setlistMusic.position));

  const items = rows.map((r) => ({
    id: r.id,
    concertId: r.concertId,
    // Library song this row was copied from (null if it was since deleted)
    musicId: r.sourceCustomerMusicId,
    position: r.position,
    note: r.note,
    isConcluded: r.isConcluded,
    createdAt: r.createdAt,
    music: setlistRowToMusic(r, concert.concert.customerId),
  }));

  const mappedConcert = mapConcert(concert.concert);

  const musicianRows = await db
    .select({
      id: concertMusicians.id,
      concertId: concertMusicians.concertId,
      musicianId: concertMusicians.musicianId,
      agreedFee: concertMusicians.agreedFee,
      createdAt: concertMusicians.createdAt,
      musician: accompanyingMusicians,
    })
    .from(concertMusicians)
    .innerJoin(
      accompanyingMusicians,
      eq(accompanyingMusicians.id, concertMusicians.musicianId)
    )
    .where(eq(concertMusicians.concertId, id));

  const musicians = musicianRows.map((r) => ({
    id: r.id,
    concertId: r.concertId,
    musicianId: r.musicianId,
    agreedFee: r.agreedFee ? parseFloat(r.agreedFee) : null,
    createdAt: r.createdAt,
    musician: r.musician,
  }));

  return {
    ...mappedConcert,
    projectName: concert.projectName,
    contractorName: concert.contractorName,
    setlist: items,
    setlistCount: items.length,
    musicians,
  };
}

export async function listConcertsByProject(
  projectId: string,
  customerId: string
): Promise<ConcertWithSetlist[]> {
  // 1. Verify project ownership
  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)))
    .limit(1);

  if (!project) {
    return [];
  }

  const allConcerts = await db
    .select({
      concert: concerts,
      contractorName: contractors.contactPersonName,
      setlistCount: sql<number>`count(${setlistMusic.id})::int`,
    })
    .from(concerts)
    .leftJoin(contractors, eq(contractors.id, concerts.contractorId))
    .leftJoin(setlistMusic, eq(setlistMusic.concertId, concerts.id))
    .where(and(eq(concerts.projectId, projectId), eq(concerts.customerId, customerId)))
    .groupBy(concerts.id, contractors.contactPersonName)
    .orderBy(desc(concerts.presentationDate), desc(concerts.startTime));

  return allConcerts.map(({ concert, contractorName, setlistCount }) => ({
    ...mapConcert(concert),
    projectName: project.name,
    contractorName,
    setlist: [],
    setlistCount,
  }));
}

export async function listAllConcerts(
  customerId: string
): Promise<ConcertWithSetlist[]> {
  const allConcerts = await db
    .select({
      concert: concerts,
      projectName: projects.name,
      contractorName: contractors.contactPersonName,
      setlistCount: sql<number>`count(${setlistMusic.id})::int`,
    })
    .from(concerts)
    .innerJoin(projects, eq(projects.id, concerts.projectId))
    .leftJoin(contractors, eq(contractors.id, concerts.contractorId))
    .leftJoin(setlistMusic, eq(setlistMusic.concertId, concerts.id))
    .where(eq(concerts.customerId, customerId))
    .groupBy(concerts.id, projects.name, contractors.contactPersonName)
    .orderBy(desc(concerts.presentationDate), desc(concerts.startTime));

  return allConcerts.map(({ concert, projectName, contractorName, setlistCount }) => ({
    ...mapConcert(concert),
    projectName,
    contractorName,
    setlist: [],
    setlistCount,
  }));
}

export async function duplicateConcert(
  concertId: string,
  customerId: string
): Promise<ConcertWithSetlist> {
  const original = await getConcertById(concertId, customerId);
  if (!original) {
    throw new ConcertServiceError(
      "Apresentação original não encontrada.",
      "NOT_FOUND"
    );
  }

  // 1. Insert duplicated concert
  const [cloned] = await db
    .insert(concerts)
    .values({
      projectId: original.projectId,
      customerId,
      contractorId: original.contractorId,
      title: `${original.title} (Cópia)`,
      location: original.location,
      presentationDate: original.presentationDate,
      startTime: original.startTime,
      finishTime: original.finishTime,
      durationInHours:
        original.durationInHours !== null ? String(original.durationInHours) : null,
      totalBreakTime: original.totalBreakTime,
      agreedFee:
        original.agreedFee !== null ? String(original.agreedFee) : null,
      travelCost:
        original.travelCost !== null ? String(original.travelCost) : null,
      paymentStatus: "PENDING", // Reset payment status for new clone
      note: original.note,
    })
    .returning();

  // 2. Copy each setlist song into the new concert, in the same order.
  // The rows are copied as-is, so the new concert is independent of the original.
  const originalRows = await db
    .select()
    .from(setlistMusic)
    .where(eq(setlistMusic.concertId, concertId))
    .orderBy(asc(setlistMusic.position));

  if (originalRows.length > 0) {
    await db.insert(setlistMusic).values(
      originalRows.map((row) => ({
        concertId: cloned.id,
        sourceCustomerMusicId: row.sourceCustomerMusicId,
        position: row.position,
        note: row.note,
        title: row.title,
        artist: row.artist,
        lyrics: row.lyrics,
        chords: row.chords,
        originalKey: row.originalKey,
        preferredKey: row.preferredKey,
        studying: row.studying,
        genre: row.genre,
        genres: row.genres,
        spotifyLink: row.spotifyLink,
        sheetMusicFile: row.sheetMusicFile,
      }))
    );
  }

  // 3. Clone musicians
  if (original.musicians && original.musicians.length > 0) {
    for (const m of original.musicians) {
      await db.insert(concertMusicians).values({
        concertId: cloned.id,
        musicianId: m.musicianId,
        agreedFee:
          m.agreedFee !== null && m.agreedFee !== undefined
            ? String(m.agreedFee)
            : null,
      });
    }
  }

  const result = await getConcertById(cloned.id, customerId);
  if (!result) {
    throw new ConcertServiceError("Erro ao recuperar apresentação duplicada.", "DUPLICATE_ERROR");
  }

  return result;
}

export async function addMusicsToSetlist(
  concertId: string,
  musicIds: string[],
  customerId: string
): Promise<{ addedCount: number; skippedTitles: string[] }> {
  if (musicIds.length === 0) {
    return { addedCount: 0, skippedTitles: [] };
  }

  // 1. Verify concert ownership
  const [concert] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(and(eq(concerts.id, concertId), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  // 2. Load the library songs; they must belong to the customer
  const libraryMusics = await db
    .select()
    .from(customerMusics)
    .where(and(eq(customerMusics.customerId, customerId), inArray(customerMusics.id, musicIds)));

  if (libraryMusics.length === 0) {
    return { addedCount: 0, skippedTitles: [] };
  }

  // 3. Get current maximum position and the songs already in the setlist.
  // A song is identified by normalized title + artist, never by library ID.
  const existingRows = await db
    .select({ title: setlistMusic.title, artist: setlistMusic.artist, position: setlistMusic.position })
    .from(setlistMusic)
    .where(eq(setlistMusic.concertId, concertId));

  const seenKeys = new Set(existingRows.map((r) => songKey(r.title, r.artist)));
  let currentPos = existingRows.reduce((max, r) => Math.max(max, r.position), 0);

  // 4. Copy each library song into the concert (copy-on-add), skipping duplicates
  // both against the existing setlist and within this same batch.
  const toInsert: (typeof libraryMusics)[number][] = [];
  const skippedTitles: string[] = [];
  for (const music of libraryMusics) {
    const key = songKey(music.title, music.artist);
    if (seenKeys.has(key)) {
      skippedTitles.push(music.title);
      continue;
    }
    seenKeys.add(key);
    toInsert.push(music);
  }

  if (toInsert.length === 0) {
    return { addedCount: 0, skippedTitles };
  }

  await db.insert(setlistMusic).values(
    toInsert.map((music) => {
      currentPos++;
      return {
        concertId,
        sourceCustomerMusicId: music.id,
        position: currentPos,
        title: music.title,
        artist: music.artist,
        lyrics: music.lyrics,
        chords: music.chords,
        originalKey: music.originalKey,
        preferredKey: music.preferredKey,
        studying: music.studying,
        genre: music.genre,
        genres: music.genres,
        spotifyLink: music.spotifyLink,
        sheetMusicFile: music.sheetMusicFile,
      };
    })
  );

  return { addedCount: toInsert.length, skippedTitles };
}

export async function removeSetlistItem(
  concertId: string,
  setlistItemId: string,
  customerId: string
): Promise<{ success: true }> {
  // 1. Verify concert ownership
  const [concert] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(and(eq(concerts.id, concertId), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  // 2. Delete item
  await db
    .delete(setlistMusic)
    .where(and(eq(setlistMusic.id, setlistItemId), eq(setlistMusic.concertId, concertId)));

  // 3. Re-compact positions
  const remaining = await db
    .select({ id: setlistMusic.id })
    .from(setlistMusic)
    .where(eq(setlistMusic.concertId, concertId))
    .orderBy(asc(setlistMusic.position));

  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(setlistMusic)
      .set({ position: i + 1 })
      .where(eq(setlistMusic.id, remaining[i].id));
  }

  return { success: true };
}

export async function reorderSetlist(
  concertId: string,
  orderedItemIds: string[],
  customerId: string
): Promise<{ success: true }> {
  // 1. Verify concert ownership
  const [concert] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(and(eq(concerts.id, concertId), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  for (let i = 0; i < orderedItemIds.length; i++) {
    await db
      .update(setlistMusic)
      .set({ position: i + 1 })
      .where(
        and(
          eq(setlistMusic.id, orderedItemIds[i]),
          eq(setlistMusic.concertId, concertId)
        )
      );
  }

  return { success: true };
}

/**
 * Marks or unmarks a song of this concert's setlist as concluded by the user.
 * Only affects this concert's copy, not the library song.
 */
export async function setSetlistItemConcluded(
  concertId: string,
  setlistItemId: string,
  isConcluded: boolean,
  customerId: string
): Promise<{ success: true }> {
  await assertCanEditConcert(concertId, customerId);

  const updated = await db
    .update(setlistMusic)
    .set({ isConcluded })
    .where(and(eq(setlistMusic.id, setlistItemId), eq(setlistMusic.concertId, concertId)))
    .returning({ id: setlistMusic.id });

  if (updated.length === 0) {
    throw new ConcertServiceError("Música não encontrada no setlist deste show.", "NOT_FOUND");
  }

  return { success: true };
}

/**
 * Edits a song's personal fields inside one concert's setlist only.
 * Does not touch the library song (customer_musics), so the library and other
 * concerts are unaffected. title/artist remain immutable, as in the library.
 */
export async function updateSetlistMusic(
  concertId: string,
  setlistItemId: string,
  input: Omit<UpdateMusicInput, "id">,
  customerId: string
): Promise<Music> {
  await assertCanEditConcert(concertId, customerId);

  const validated = updateMusicSchema.parse({ ...input, id: setlistItemId });

  const [updated] = await db
    .update(setlistMusic)
    .set(buildPersonalMusicUpdate(validated))
    .where(and(eq(setlistMusic.id, setlistItemId), eq(setlistMusic.concertId, concertId)))
    .returning();

  if (!updated) {
    throw new ConcertServiceError("Música não encontrada no setlist deste show.", "NOT_FOUND");
  }

  return setlistRowToMusic(updated, customerId);
}

/**
 * Centralized authorization helper for concert editing operations.
 * Designed to seamlessly support team/workspace roles in the future.
 */
export async function assertCanEditConcert(
  concertId: string,
  customerId: string
) {
  const [concert] = await db
    .select()
    .from(concerts)
    .where(and(eq(concerts.id, concertId), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    throw new ConcertServiceError(
      "Apresentação não encontrada ou você não tem permissão para editá-la.",
      "NOT_FOUND"
    );
  }

  return concert;
}

/**
 * Generates (or reuses) a secure share token and activates public setlist sharing.
 */
export async function enableConcertShare(
  concertId: string,
  customerId: string
): Promise<{ shareToken: string; isShareEnabled: boolean }> {
  const concert = await assertCanEditConcert(concertId, customerId);

  let token = concert.shareToken;
  if (!token) {
    token = randomBytes(16).toString("hex");
  }

  await db
    .update(concerts)
    .set({
      shareToken: token,
      isShareEnabled: true,
    })
    .where(eq(concerts.id, concertId));

  return {
    shareToken: token,
    isShareEnabled: true,
  };
}

/**
 * Disables public setlist sharing for this concert.
 */
export async function disableConcertShare(
  concertId: string,
  customerId: string
): Promise<{ success: true }> {
  await assertCanEditConcert(concertId, customerId);

  await db
    .update(concerts)
    .set({
      isShareEnabled: false,
    })
    .where(eq(concerts.id, concertId));

  return { success: true };
}

/**
 * Retrieves a sanitized, read-only DTO of a concert for public viewing.
 * Strictly excludes financial details (agreedFee, travelCost) and contractor contacts.
 * Includes complete address description, presentation date, schedules, and full setlist with lyrics.
 */
export async function getSharedConcertByToken(
  shareToken: string
): Promise<PublicSharedConcert | null> {
  if (!shareToken || !shareToken.trim()) {
    return null;
  }

  const [found] = await db
    .select({
      concert: concerts,
      projectName: projects.name,
    })
    .from(concerts)
    .innerJoin(projects, eq(projects.id, concerts.projectId))
    .where(
      and(
        eq(concerts.shareToken, shareToken),
        eq(concerts.isShareEnabled, true)
      )
    )
    .limit(1);

  if (!found) {
    return null;
  }

  const { concert, projectName } = found;

  // Retrieve ordered setlist (setlist_music only; no library join)
  const rawItems2 = await db
    .select()
    .from(setlistMusic)
    .where(eq(setlistMusic.concertId, concert.id))
    .orderBy(asc(setlistMusic.position));

  const sanitizedSetlist = rawItems2.map((item) => ({
    id: item.id,
    position: item.position,
    note: item.note,
    music: {
      id: item.id,
      title: item.title,
      artist: item.artist,
      preferredKey: item.preferredKey,
      originalKey: item.originalKey,
      lyrics: item.lyrics,
      chords: item.chords,
      spotifyLink: item.spotifyLink,
      studying: item.studying,
      note: item.note,
    },
  }));

  return {
    id: concert.id,
    title: concert.title,
    projectName,
    location: concert.location,
    presentationDate: concert.presentationDate,
    startTime: concert.startTime,
    finishTime: concert.finishTime,
    durationInHours: concert.durationInHours ? Number(concert.durationInHours) : null,
    totalBreakTime: concert.totalBreakTime,
    note: concert.note,
    setlist: sanitizedSetlist,
    setlistCount: sanitizedSetlist.length,
  };
}
