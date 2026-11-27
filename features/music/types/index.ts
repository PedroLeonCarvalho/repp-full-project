import type { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";

export type MusicalKey = (typeof MUSICAL_KEYS)[number];
export type MusicGenre = (typeof MUSIC_GENRES)[number];

// A song in the customer's library (customer_musics)
export interface Music {
  id: string;               // customer_musics.id
  customerId: string;
  title: string;
  artist: string;
  lyrics: string | null;
  chords: string | null;
  originalKey: MusicalKey | null;
  preferredKey: MusicalKey | null;
  studying: boolean;
  genre: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note: string | null;
  spotifyLink: string | null;
  sheetMusicFile: string | null;     // public URL derived from sheetMusicFileId
  sheetMusicFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Input for creating a new library song
export interface CreateMusicInput {
  title: string;
  artist: string;
  lyrics?: string | null;
  chords?: string | null;
  originalKey?: MusicalKey | null;
  preferredKey?: MusicalKey | null;
  studying?: boolean;
  genre?: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note?: string | null;
  spotifyLink?: string | null;
  sheetMusicFileId?: string | null;
}

// Update input: title and artist are immutable after creation
export interface UpdateMusicInput {
  id: string;
  lyrics?: string | null;
  chords?: string | null;
  originalKey?: MusicalKey | null;
  preferredKey?: MusicalKey | null;
  studying?: boolean;
  genre?: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note?: string | null;
  spotifyLink?: string | null;
  sheetMusicFileId?: string | null;
}

export interface MusicFilter {
  search?: string;
  genre?: MusicGenre;
  genres?: MusicGenre[];
  originalKey?: MusicalKey;
  preferredKey?: MusicalKey;
  studying?: boolean;
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


