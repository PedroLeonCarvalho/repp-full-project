import { z } from "zod";
import type { ILyricsProvider } from "../lyrics-provider";
import type { ExternalLyricsItem, SearchLyricsQuery } from "../types";

const lrclibItemSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string().optional(),
  trackName: z.string().optional(),
  artistName: z.string().optional().nullable(),
  albumName: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  instrumental: z.boolean().optional().nullable(),
  plainLyrics: z.string().optional().nullable(),
  syncedLyrics: z.string().optional().nullable(),
});

const lrclibResponseSchema = z.array(lrclibItemSchema);

export class LrclibProvider implements ILyricsProvider {
  private readonly baseUrl = "https://lrclib.net/api";
  private readonly userAgent =
    "REPP-Music-App/1.0 (https://github.com/PedroLeonCarvalho/repp-full-project)";

  async searchLyrics(query: SearchLyricsQuery): Promise<ExternalLyricsItem[]> {
    const trimmedTitle = query.title.trim();
    const trimmedArtist = query.artist?.trim() || "";

    if (!trimmedTitle) {
      return [];
    }

    try {
      // 1. Try specific search with track_name and artist_name if artist is provided
      let results: ExternalLyricsItem[] = [];

      if (trimmedArtist) {
        results = await this.fetchSearch({
          track_name: trimmedTitle,
          artist_name: trimmedArtist,
        });
      }

      // 2. If no results found or no artist provided, try general query search
      if (results.length === 0) {
        const generalQuery = trimmedArtist
          ? `${trimmedTitle} ${trimmedArtist}`
          : trimmedTitle;
        results = await this.fetchSearch({ q: generalQuery });
      }

      return results;
    } catch (err) {
      console.error("[LrclibProvider] Error fetching lyrics:", err);
      throw new Error(
        "Não foi possível consultar as letras no momento. Tente novamente mais tarde."
      );
    }
  }

  private async fetchSearch(
    params: Record<string, string>
  ): Promise<ExternalLyricsItem[]> {
    const url = new URL(`${this.baseUrl}/search`);
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`LRCLIB returned status ${res.status}`);
    }

    const json = await res.json();
    const parsed = lrclibResponseSchema.safeParse(json);

    if (!parsed.success) {
      console.warn("[LrclibProvider] Invalid response format:", parsed.error);
      return [];
    }

    // Filter to only items with valid, non-empty plainLyrics and not purely instrumental
    return parsed.data
      .filter((item) => {
        if (item.instrumental === true) return false;
        if (!item.plainLyrics || item.plainLyrics.trim() === "") return false;
        return true;
      })
      .map((item) => ({
        id: item.id,
        title: item.trackName || item.name || "Sem título",
        artist: item.artistName || "Desconhecido",
        album: item.albumName || null,
        duration: item.duration ?? null,
        plainLyrics: item.plainLyrics!.trim(),
      }));
  }
}
