"use server";

import { revalidatePath } from "next/cache";
import { requireAuthCustomerId } from "@/features/auth/services/auth-service";
import {
  addMusicsToSetlist,
  createConcert,
  deleteConcert,
  disableConcertShare,
  duplicateConcert,
  enableConcertShare,
  getConcertById,
  getSharedConcertByToken,
  listConcertsByProject,
  removeSetlistItem,
  reorderSetlist,
  updateConcert,
  ConcertServiceError,
} from "../services/concert-service";
import type {
  Concert,
  ConcertWithSetlist,
  CreateConcertInput,
  PublicSharedConcert,
  UpdateConcertInput,
} from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createConcertAction(
  input: CreateConcertInput
): Promise<ActionResult<Concert>> {
  try {
    const customerId = await requireAuthCustomerId();
    const created = await createConcert(input, customerId);
    revalidatePath("/");
    return { success: true, data: created };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao cadastrar apresentação." };
  }
}

export async function updateConcertAction(
  id: string,
  input: UpdateConcertInput
): Promise<ActionResult<Concert>> {
  try {
    const customerId = await requireAuthCustomerId();
    const updated = await updateConcert(id, input, customerId);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao atualizar apresentação." };
  }
}

export async function deleteConcertAction(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await deleteConcert(id, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao excluir apresentação." };
  }
}

export async function getConcertByIdAction(
  id: string
): Promise<ActionResult<ConcertWithSetlist | null>> {
  try {
    const customerId = await requireAuthCustomerId();
    const item = await getConcertById(id, customerId);
    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar apresentação." };
  }
}

export async function listConcertsByProjectAction(
  projectId: string
): Promise<ActionResult<ConcertWithSetlist[]>> {
  try {
    const customerId = await requireAuthCustomerId();
    const items = await listConcertsByProject(projectId, customerId);
    return { success: true, data: items };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao listar apresentações." };
  }
}

export async function duplicateConcertAction(
  concertId: string
): Promise<ActionResult<ConcertWithSetlist>> {
  try {
    const customerId = await requireAuthCustomerId();
    const cloned = await duplicateConcert(concertId, customerId);
    revalidatePath("/");
    return { success: true, data: cloned };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao duplicar apresentação." };
  }
}

export async function addMusicsToSetlistAction(
  concertId: string,
  musicIds: string[]
): Promise<ActionResult<{ addedCount: number }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await addMusicsToSetlist(concertId, musicIds, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao adicionar músicas ao setlist." };
  }
}

export async function removeSetlistItemAction(
  concertId: string,
  setlistItemId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await removeSetlistItem(concertId, setlistItemId, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao remover música do setlist." };
  }
}

export async function reorderSetlistAction(
  concertId: string,
  orderedItemIds: string[]
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const result = await reorderSetlist(concertId, orderedItemIds, customerId);
    revalidatePath("/");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao reordenar setlist." };
  }
}

export async function enableConcertShareAction(
  concertId: string
): Promise<ActionResult<{ shareToken: string; isShareEnabled: boolean }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const res = await enableConcertShare(concertId, customerId);
    revalidatePath("/");
    return { success: true, data: res };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao ativar compartilhamento." };
  }
}

export async function disableConcertShareAction(
  concertId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const customerId = await requireAuthCustomerId();
    const res = await disableConcertShare(concertId, customerId);
    revalidatePath("/");
    return { success: true, data: res };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao desativar compartilhamento." };
  }
}

export async function getSharedConcertAction(
  token: string
): Promise<ActionResult<PublicSharedConcert | null>> {
  try {
    const res = await getSharedConcertByToken(token);
    return { success: true, data: res };
  } catch (err) {
    if (err instanceof ConcertServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao consultar apresentação compartilhada." };
  }
}
