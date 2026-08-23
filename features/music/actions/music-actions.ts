"use server";

import { revalidatePath } from "next/cache";
import {
  createMusic,
  deleteMusic,
  getMusicById,
  listMusics,
  updateMusic,
  MusicServiceError,
} from "../services/music-service";
import type {
  CreateMusicInput,
  Music,
  MusicFilter,
  UpdateMusicInput,
} from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createMusicAction(
  input: CreateMusicInput,
  customerId: string
): Promise<ActionResult<Music>> {
  try {
    const created = await createMusic(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof MusicServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao cadastrar música." };
  }
}

export async function updateMusicAction(
  id: string,
  input: Omit<UpdateMusicInput, "id">,
  customerId: string
): Promise<ActionResult<Music>> {
  try {
    const updated = await updateMusic(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof MusicServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar música." };
  }
}

export async function deleteMusicAction(
  id: string,
  customerId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const result = await deleteMusic(id, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof MusicServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao excluir música." };
  }
}

export async function listMusicsAction(
  customerId: string,
  filters?: MusicFilter
): Promise<ActionResult<Music[]>> {
  try {
    const items = await listMusics(customerId, filters);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar músicas." };
  }
}

export async function getMusicByIdAction(
  id: string,
  customerId: string
): Promise<ActionResult<Music | null>> {
  try {
    const item = await getMusicById(id, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar música." };
  }
}
