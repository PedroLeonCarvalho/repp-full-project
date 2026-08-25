import type { ExternalLyricsItem, SearchLyricsQuery } from "./types";

export interface ILyricsProvider {
  searchLyrics(query: SearchLyricsQuery): Promise<ExternalLyricsItem[]>;
}
