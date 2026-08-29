import { z } from "zod";
import { PAYMENT_STATUSES } from "@/db/schema/enums";

const optionalUuid = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z.string().uuid("ID inválido").nullable().optional()
);

const optionalString = (max: number, msg?: string) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z.string().trim().max(max, msg).nullable().optional()
  );


export const concertMusicianItemSchema = z.object({
  musicianId: z.string().uuid("ID de músico inválido"),
  agreedFee: z.number().min(0, "O cachê não pode ser negativo").optional().nullable(),
});

export const createConcertSchema = z.object({
  projectId: z.string().uuid("ID de projeto inválido"),
  contractorId: optionalUuid,
  title: z
    .string()
    .trim()
    .min(1, "O título ou nome do evento é obrigatório")
    .max(255, "O título deve ter no máximo 255 caracteres"),
  location: optionalString(255, "O local deve ter no máximo 255 caracteres"),
  presentationDate: z.union([z.string().min(1, "A data da apresentação é obrigatória"), z.date()]),
  startTime: optionalString(10),
  finishTime: optionalString(10),
  durationInHours: z.number().min(0).max(48).optional().nullable(),
  totalBreakTime: z.number().int().min(0).max(720).optional().nullable(),
  agreedFee: z.number().min(0).optional().nullable(),
  travelCost: z.number().min(0).optional().nullable(),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("PENDING"),
  note: optionalString(2000),
  musicians: z.array(concertMusicianItemSchema).optional(),
});

export const updateConcertSchema = z.object({
  contractorId: optionalUuid,
  title: z
    .string()
    .trim()
    .min(1, "O título do evento não pode ficar vazio")
    .max(255, "O título deve ter no máximo 255 caracteres")
    .optional(),
  location: optionalString(255),
  presentationDate: z.union([z.string(), z.date()]).optional(),
  startTime: optionalString(10),
  finishTime: optionalString(10),
  durationInHours: z.number().min(0).max(48).optional().nullable(),
  totalBreakTime: z.number().int().min(0).max(720).optional().nullable(),
  agreedFee: z.number().min(0).optional().nullable(),
  travelCost: z.number().min(0).optional().nullable(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  note: optionalString(2000),
  musicians: z.array(concertMusicianItemSchema).optional(),
});


export const addMusicsToSetlistSchema = z.object({
  concertId: z.string().uuid("ID de apresentação inválido"),
  musicIds: z.array(z.string().uuid("ID de música inválido")).min(1, "Selecione ao menos uma música"),
});

export const reorderSetlistSchema = z.object({
  concertId: z.string().uuid("ID de apresentação inválido"),
  orderedMusicIds: z.array(z.string().uuid("ID de música inválido")),
});

export type CreateConcertSchemaInput = z.infer<typeof createConcertSchema>;
export type UpdateConcertSchemaInput = z.infer<typeof updateConcertSchema>;
