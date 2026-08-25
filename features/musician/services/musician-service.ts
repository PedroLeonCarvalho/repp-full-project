import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accompanyingMusicians } from "@/db/schema/accompanying-musicians";
import { concertMusicians } from "@/db/schema/concert-musicians";
import { concerts } from "@/db/schema/concerts";
import type {
  AccompanyingMusician,
  AddMusicianToConcertInput,
  ConcertMusician,
  CreateMusicianInput,
  UpdateMusicianInput,
} from "../types";
import {
  addMusicianToConcertSchema,
  createMusicianSchema,
  updateMusicianSchema,
} from "../schemas/musician-schema";

export class MusicianServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "MusicianServiceError";
  }
}

export async function createMusician(
  input: CreateMusicianInput,
  customerId: string
): Promise<AccompanyingMusician> {
  const validated = createMusicianSchema.parse(input);

  const [created] = await db
    .insert(accompanyingMusicians)
    .values({
      customerId,
      name: validated.name,
      instrument: validated.instrument || null,
      cpf: validated.cpf || null,
      phone: validated.phone || null,
      address: validated.address || null,
      note: validated.note || null,
    })
    .returning();

  return created;
}

export async function updateMusician(
  id: string,
  input: UpdateMusicianInput,
  customerId: string
): Promise<AccompanyingMusician> {
  const validated = updateMusicianSchema.parse(input);

  const [existing] = await db
    .select()
    .from(accompanyingMusicians)
    .where(
      and(
        eq(accompanyingMusicians.id, id),
        eq(accompanyingMusicians.customerId, customerId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new MusicianServiceError(
      "Músico não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const updateData: Partial<typeof accompanyingMusicians.$inferInsert> = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.instrument !== undefined) {
    updateData.instrument = validated.instrument || null;
  }
  if (validated.cpf !== undefined) updateData.cpf = validated.cpf || null;
  if (validated.phone !== undefined) updateData.phone = validated.phone || null;
  if (validated.address !== undefined) {
    updateData.address = validated.address || null;
  }
  if (validated.note !== undefined) updateData.note = validated.note || null;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(accompanyingMusicians)
    .set(updateData)
    .where(
      and(
        eq(accompanyingMusicians.id, id),
        eq(accompanyingMusicians.customerId, customerId)
      )
    )
    .returning();

  return updated;
}

export async function deleteMusician(
  id: string,
  customerId: string
): Promise<{ success: true }> {
  const [existing] = await db
    .select({ id: accompanyingMusicians.id })
    .from(accompanyingMusicians)
    .where(
      and(
        eq(accompanyingMusicians.id, id),
        eq(accompanyingMusicians.customerId, customerId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new MusicianServiceError(
      "Músico não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(accompanyingMusicians)
    .where(
      and(
        eq(accompanyingMusicians.id, id),
        eq(accompanyingMusicians.customerId, customerId)
      )
    );

  return { success: true };
}

export async function getMusicianById(
  id: string,
  customerId: string
): Promise<AccompanyingMusician | null> {
  const [musician] = await db
    .select()
    .from(accompanyingMusicians)
    .where(
      and(
        eq(accompanyingMusicians.id, id),
        eq(accompanyingMusicians.customerId, customerId)
      )
    )
    .limit(1);

  return musician || null;
}

export async function listMusicians(
  customerId: string
): Promise<AccompanyingMusician[]> {
  return await db
    .select()
    .from(accompanyingMusicians)
    .where(eq(accompanyingMusicians.customerId, customerId))
    .orderBy(desc(accompanyingMusicians.createdAt));
}

export async function listConcertMusicians(
  concertId: string,
  customerId: string
): Promise<ConcertMusician[]> {
  // Validate concert ownership
  const [concert] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(and(eq(concerts.id, concertId), eq(concerts.customerId, customerId)))
    .limit(1);

  if (!concert) {
    throw new MusicianServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  const rows = await db
    .select({
      id: concertMusicians.id,
      concertId: concertMusicians.concertId,
      musicianId: concertMusicians.musicianId,
      agreedFee: concertMusicians.agreedFee,
      createdAt: concertMusicians.createdAt,
      musician: {
        id: accompanyingMusicians.id,
        customerId: accompanyingMusicians.customerId,
        name: accompanyingMusicians.name,
        instrument: accompanyingMusicians.instrument,
        cpf: accompanyingMusicians.cpf,
        phone: accompanyingMusicians.phone,
        address: accompanyingMusicians.address,
        note: accompanyingMusicians.note,
        createdAt: accompanyingMusicians.createdAt,
        updatedAt: accompanyingMusicians.updatedAt,
      },
    })
    .from(concertMusicians)
    .innerJoin(
      accompanyingMusicians,
      eq(accompanyingMusicians.id, concertMusicians.musicianId)
    )
    .where(eq(concertMusicians.concertId, concertId));

  return rows.map((r) => ({
    id: r.id,
    concertId: r.concertId,
    musicianId: r.musicianId,
    agreedFee: r.agreedFee ? parseFloat(r.agreedFee) : null,
    createdAt: r.createdAt,
    musician: r.musician,
  }));
}

export async function addMusicianToConcert(
  input: AddMusicianToConcertInput,
  customerId: string
): Promise<ConcertMusician> {
  const validated = addMusicianToConcertSchema.parse(input);

  // Validate concert ownership
  const [concert] = await db
    .select({ id: concerts.id })
    .from(concerts)
    .where(
      and(
        eq(concerts.id, validated.concertId),
        eq(concerts.customerId, customerId)
      )
    )
    .limit(1);

  if (!concert) {
    throw new MusicianServiceError(
      "Apresentação não encontrada ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  // Validate musician ownership
  const [musician] = await db
    .select()
    .from(accompanyingMusicians)
    .where(
      and(
        eq(accompanyingMusicians.id, validated.musicianId),
        eq(accompanyingMusicians.customerId, customerId)
      )
    )
    .limit(1);

  if (!musician) {
    throw new MusicianServiceError(
      "Músico não encontrado ou não pertence ao usuário.",
      "NOT_FOUND"
    );
  }

  // Check if already in concert
  const [existing] = await db
    .select({ id: concertMusicians.id })
    .from(concertMusicians)
    .where(
      and(
        eq(concertMusicians.concertId, validated.concertId),
        eq(concertMusicians.musicianId, validated.musicianId)
      )
    )
    .limit(1);

  if (existing) {
    throw new MusicianServiceError(
      "Este músico já está associado a esta apresentação.",
      "VALIDATION_ERROR"
    );
  }

  const [created] = await db
    .insert(concertMusicians)
    .values({
      concertId: validated.concertId,
      musicianId: validated.musicianId,
      agreedFee: validated.agreedFee ? String(validated.agreedFee) : null,
    })
    .returning();

  return {
    id: created.id,
    concertId: created.concertId,
    musicianId: created.musicianId,
    agreedFee: created.agreedFee ? parseFloat(created.agreedFee) : null,
    createdAt: created.createdAt,
    musician,
  };
}

export async function removeMusicianFromConcert(
  concertMusicianId: string,
  customerId: string
): Promise<{ success: true }> {
  // Join with concert to verify customerId
  const [item] = await db
    .select({ id: concertMusicians.id })
    .from(concertMusicians)
    .innerJoin(concerts, eq(concerts.id, concertMusicians.concertId))
    .where(
      and(
        eq(concertMusicians.id, concertMusicianId),
        eq(concerts.customerId, customerId)
      )
    )
    .limit(1);

  if (!item) {
    throw new MusicianServiceError(
      "Vínculo do músico com o show não encontrado.",
      "NOT_FOUND"
    );
  }

  await db
    .delete(concertMusicians)
    .where(eq(concertMusicians.id, concertMusicianId));

  return { success: true };
}

export async function updateConcertMusicianFee(
  concertMusicianId: string,
  agreedFee: number | null,
  customerId: string
): Promise<{ success: true }> {
  const [item] = await db
    .select({ id: concertMusicians.id })
    .from(concertMusicians)
    .innerJoin(concerts, eq(concerts.id, concertMusicians.concertId))
    .where(
      and(
        eq(concertMusicians.id, concertMusicianId),
        eq(concerts.customerId, customerId)
      )
    )
    .limit(1);

  if (!item) {
    throw new MusicianServiceError(
      "Vínculo do músico com o show não encontrado.",
      "NOT_FOUND"
    );
  }

  await db
    .update(concertMusicians)
    .set({
      agreedFee: agreedFee ? String(agreedFee) : null,
    })
    .where(eq(concertMusicians.id, concertMusicianId));

  return { success: true };
}
