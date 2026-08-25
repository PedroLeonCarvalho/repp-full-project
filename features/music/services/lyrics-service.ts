import { LrclibProvider } from "@/lib/lyrics/providers/lrclib-provider";
import type { ILyricsProvider } from "@/lib/lyrics/lyrics-provider";
import type { LyricsSearchResult, SearchLyricsInput } from "../types";

export class LyricsService {
  constructor(private readonly provider: ILyricsProvider = new LrclibProvider()) {}

  async searchLyrics(input: SearchLyricsInput): Promise<LyricsSearchResult[]> {
    const title = input.title?.trim() || "";
    const artist = input.artist?.trim() || "";

    if (!title) {
      return [];
    }

    const results = await this.provider.searchLyrics({
      title,
      artist: artist || undefined,
    });

    return results.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album ?? null,
      duration: item.duration ?? null,
      plainLyrics: item.plainLyrics,
    }));
  }
}

export const lyricsService = new LyricsService();
