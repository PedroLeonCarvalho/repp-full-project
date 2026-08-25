import type { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";

export type MusicalKey = (typeof MUSICAL_KEYS)[number];
export type MusicGenre = (typeof MUSIC_GENRES)[number];

export interface Music {
  id: string;
  customerId: string;
  title: string;
  artist: string;
  lyrics: string | null;
  originalKey: MusicalKey | null;
  preferredKey: MusicalKey | null;
  skillLevel: boolean;
  genre: MusicGenre | null;
  note: string | null;
  spotifyLink: string | null;
  sheetMusicFile: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMusicInput {
  title: string;
  artist: string;
  lyrics?: string | null;
  originalKey?: MusicalKey | null;
  preferredKey?: MusicalKey | null;
  skillLevel?: boolean;
  genre?: MusicGenre | null;
  note?: string | null;
  spotifyLink?: string | null;
  sheetMusicFile?: string | null;
}

export interface UpdateMusicInput extends Partial<CreateMusicInput> {
  id: string;
}

export interface MusicFilter {
  search?: string;
  genre?: MusicGenre;
  originalKey?: MusicalKey;
  preferredKey?: MusicalKey;
  skillLevel?: boolean;
  artist?: string;
}

export interface LyricsSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration?: number | null;
  plainLyrics: string;
}

export interface SearchLyricsInput {
  title: string;
  artist?: string;
}

