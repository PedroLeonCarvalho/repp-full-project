import type { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";

export type MusicalKey = (typeof MUSICAL_KEYS)[number];
export type MusicGenre = (typeof MUSIC_GENRES)[number];

// Catalog entry returned by autocomplete search
export interface MusicCatalogEntry {
  id: string;
  title: string;
  artist: string;
}

// Full catalog entry with content fields (matches DB row)
export interface MusicCatalogFull extends MusicCatalogEntry {
  lyrics: string | null;
  chords: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Merged view of customer_musics + music_catalog (the main app entity)
export interface Music {
  id: string;               // customer_musics.id
  musicCatalogId: string;
  customerId: string;
  title: string;            // from music_catalog
  artist: string;           // from music_catalog
  lyrics: string | null;    // COALESCE(customer override, catalog value)
  chords: string | null;    // COALESCE(customer override, catalog value)
  originalKey: MusicalKey | null;
  preferredKey: MusicalKey | null;
  skillLevel: boolean;
  genre: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note: string | null;
  spotifyLink: string | null;
  sheetMusicFile: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Input for creating a new customer music (title+artist used for catalog lookup/upsert)
export interface CreateMusicInput {
  title: string;
  artist: string;
  lyrics?: string | null;
  chords?: string | null;
  originalKey?: MusicalKey | null;
  preferredKey?: MusicalKey | null;
  skillLevel?: boolean;
  genre?: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note?: string | null;
  spotifyLink?: string | null;
  sheetMusicFile?: string | null;
}

// Update input: title and artist are immutable after creation
export interface UpdateMusicInput {
  id: string;
  lyrics?: string | null;
  chords?: string | null;
  originalKey?: MusicalKey | null;
  preferredKey?: MusicalKey | null;
  skillLevel?: boolean;
  genre?: MusicGenre | null;
  genres?: MusicGenre[] | null;
  note?: string | null;
  spotifyLink?: string | null;
  sheetMusicFile?: string | null;
}

export interface MusicFilter {
  search?: string;
  genre?: MusicGenre;
  genres?: MusicGenre[];
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

/** Raw response from the REPP CifraClub API */
export interface ReppCifraClubApiResponse {
  artist: string;
  name: string;
  cifraclub_url: string;
  key: string | null;
  cifra: string[];
}

/** Normalized chord search result returned to the form after ChordPro conversion */
export interface ChordSearchResult {
  title: string;
  artist: string;
  key: string | null;
  chordpro: string;
}

