import { randomBytes } from "crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { concerts } from "@/db/schema/concerts";
import { setlistItems } from "@/db/schema/setlist-items";
import { customerMusics } from "@/db/schema/customer-musics";
import { musicCatalog } from "@/db/schema/music-catalog";
import { projects } from "@/db/schema/projects";
import { contractors } from "@/db/schema/contractors";
import { concertMusicians } from "@/db/schema/concert-musicians";
import { accompanyingMusicians } from "@/db/schema/accompanying-musicians";
import type {
  Concert,
  ConcertWithSetlist,
  CreateConcertInput,
  PublicSharedConcert,
  UpdateConcertInput,
} from "../types";
import type { MusicGenre } from "@/features/music/types";
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

  const presentationDate =
    typeof validated.presentationDate === "string"
      ? new Date(validated.presentationDate)
      : validated.presentationDate;

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
    updateData.presentationDate =
      typeof validated.presentationDate === "string"
        ? new Date(validated.presentationDate)
        : validated.presentationDate;
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

  const rawItems = await db
    .select({
      id: setlistItems.id,
      concertId: setlistItems.concertId,
      musicId: setlistItems.musicId,
      position: setlistItems.position,
      note: setlistItems.note,
      createdAt: setlistItems.createdAt,
      cm: customerMusics,
      mc: musicCatalog,
    })
    .from(setlistItems)
    .innerJoin(customerMusics, eq(customerMusics.id, setlistItems.musicId))
    .innerJoin(musicCatalog, eq(musicCatalog.id, customerMusics.musicCatalogId))
    .where(eq(setlistItems.concertId, id))
    .orderBy(asc(setlistItems.position));

  const items = rawItems.map((r) => ({
    id: r.id,
    concertId: r.concertId,
    musicId: r.musicId,
    position: r.position,
    note: r.note,
    createdAt: r.createdAt,
    music: {
      id: r.cm.id,
      musicCatalogId: r.cm.musicCatalogId,
      customerId: r.cm.customerId,
      title: r.mc.title,
      artist: r.mc.artist,
      lyrics: r.cm.lyrics ?? r.mc.lyrics,
      chords: r.cm.chords ?? r.mc.chords,
      originalKey: r.cm.originalKey,
      preferredKey: r.cm.preferredKey,
      studying: r.cm.studying,
      genre: r.cm.genre,
      genres: (r.cm.genres as MusicGenre[]) ?? (r.cm.genre ? [r.cm.genre as MusicGenre] : null),
      note: r.cm.note,
      spotifyLink: r.cm.spotifyLink,
      sheetMusicFile: r.cm.sheetMusicFile,
      createdAt: r.cm.createdAt,
      updatedAt: r.cm.updatedAt,
    },
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
      setlistCount: sql<number>`count(${setlistItems.id})::int`,
    })
    .from(concerts)
    .leftJoin(contractors, eq(contractors.id, concerts.contractorId))
    .leftJoin(setlistItems, eq(setlistItems.concertId, concerts.id))
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
      setlistCount: sql<number>`count(${setlistItems.id})::int`,
    })
    .from(concerts)
    .innerJoin(projects, eq(projects.id, concerts.projectId))
    .leftJoin(contractors, eq(contractors.id, concerts.contractorId))
    .leftJoin(setlistItems, eq(setlistItems.concertId, concerts.id))
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

  // 2. Clone setlist items in same order
  if (original.setlist.length > 0) {
    for (const item of original.setlist) {
      await db.insert(setlistItems).values({
        concertId: cloned.id,
        musicId: item.musicId,
        position: item.position,
        note: item.note,
      });
    }
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
): Promise<{ addedCount: number }> {
  if (musicIds.length === 0) {
    return { addedCount: 0 };
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

  // 2. Verify all musics belong to customer
  const verifiedMusics = await db
    .select({ id: customerMusics.id })
    .from(customerMusics)
    .where(and(eq(customerMusics.customerId, customerId), inArray(customerMusics.id, musicIds)));

  if (verifiedMusics.length === 0) {
    return { addedCount: 0 };
  }

  // 3. Get current maximum position
  const [maxPosResult] = await db
    .select({ maxPos: sql<number>`coalesce(max(${setlistItems.position}), 0)::int` })
    .from(setlistItems)
    .where(eq(setlistItems.concertId, concertId));

  let currentPos = maxPosResult?.maxPos || 0;
  let addedCount = 0;

  for (const music of verifiedMusics) {
    currentPos++;
    await db.insert(setlistItems).values({
      concertId,
      musicId: music.id,
      position: currentPos,
    });
    addedCount++;
  }

  return { addedCount };
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
    .delete(setlistItems)
    .where(and(eq(setlistItems.id, setlistItemId), eq(setlistItems.concertId, concertId)));

  // 3. Re-compact positions
  const remaining = await db
    .select({ id: setlistItems.id })
    .from(setlistItems)
    .where(eq(setlistItems.concertId, concertId))
    .orderBy(asc(setlistItems.position));

  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(setlistItems)
      .set({ position: i + 1 })
      .where(eq(setlistItems.id, remaining[i].id));
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
      .update(setlistItems)
      .set({ position: i + 1 })
      .where(
        and(
          eq(setlistItems.id, orderedItemIds[i]),
          eq(setlistItems.concertId, concertId)
        )
      );
  }

  return { success: true };
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

  // Retrieve ordered setlist with music details
  const rawItems2 = await db
    .select({
      id: setlistItems.id,
      position: setlistItems.position,
      note: setlistItems.note,
      cm: customerMusics,
      mc: musicCatalog,
    })
    .from(setlistItems)
    .innerJoin(customerMusics, eq(customerMusics.id, setlistItems.musicId))
    .innerJoin(musicCatalog, eq(musicCatalog.id, customerMusics.musicCatalogId))
    .where(eq(setlistItems.concertId, concert.id))
    .orderBy(asc(setlistItems.position));

  const sanitizedSetlist = rawItems2.map((item) => ({
    id: item.id,
    position: item.position,
    note: item.note,
    music: {
      id: item.cm.id,
      title: item.mc.title,
      artist: item.mc.artist,
      preferredKey: item.cm.preferredKey,
      originalKey: item.cm.originalKey,
      lyrics: item.cm.lyrics ?? item.mc.lyrics,
      chords: item.cm.chords ?? item.mc.chords,
      spotifyLink: item.cm.spotifyLink,
      studying: item.cm.studying,
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
