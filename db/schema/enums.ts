import { pgEnum } from "drizzle-orm/pg-core";

export const MUSICAL_KEYS = [
  // A keys
  "Ab",
  "A",
  "A#",
  "Abm",
  "Am",
  "A#m",
  // B keys
  "Bb",
  "B",
  "Bbm",
  "Bm",
  // C keys
  "Cb",
  "C",
  "C#",
  "Cm",
  "C#m",
  // D keys
  "Db",
  "D",
  "D#",
  "Dbm",
  "Dm",
  "D#m",
  // E keys
  "Eb",
  "E",
  "Ebm",
  "Em",
  // F keys
  "F",
  "F#",
  "Fm",
  "F#m",
  // G keys
  "Gb",
  "G",
  "G#",
  "Gbm",
  "Gm",
  "G#m",
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
  "GOSPEL",
  "FUNK",
  "RAP",
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
