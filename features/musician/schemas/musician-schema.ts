import { z } from "zod";

export const createMusicianSchema = z.object({
  name: z.string().trim().min(1, "O nome do músico é obrigatório."),
  instrument: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  cpf: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  address: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  note: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
});

export const updateMusicianSchema = createMusicianSchema.partial();

export const addMusicianToConcertSchema = z.object({
  concertId: z.string().uuid("ID de apresentação inválido."),
  musicianId: z.string().uuid("ID de músico inválido."),
  agreedFee: z.number().min(0, "O cachê não pode ser negativo.").nullish(),
});
