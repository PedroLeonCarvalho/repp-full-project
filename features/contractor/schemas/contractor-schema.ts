import { z } from "zod";

export const createContractorSchema = z.object({
  contactPersonName: z
    .string()
    .trim()
    .min(1, "O nome do responsável/contato é obrigatório."),
  establishmentOrEventName: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  documentNumber: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((val) => val || null),
  email: z
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

export const updateContractorSchema = createContractorSchema.partial();
