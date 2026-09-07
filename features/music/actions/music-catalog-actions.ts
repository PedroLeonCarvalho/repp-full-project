"use server";

import { requireAuthCustomerId } from "@/features/auth/services/auth-service";
import { searchCatalog } from "../services/music-catalog-service";
import type { MusicCatalogEntry } from "../types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function searchCatalogAction(
  query: string
): Promise<ActionResult<MusicCatalogEntry[]>> {
  try {
    if (!query || query.trim().length < 4) {
      return { success: true, data: [] };
    }
    // Requires auth but results are global (not scoped to customer)
    await requireAuthCustomerId();
    const results = await searchCatalog(query);
    return { success: true, data: results };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Erro inesperado ao buscar no catálogo." };
  }
}
