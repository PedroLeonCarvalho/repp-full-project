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

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class CifraclubProvider {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ??
      process.env.CIFRACLUB_API_BASE_URL ??
      "https://repp-cifraclub-api.onrender.com";
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

    const data = (await response.json()) as ReppCifraClubApiResponse;
    return data;
  }
}
