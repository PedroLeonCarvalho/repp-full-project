import { z } from "zod";
import { MUSICAL_KEYS, MUSIC_GENRES } from "@/db/schema/enums";

export const musicalKeySchema = z.enum(MUSICAL_KEYS);
export const musicGenreSchema = z.enum(MUSIC_GENRES);

export const musicCatalogSearchSchema = z.object({
  query: z.string().min(4, "Digite pelo menos 4 caracteres para buscar"),
});

export const createMusicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "O título da música é obrigatório")
    .max(255, "O título deve ter no máximo 255 caracteres"),
  artist: z
    .string()
    .trim()
    .min(1, "O artista/intérprete é obrigatório")
    .max(255, "O artista deve ter no máximo 255 caracteres"),
  lyrics: z.string().trim().optional().nullable(),
  chords: z.string().trim().optional().nullable(),
  originalKey: musicalKeySchema.optional().nullable(),
  preferredKey: musicalKeySchema.optional().nullable(),
  studying: z.boolean().default(false),
  genre: musicGenreSchema.optional().nullable(),
  genres: z.array(musicGenreSchema).max(3, "Selecione no máximo 3 estilos").optional().nullable(),
  note: z.string().trim().optional().nullable(),
  spotifyLink: z
    .string()
    .trim()
    .url("Link do Spotify deve ser uma URL válida")
    .optional()
    .nullable()
    .or(z.literal("")),
  sheetMusicFile: z.string().trim().optional().nullable(),
  isCustom: z.boolean().default(false),
});

// Update: title and artist are excluded (immutable after creation)
export const updateMusicSchema = z.object({
  id: z.string().uuid("ID da música inválido"),
  lyrics: z.string().trim().optional().nullable(),
  chords: z.string().trim().optional().nullable(),
  originalKey: musicalKeySchema.optional().nullable(),
  preferredKey: musicalKeySchema.optional().nullable(),
  studying: z.boolean().optional(),
  genre: musicGenreSchema.optional().nullable(),
  genres: z.array(musicGenreSchema).max(3, "Selecione no máximo 3 estilos").optional().nullable(),
  note: z.string().trim().optional().nullable(),
  spotifyLink: z
    .string()
    .trim()
    .url("Link do Spotify deve ser uma URL válida")
    .optional()
    .nullable()
    .or(z.literal("")),
  sheetMusicFile: z.string().trim().optional().nullable(),
});

export const musicFilterSchema = z.object({
  search: z.string().optional(),
  genre: musicGenreSchema.optional(),
  originalKey: musicalKeySchema.optional(),
  preferredKey: musicalKeySchema.optional(),
  studying: z.boolean().optional(),
  artist: z.string().optional(),
});

export type CreateMusicSchemaInput = z.infer<typeof createMusicSchema>;
export type UpdateMusicSchemaInput = z.infer<typeof updateMusicSchema>;
export type MusicFilterSchemaInput = z.infer<typeof musicFilterSchema>;
export type MusicCatalogSearchInput = z.infer<typeof musicCatalogSearchSchema>;
