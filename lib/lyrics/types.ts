export interface ExternalLyricsItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration?: number | null;
  plainLyrics: string;
}

export interface SearchLyricsQuery {
  title: string;
  artist?: string;
}
