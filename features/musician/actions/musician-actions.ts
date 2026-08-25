"use server";

import { revalidatePath } from "next/cache";
import { requireAuthCustomerId } from "@/features/auth/services/auth-service";
import {
  addMusicianToConcert,
  createMusician,
  deleteMusician,
  getMusicianById,
  listConcertMusicians,
  listMusicians,
  removeMusicianFromConcert,
  updateConcertMusicianFee,
  updateMusician,
  MusicianServiceError,
} from "../services/musician-service";
import type {
  AccompanyingMusician,
  AddMusicianToConcertInput,
  ConcertMusician,
  CreateMusicianInput,
  UpdateMusicianInput,
} from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createMusicianAction(
  input: CreateMusicianInput
): Promise<ActionResult<AccompanyingMusician>> {
  try {
    const customerId = await requireAuthCustomerId();
    const created = await createMusician(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao cadastrar músico." };
  }
}

export async function updateMusicianAction(
  id: string,
  input: UpdateMusicianInput
): Promise<ActionResult<AccompanyingMusician>> {
  try {
    const customerId = await requireAuthCustomerId();
    const updated = await updateMusician(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar músico." };
  }
}

export async function deleteMusicianAction(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await deleteMusician(id, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao excluir músico." };
  }
}

export async function listMusiciansAction(): Promise<
  ActionResult<AccompanyingMusician[]>
> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listMusicians(customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar músicos." };
  }
}

export async function getMusicianByIdAction(
  id: string
): Promise<ActionResult<AccompanyingMusician | null>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await getMusicianById(id, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar músico." };
  }
}

export async function listConcertMusiciansAction(
  concertId: string
): Promise<ActionResult<ConcertMusician[]>> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listConcertMusicians(concertId, customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar músicos do show." };
  }
}

export async function addMusicianToConcertAction(
  input: AddMusicianToConcertInput
): Promise<ActionResult<ConcertMusician>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await addMusicianToConcert(input, customerId);
    revalidatePath("/");
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao vincular músico ao show." };
  }
}

export async function removeMusicianFromConcertAction(
  concertMusicianId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await removeMusicianFromConcert(concertMusicianId, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao desvincular músico do show." };
  }
}

export async function updateConcertMusicianFeeAction(
  concertMusicianId: string,
  agreedFee: number | null
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await updateConcertMusicianFee(concertMusicianId, agreedFee, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof MusicianServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar cachê do músico." };
  }
}
