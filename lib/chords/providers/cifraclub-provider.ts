import type { ReppCifraClubApiResponse } from "@/features/music/types";

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

/**
 * Converts a free-form artist or song title into the URL slug format used by
 * the REPP CifraClub API.
 *
 * Rules:
 * - Normalize to NFD and strip combining diacritics (é → e, ã → a …)
 * - Lowercase
 * - Replace spaces, dots, underscores and slashes with hyphens
 * - Remove any character that is not alphanumeric or a hyphen
 * - Collapse consecutive hyphens
 * - Strip leading/trailing hyphens
 */
function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s._/\\]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export const CIFRACLUB_REMOTE_URL = "https://repp-cifraclub-api.onrender.com";
export const CIFRACLUB_LOCAL_URL = "http://localhost:5000";

/**
 * Resolves the CifraClub API base URL based on configuration and environment:
 * 1. Direct constructor parameter (if provided)
 * 2. Explicit process.env.CIFRACLUB_API_BASE_URL
 * 3. process.env.CIFRACLUB_API_ENV ("local" or "remote")
 * 4. Automatic default:
 *    - In production (deploy) -> CIFRACLUB_REMOTE_URL
 *    - In development/testing -> CIFRACLUB_LOCAL_URL
 */
export function getCifraclubApiBaseUrl(customBaseUrl?: string): string {
  if (customBaseUrl) {
    return customBaseUrl;
  }

  if (process.env.CIFRACLUB_API_BASE_URL) {
    return process.env.CIFRACLUB_API_BASE_URL;
  }

  const envMode = process.env.CIFRACLUB_API_ENV?.toLowerCase().trim();
  if (envMode === "remote") {
    return CIFRACLUB_REMOTE_URL;
  }
  if (envMode === "local") {
    return CIFRACLUB_LOCAL_URL;
  }

  return process.env.NODE_ENV === "production"
    ? CIFRACLUB_REMOTE_URL
    : CIFRACLUB_LOCAL_URL;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class CifraclubProvider {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = getCifraclubApiBaseUrl(baseUrl);
  }


  /**
   * Returns the currently configured base URL for CifraClub API.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Fetches chord data for the given artist + song title (or explicit slugs)
   * from the REPP CifraClub API.
   *
   * @throws Error with a user-friendly Portuguese message on failure.
   */
  async fetchChords(
    artist: string,
    title: string,
    slugs?: { artistSlug?: string; songSlug?: string }
  ): Promise<ReppCifraClubApiResponse> {
    const artistSlug = slugs?.artistSlug || toSlug(artist);
    const songSlug = slugs?.songSlug || toSlug(title);

    if (!artistSlug || !songSlug) {
      throw new Error(
        "Artista e título são necessários para buscar a cifra."
      );
    }

    const url = `${this.baseUrl}/artists/${artistSlug}/songs/${songSlug}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
        // 15-second timeout — the Render free tier has cold-start latency
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error(
          "O servidor de cifras demorou muito para responder. Tente novamente."
        );
      }

      const isLocal =
        this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1");

      if (isLocal) {
        throw new Error(
          `Não foi possível conectar à API local de cifras (${this.baseUrl}). Certifique-se de que ela está rodando (execute 'make run-local' ou './run_local.sh' no projeto cifraclub-api) ou configure CIFRACLUB_API_ENV=remote.`
        );
      }

      throw new Error(
        "Não foi possível conectar ao servidor de cifras. Verifique sua conexão."
      );
    }

    if (response.status === 404) {
      throw new Error(
        `Cifra não encontrada para "${title}" de "${artist}".`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Erro ao buscar cifra (HTTP ${response.status}).`
      );
    }

    const data = (await response.json()) as ReppCifraClubApiResponse & {
      error?: string;
    };

    if (data.error) {
      if (data.error.includes("404")) {
        throw new Error(`Cifra não encontrada para "${title}" de "${artist}".`);
      }
      throw new Error(`Erro retornado pela API de cifras: ${data.error}`);
    }

    return data;
  }
}

