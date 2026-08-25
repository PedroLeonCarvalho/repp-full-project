import { pgEnum } from "drizzle-orm/pg-core";

export const MUSICAL_KEYS = [
  // Major keys
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Cb",
  // Minor keys
  "Cm",
  "C#m",
  "Dbm",
  "Dm",
  "D#m",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gbm",
  "Gm",
  "G#m",
  "Abm",
  "Am",
  "A#m",
  "Bbm",
  "Bm",
] as const;

export const MUSIC_GENRES = [
  "ROCK",
  "MPB",
  "JAZZ",
  "BOSSA_NOVA",
  "SAMBA",
  "BLUES",
  "POP_INTERNATIONAL",
  "POP_BRAZILIAN",
  "AXE",
  "SERTANEJO",
  "FORRO",
  "OTHER",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
] as const;

export const musicalKeyEnum = pgEnum("musical_key", MUSICAL_KEYS);
export const musicGenreEnum = pgEnum("music_genre", MUSIC_GENRES);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
